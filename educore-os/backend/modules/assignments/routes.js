const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');
const { uploadAssignment, uploadSubmission, getFileUrl, handleUploadError } = require('../../utils/upload');

const router = express.Router();
router.use(authMiddleware);

// ─── GET assignments (all roles) ───
router.get('/', (req, res) => {
  let assignments;
  if (req.user.role === 'student') {
    // Student sees assignments for their class
    const student = db.prepare('SELECT class_id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
    assignments = db.prepare(`
      SELECT a.*, u.name as teacher_name, c.name as class_name,
        (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id = a.id AND sub.student_id = (SELECT id FROM students WHERE user_id = ? AND tenant_id = ?)) as submitted
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.tenant_id = ? AND (a.class_id = ? OR a.class_id IS NULL)
      ORDER BY a.due_date ASC
    `).all(req.user.userId, req.tenant.id, req.tenant.id, student?.class_id);
  } else {
    assignments = db.prepare(`
      SELECT a.*, u.name as teacher_name, c.name as class_name,
        (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id = a.id) as submission_count,
        (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id = a.id AND sub.status = 'graded') as graded_count
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.tenant_id = ?
      ORDER BY a.created_at DESC
    `).all(req.tenant.id);
  }
  res.json(assignments);
});

// ─── CREATE assignment (Teacher/Admin) ───
router.post('/', requireRole(['admin', 'teacher']), uploadAssignment.single('attachment'), (req, res) => {
  const { title, description, due_date, class_id, max_score, allow_resubmission } = req.body;
  const file_url = getFileUrl(req, req.file);

  try {
    const stmt = db.prepare('INSERT INTO assignments (tenant_id, title, description, class_id, due_date, max_score, allow_resubmission, file_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(
      req.tenant.id, title, description, 
      class_id || null, due_date || null, 
      max_score || 100, allow_resubmission ? 1 : 0,
      file_url, req.user.userId
    );

    // Create notifications for students in this class
    if (class_id) {
      const students = db.prepare('SELECT user_id FROM students WHERE tenant_id = ? AND class_id = ?').all(req.tenant.id, class_id);
      const notifStmt = db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)');
      students.forEach(s => {
        notifStmt.run(req.tenant.id, s.user_id, 'assignment', 'New Assignment', `"${title}" has been posted. Due: ${due_date || 'No deadline'}`);
      });

      // Emit real-time notification
      const emitNotification = req.app.get('emitNotification');
      if (emitNotification) {
        students.forEach(s => {
          emitNotification(req.tenant.id, s.user_id, { type: 'assignment', title: 'New Assignment', message: `"${title}" has been posted.` });
        });
      }
    }

    res.status(201).json({ id: info.lastInsertRowid, title, file_url });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SUBMIT assignment (Student) ───
router.post('/:id/submit', requireRole(['student']), uploadSubmission.single('submission_file'), (req, res) => {
  const assignmentId = req.params.id;
  const { content } = req.body;
  const student = db.prepare('SELECT id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ? AND tenant_id = ?').get(assignmentId, req.tenant.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  // Check for existing submission
  const existing = db.prepare('SELECT * FROM submissions WHERE tenant_id = ? AND assignment_id = ? AND student_id = ?').get(req.tenant.id, assignmentId, student.id);
  if (existing && existing.status === 'graded' && !assignment.allow_resubmission) {
    return res.status(400).json({ error: 'Assignment already graded. Resubmission not allowed.' });
  }

  // Determine if late
  let status = 'submitted';
  if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
    status = 'late';
  }

  const file_url = getFileUrl(req, req.file);
  const resubCount = existing ? (existing.resubmission_count || 0) + 1 : 0;

  try {
    const stmt = db.prepare(`
      INSERT INTO submissions (tenant_id, assignment_id, student_id, file_url, content, status, resubmission_count) 
      VALUES (?, ?, ?, ?, ?, ?, ?) 
      ON CONFLICT(tenant_id, assignment_id, student_id) 
      DO UPDATE SET file_url=excluded.file_url, content=excluded.content, status=excluded.status, 
        resubmission_count=excluded.resubmission_count, submitted_at=CURRENT_TIMESTAMP, grade=NULL, feedback=NULL, graded_at=NULL
    `);
    stmt.run(req.tenant.id, assignmentId, student.id, file_url, content, status, resubCount);

    // Notify teacher
    const teacher = db.prepare('SELECT id FROM users WHERE id = ?').get(assignment.created_by);
    if (teacher) {
      db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
        .run(req.tenant.id, teacher.id, 'submission', 'New Submission', `Student submitted "${assignment.title}" (${status})`);
    }

    res.json({ success: true, status, resubmission: resubCount > 0 });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET submissions for an assignment (Teacher) ───
router.get('/:id/submissions', requireRole(['admin', 'teacher']), (req, res) => {
  const subs = db.prepare(`
    SELECT sub.*, s.system_uid, u.name as student_name
    FROM submissions sub
    JOIN students s ON sub.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE sub.assignment_id = ? AND sub.tenant_id = ?
    ORDER BY sub.submitted_at DESC
  `).all(req.params.id, req.tenant.id);
  res.json(subs);
});

// ─── GRADE a submission (Teacher) ───
router.put('/submissions/:id/grade', requireRole(['admin', 'teacher']), (req, res) => {
  const { grade, feedback } = req.body;
  try {
    const sub = db.prepare('SELECT * FROM submissions WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    db.prepare('UPDATE submissions SET grade = ?, feedback = ?, status = ?, graded_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?')
      .run(grade, feedback, 'graded', req.params.id, req.tenant.id);

    // Notify student
    const student = db.prepare('SELECT user_id FROM students WHERE id = ?').get(sub.student_id);
    if (student) {
      db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
        .run(req.tenant.id, student.user_id, 'grade', 'Assignment Graded', `Your assignment has been graded: ${grade}. ${feedback ? 'Feedback: ' + feedback : ''}`);

      const emitNotification = req.app.get('emitNotification');
      if (emitNotification) {
        emitNotification(req.tenant.id, student.user_id, { type: 'grade', title: 'Assignment Graded', message: `Grade: ${grade}` });
      }
    }

    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET student's own submissions ───
router.get('/my-submissions', requireRole(['student']), (req, res) => {
  const student = db.prepare('SELECT id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
  if (!student) return res.json([]);

  const subs = db.prepare(`
    SELECT sub.*, a.title as assignment_title, a.due_date, a.max_score
    FROM submissions sub
    JOIN assignments a ON sub.assignment_id = a.id
    WHERE sub.student_id = ? AND sub.tenant_id = ?
    ORDER BY sub.submitted_at DESC
  `).all(student.id, req.tenant.id);
  res.json(subs);
});

// ─── ASSIGNMENT ANALYTICS (Teacher/Admin) ───
router.get('/:id/analytics', requireRole(['admin', 'teacher']), (req, res) => {
  const assignmentId = req.params.id;
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ? AND tenant_id = ?').get(assignmentId, req.tenant.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  // Count students who should have submitted
  let totalStudents = 0;
  if (assignment.class_id) {
    totalStudents = db.prepare('SELECT COUNT(*) as c FROM students WHERE tenant_id = ? AND class_id = ?').get(req.tenant.id, assignment.class_id).c;
  } else {
    totalStudents = db.prepare('SELECT COUNT(*) as c FROM students WHERE tenant_id = ?').get(req.tenant.id).c;
  }

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_submissions,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as on_time,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded,
      ROUND(AVG(CASE WHEN grade IS NOT NULL THEN grade END), 1) as avg_grade,
      MIN(CASE WHEN grade IS NOT NULL THEN grade END) as min_grade,
      MAX(CASE WHEN grade IS NOT NULL THEN grade END) as max_grade
    FROM submissions
    WHERE assignment_id = ? AND tenant_id = ?
  `).get(assignmentId, req.tenant.id);

  res.json({
    assignment,
    totalStudents,
    missing: totalStudents - (stats.total_submissions || 0),
    ...stats
  });
});

// ─── Upload error handler ───
router.use(handleUploadError);

module.exports = router;
