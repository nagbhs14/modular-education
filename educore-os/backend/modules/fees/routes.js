const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

// ─── AUTO-UPDATE OVERDUE FEES ───
// This runs on every fees request to auto-mark overdue payments
function autoUpdateOverdue(tenantId) {
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`
    UPDATE payments SET status = 'overdue' 
    WHERE tenant_id = ? AND status = 'pending' 
    AND fee_id IN (SELECT id FROM fees WHERE due_date IS NOT NULL AND due_date < ? AND tenant_id = ?)
  `).run(tenantId, today, tenantId);
}

// ─── GET all fee structures (Admin/Teacher) ───
router.get('/', (req, res) => {
  autoUpdateOverdue(req.tenant.id);

  if (req.user.role === 'student') {
    // Student sees their invoices
    const student = db.prepare('SELECT id, class_id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
    if (!student) return res.json([]);

    const fees = db.prepare(`
      SELECT f.*, 
        COALESCE(p.status, 'pending') as payment_status,
        COALESCE(p.amount_paid, 0) as amount_paid,
        p.paid_at, p.id as payment_id
      FROM fees f
      LEFT JOIN payments p ON p.fee_id = f.id AND p.student_id = ? AND p.tenant_id = ?
      WHERE f.tenant_id = ? AND (f.class_id = ? OR f.class_id IS NULL)
      ORDER BY f.due_date ASC
    `).all(student.id, req.tenant.id, req.tenant.id, student.class_id);
    return res.json(fees);
  }

  const fees = db.prepare(`
    SELECT f.*, c.name as class_name
    FROM fees f
    LEFT JOIN classes c ON f.class_id = c.id
    WHERE f.tenant_id = ?
    ORDER BY f.created_at DESC
  `).all(req.tenant.id);
  res.json(fees);
});

// ─── CREATE fee structure (Admin) ───
router.post('/', requireRole(['admin']), (req, res) => {
  const { name, amount, due_date, class_id, description } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO fees (tenant_id, name, amount, due_date, class_id, description) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(req.tenant.id, name, amount, due_date || null, class_id || null, description || null);

    // Auto-create pending payment records for students
    let students;
    if (class_id) {
      students = db.prepare('SELECT id, user_id FROM students WHERE tenant_id = ? AND class_id = ?').all(req.tenant.id, class_id);
    } else {
      students = db.prepare('SELECT id, user_id FROM students WHERE tenant_id = ?').all(req.tenant.id);
    }

    const payStmt = db.prepare('INSERT OR IGNORE INTO payments (tenant_id, fee_id, student_id, status) VALUES (?, ?, ?, ?)');
    const notifStmt = db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)');
    students.forEach(s => {
      payStmt.run(req.tenant.id, info.lastInsertRowid, s.id, 'pending');
      notifStmt.run(req.tenant.id, s.user_id, 'fee', 'New Fee', `"${name}" — $${amount} due by ${due_date || 'TBD'}`);
    });

    res.status(201).json({ id: info.lastInsertRowid, name, studentsNotified: students.length });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RECORD payment (Admin) ───
router.put('/payments/:paymentId', requireRole(['admin']), (req, res) => {
  const { status, amount_paid, payment_method, transaction_id } = req.body;
  try {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND tenant_id = ?').get(req.params.paymentId, req.tenant.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    db.prepare(`
      UPDATE payments SET status = ?, amount_paid = ?, payment_method = ?, transaction_id = ?, paid_at = CASE WHEN ? = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END
      WHERE id = ? AND tenant_id = ?
    `).run(status, amount_paid, payment_method, transaction_id, status, req.params.paymentId, req.tenant.id);

    // Notify student of payment confirmation
    if (status === 'paid') {
      const student = db.prepare('SELECT user_id FROM students WHERE id = ?').get(payment.student_id);
      const fee = db.prepare('SELECT name FROM fees WHERE id = ?').get(payment.fee_id);
      if (student && fee) {
        db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
          .run(req.tenant.id, student.user_id, 'payment', '✅ Payment Confirmed', `Payment for "${fee.name}" of $${amount_paid} has been confirmed.`);
      }
    }

    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET payment details for a fee (Admin) ───
router.get('/:feeId/payments', requireRole(['admin']), (req, res) => {
  autoUpdateOverdue(req.tenant.id);
  const payments = db.prepare(`
    SELECT p.*, s.system_uid, u.name as student_name
    FROM payments p
    JOIN students s ON p.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE p.fee_id = ? AND p.tenant_id = ?
  `).all(req.params.feeId, req.tenant.id);
  res.json(payments);
});

// ─── FEE SUMMARY (Admin) ───
router.get('/summary/overview', requireRole(['admin']), (req, res) => {
  autoUpdateOverdue(req.tenant.id);
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_invoices,
      SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN p.status = 'overdue' THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN p.status = 'paid' THEN p.amount_paid ELSE 0 END) as total_collected,
      SUM(f.amount) as total_expected
    FROM payments p
    JOIN fees f ON p.fee_id = f.id
    WHERE p.tenant_id = ?
  `).get(req.tenant.id);
  res.json(summary);
});

// ─── PAYMENT RECEIPT (Admin/Student) ───
router.get('/payments/:paymentId/receipt', (req, res) => {
  const payment = db.prepare(`
    SELECT p.*, f.name as fee_name, f.amount as fee_amount, f.description as fee_description,
      s.system_uid, u.name as student_name, t.name as institution_name
    FROM payments p
    JOIN fees f ON p.fee_id = f.id
    JOIN students s ON p.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN tenants t ON p.tenant_id = t.id
    WHERE p.id = ? AND p.tenant_id = ? AND p.status = 'paid'
  `).get(req.params.paymentId, req.tenant.id);

  if (!payment) return res.status(404).json({ error: 'Receipt not found or payment not completed' });

  res.json({
    receipt_number: `RCP-${req.tenant.id}-${payment.id}`,
    institution: payment.institution_name,
    student_name: payment.student_name,
    student_uid: payment.system_uid,
    fee_name: payment.fee_name,
    fee_amount: payment.fee_amount,
    amount_paid: payment.amount_paid,
    payment_method: payment.payment_method,
    transaction_id: payment.transaction_id,
    paid_at: payment.paid_at,
    status: 'PAID'
  });
});

// ─── SEND FEE REMINDERS (Admin) ───
router.post('/reminders', requireRole(['admin']), (req, res) => {
  autoUpdateOverdue(req.tenant.id);
  
  // Find all unpaid/overdue payments
  const unpaid = db.prepare(`
    SELECT p.id, p.student_id, s.user_id, f.name as fee_name, f.amount, f.due_date, p.status
    FROM payments p
    JOIN fees f ON p.fee_id = f.id
    JOIN students s ON p.student_id = s.id
    WHERE p.tenant_id = ? AND p.status IN ('pending', 'overdue')
  `).all(req.tenant.id);

  const notifStmt = db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)');
  let sent = 0;
  unpaid.forEach(p => {
    const urgency = p.status === 'overdue' ? '🔴 OVERDUE' : '🟡 Reminder';
    notifStmt.run(req.tenant.id, p.user_id, 'fee_reminder', `${urgency}: Fee Payment`,
      `"${p.fee_name}" — $${p.amount} ${p.due_date ? 'due by ' + p.due_date : ''}. Please pay at the earliest.`);
    sent++;
  });

  res.json({ success: true, reminders_sent: sent });
});

module.exports = router;
