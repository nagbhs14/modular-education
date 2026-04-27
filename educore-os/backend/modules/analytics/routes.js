const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

// ─── ADMIN: Full overview ───
router.get('/overview', requireRole(['admin']), (req, res) => {
  const tid = req.tenant.id;

  const studentCount = db.prepare('SELECT COUNT(*) as c FROM students WHERE tenant_id = ?').get(tid).c;
  const teacherCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE tenant_id = ? AND role = 'teacher'").get(tid).c;
  const classCount = db.prepare('SELECT COUNT(*) as c FROM classes WHERE tenant_id = ?').get(tid).c;
  const assignmentCount = db.prepare('SELECT COUNT(*) as c FROM assignments WHERE tenant_id = ?').get(tid).c;

  // Attendance Average
  const attTotal = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE tenant_id = ?').get(tid).c;
  const attPresent = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE tenant_id = ? AND status = 'present'").get(tid).c;
  const avgAttendance = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

  // Fee collection
  const feeStats = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_paid ELSE 0 END), 0) as collected,
      COALESCE(SUM(f.amount), 0) as expected
    FROM payments p JOIN fees f ON p.fee_id = f.id
    WHERE p.tenant_id = ?
  `).get(tid);

  // Top performing students (by average result score)
  const topStudents = db.prepare(`
    SELECT u.name, s.system_uid, ROUND(AVG(r.score), 1) as avg_score
    FROM results r
    JOIN students s ON r.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE r.tenant_id = ? AND r.published = 1
    GROUP BY s.id
    ORDER BY avg_score DESC
    LIMIT 5
  `).all(tid);

  // Class-wise averages
  const classAverages = db.prepare(`
    SELECT c.name as class_name, ROUND(AVG(r.score), 1) as avg_score, COUNT(DISTINCT s.id) as students
    FROM results r
    JOIN students s ON r.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE r.tenant_id = ? AND r.published = 1
    GROUP BY c.id
  `).all(tid);

  res.json({
    counts: { students: studentCount, teachers: teacherCount, classes: classCount, assignments: assignmentCount },
    attendance: { percentage: avgAttendance, total: attTotal, present: attPresent },
    fees: feeStats,
    topStudents,
    classAverages
  });
});

// ─── TEACHER: Subject performance ───
router.get('/teacher', requireRole(['teacher']), (req, res) => {
  const tid = req.tenant.id;
  const uid = req.user.userId;

  // Assignments created by this teacher
  const myAssignments = db.prepare(`
    SELECT a.id, a.title, 
      (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id = a.id) as submissions,
      (SELECT ROUND(AVG(sub.grade), 1) FROM submissions sub WHERE sub.assignment_id = a.id AND sub.grade IS NOT NULL) as avg_grade
    FROM assignments a
    WHERE a.tenant_id = ? AND a.created_by = ?
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all(tid, uid);

  // Results published by this teacher
  const recentResults = db.prepare(`
    SELECT r.exam_name, ROUND(AVG(r.score), 1) as avg_score, COUNT(*) as student_count
    FROM results r
    WHERE r.tenant_id = ?
    GROUP BY r.exam_name
    ORDER BY r.id DESC
    LIMIT 5
  `).all(tid);

  res.json({ myAssignments, recentResults });
});

module.exports = router;
