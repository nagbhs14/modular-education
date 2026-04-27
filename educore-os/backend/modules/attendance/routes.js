const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

const ATTENDANCE_THRESHOLD = 75; // percent

// ─── MARK attendance (Teacher/Admin) ───
router.post('/mark', requireRole(['admin', 'teacher']), (req, res) => {
  // Expects: { date, records: [{ student_id, status }] }
  const { date, records } = req.body;
  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Date and records array required' });
  }

  const stmt = db.prepare(`
    INSERT INTO attendance (tenant_id, student_id, date, status, marked_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(tenant_id, student_id, date)
    DO UPDATE SET status = excluded.status, marked_by = excluded.marked_by
  `);

  const insertMany = db.transaction((recs) => {
    const alerts = [];
    for (const r of recs) {
      stmt.run(req.tenant.id, r.student_id, date, r.status, req.user.userId);

      // ─── AUTO-ALERT: Check attendance percentage after marking ───
      if (r.status === 'absent') {
        const total = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE tenant_id = ? AND student_id = ?').get(req.tenant.id, r.student_id).c;
        const present = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE tenant_id = ? AND student_id = ? AND status = 'present'").get(req.tenant.id, r.student_id).c;
        const pct = total > 0 ? Math.round((present / total) * 100) : 100;

        if (pct < ATTENDANCE_THRESHOLD) {
          const student = db.prepare('SELECT user_id, system_uid FROM students WHERE id = ? AND tenant_id = ?').get(r.student_id, req.tenant.id);
          if (student) {
            // Notify the student
            db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
              .run(req.tenant.id, student.user_id, 'attendance_alert', '⚠️ Low Attendance Alert',
                `Your attendance has dropped to ${pct}% — below the ${ATTENDANCE_THRESHOLD}% threshold. Please improve attendance immediately.`);
            
            // Also notify admin
            const admins = db.prepare("SELECT id FROM users WHERE tenant_id = ? AND role = 'admin'").all(req.tenant.id);
            admins.forEach(a => {
              db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
                .run(req.tenant.id, a.id, 'attendance_alert', 'Student Low Attendance',
                  `Student ${student.system_uid} attendance is at ${pct}% — below threshold.`);
            });

            alerts.push({ student_id: r.student_id, uid: student.system_uid, percentage: pct });
          }
        }
      }
    }
    return alerts;
  });

  try {
    const alerts = insertMany(records);
    res.json({ 
      success: true, 
      message: `Marked attendance for ${records.length} students`,
      alerts: alerts.length > 0 ? alerts : undefined
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET attendance for a date & class (Teacher/Admin) ───
router.get('/class/:classId', requireRole(['admin', 'teacher']), (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const records = db.prepare(`
    SELECT s.id as student_id, u.name as student_name, s.system_uid,
      COALESCE(a.status, 'unmarked') as status
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ? AND a.tenant_id = ?
    WHERE s.tenant_id = ? AND s.class_id = ?
    ORDER BY u.name
  `).all(date, req.tenant.id, req.tenant.id, req.params.classId);
  res.json(records);
});

// ─── GET attendance percentage for a student ───
router.get('/student/:studentId/percentage', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE tenant_id = ? AND student_id = ?').get(req.tenant.id, req.params.studentId);
  const present = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE tenant_id = ? AND student_id = ? AND status = 'present'").get(req.tenant.id, req.params.studentId);

  const percentage = total.count > 0 ? Math.round((present.count / total.count) * 100) : 0;
  const alert = percentage < ATTENDANCE_THRESHOLD;

  res.json({ 
    total: total.count, 
    present: present.count, 
    percentage, 
    alert,
    threshold: ATTENDANCE_THRESHOLD
  });
});

// ─── ATTENDANCE TRENDS (Teacher/Admin) ───
router.get('/trends/:studentId', requireRole(['admin', 'teacher']), (req, res) => {
  const studentId = req.params.studentId;

  // Last 7 days
  const last7 = db.prepare(`
    SELECT date, status FROM attendance 
    WHERE tenant_id = ? AND student_id = ? 
    ORDER BY date DESC LIMIT 7
  `).all(req.tenant.id, studentId);

  // Last 30 days
  const last30 = db.prepare(`
    SELECT date, status FROM attendance 
    WHERE tenant_id = ? AND student_id = ? 
    ORDER BY date DESC LIMIT 30
  `).all(req.tenant.id, studentId);

  const calc = (records) => {
    if (records.length === 0) return 0;
    const present = records.filter(r => r.status === 'present').length;
    return Math.round((present / records.length) * 100);
  };

  res.json({
    week: { records: last7, percentage: calc(last7) },
    month: { records: last30, percentage: calc(last30) }
  });
});

// ─── GET own attendance (Student) ───
router.get('/my', requireRole(['student']), (req, res) => {
  const student = db.prepare('SELECT id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
  if (!student) return res.json({ records: [], percentage: 0 });

  const records = db.prepare('SELECT date, status FROM attendance WHERE tenant_id = ? AND student_id = ? ORDER BY date DESC LIMIT 30').all(req.tenant.id, student.id);
  const total = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE tenant_id = ? AND student_id = ?').get(req.tenant.id, student.id);
  const present = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE tenant_id = ? AND student_id = ? AND status = 'present'").get(req.tenant.id, student.id);

  const percentage = total.count > 0 ? Math.round((present.count / total.count) * 100) : 0;

  res.json({ 
    records, 
    percentage,
    total: total.count,
    present: present.count,
    alert: percentage < ATTENDANCE_THRESHOLD,
    threshold: ATTENDANCE_THRESHOLD
  });
});

// ─── ADMIN: All class attendance report ───
router.get('/report', requireRole(['admin']), (req, res) => {
  const report = db.prepare(`
    SELECT c.id as class_id, c.name as class_name,
      COUNT(DISTINCT s.id) as student_count,
      COUNT(DISTINCT a.date) as days_tracked,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as total_present,
      COUNT(a.id) as total_entries
    FROM classes c
    LEFT JOIN students s ON s.class_id = c.id AND s.tenant_id = ?
    LEFT JOIN attendance a ON a.student_id = s.id AND a.tenant_id = ?
    WHERE c.tenant_id = ?
    GROUP BY c.id
  `).all(req.tenant.id, req.tenant.id, req.tenant.id);

  report.forEach(r => {
    r.avg_percentage = r.total_entries > 0 ? Math.round((r.total_present / r.total_entries) * 100) : 0;
  });

  res.json(report);
});

module.exports = router;
