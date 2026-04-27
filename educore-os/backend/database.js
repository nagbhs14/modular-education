const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'educore.db');
const db = new Database(dbPath);

const initDb = () => {
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // ─── TENANTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subdomain TEXT NOT NULL UNIQUE,
      active_modules TEXT DEFAULT 'settings,sis,attendance,assignments,materials,results,communication,fees,analytics',
      logo_url TEXT,
      about_us TEXT,
      fees_structure TEXT,
      id_prefix TEXT NOT NULL DEFAULT 'EDU',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── TENANT MODULES (Marketplace) ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      module_name TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      config TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      UNIQUE(tenant_id, module_name)
    )
  `);

  // ─── SUBSCRIPTION PLANS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      max_students INTEGER DEFAULT 50,
      max_modules INTEGER DEFAULT 3,
      price_monthly REAL DEFAULT 0,
      features TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── TENANT SUBSCRIPTIONS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans (id),
      UNIQUE(tenant_id)
    )
  `);

  // ─── USERS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      UNIQUE(tenant_id, username)
    )
  `);

  // ─── CLASSES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    )
  `);

  // ─── STUDENTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      class_id INTEGER,
      system_uid TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL,
      UNIQUE(tenant_id, system_uid)
    )
  `);

  // ─── ATTENDANCE ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'present',
      marked_by INTEGER,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (marked_by) REFERENCES users (id),
      UNIQUE(tenant_id, student_id, date)
    )
  `);

  // ─── ASSIGNMENTS (LMS) — Enhanced with workflow fields ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      class_id INTEGER,
      due_date TEXT,
      max_score INTEGER DEFAULT 100,
      allow_resubmission INTEGER DEFAULT 0,
      file_url TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // ─── SUBMISSIONS — Enhanced with resubmission tracking ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      file_url TEXT,
      content TEXT,
      status TEXT NOT NULL DEFAULT 'submitted',
      grade REAL,
      feedback TEXT,
      resubmission_count INTEGER DEFAULT 0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      graded_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      UNIQUE(tenant_id, assignment_id, student_id)
    )
  `);

  // ─── MATERIALS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      class_id INTEGER,
      file_url TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // ─── RESULTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      exam_name TEXT NOT NULL,
      score REAL,
      grades TEXT,
      published INTEGER DEFAULT 1,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    )
  `);

  // ─── ANNOUNCEMENTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      file_url TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // ─── FEES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      class_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL
    )
  `);

  // ─── PAYMENTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      fee_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      transaction_id TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (fee_id) REFERENCES fees (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      UNIQUE(tenant_id, fee_id, student_id)
    )
  `);

  // ─── CHAT MESSAGES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      class_id INTEGER,
      message TEXT NOT NULL,
      is_class_message INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE SET NULL,
      FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL
    )
  `);

  // ─── NOTIFICATIONS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // ─── AUDIT LOG ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    )
  `);

  // ─── PERFORMANCE INDEXES ───
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_tenant_student ON attendance(tenant_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(tenant_id, date);
    CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(tenant_id, assignment_id);
    CREATE INDEX IF NOT EXISTS idx_payments_tenant_fee ON payments(tenant_id, fee_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(tenant_id, user_id, read);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant ON chat_messages(tenant_id, sender_id);
    CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id, role);
    CREATE INDEX IF NOT EXISTS idx_students_tenant ON students(tenant_id, class_id);
  `);

  // ─── SEED DEFAULT SUBSCRIPTION PLANS ───
  const planCount = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get().count;
  if (planCount === 0) {
    const insertPlan = db.prepare('INSERT INTO subscription_plans (name, display_name, max_students, max_modules, price_monthly, features) VALUES (?, ?, ?, ?, ?, ?)');
    insertPlan.run('free', 'Free', 50, 5, 0, JSON.stringify(['sis', 'attendance', 'assignments', 'communication', 'settings']));
    insertPlan.run('pro', 'Professional', 500, 10, 29.99, JSON.stringify(['all_modules', 'analytics', 'ai', 'priority_support']));
    insertPlan.run('enterprise', 'Enterprise', -1, -1, 99.99, JSON.stringify(['unlimited', 'custom_branding', 'api_access', 'dedicated_support']));
  }

  // ─── SEED DATA ───
  const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get().count;
  if (tenantCount === 0) {
    console.log("Seeding initial data...");
    
    const insertTenant = db.prepare('INSERT INTO tenants (name, subdomain, id_prefix, about_us, fees_structure) VALUES (?, ?, ?, ?, ?)');
    const t1 = insertTenant.run(
      'Global Academy', 
      'global', 
      'GLB', 
      'Welcome to Global Academy, a world-class institution dedicated to nurturing the leaders of tomorrow. Established in 1995, we provide a holistic learning environment with state-of-the-art facilities, expert faculty, and a curriculum designed for global success.', 
      'Full Tuition Fee: $500.00 (per semester)\nLibrary & Lab Fee: $50.00 (annual)\nSports & Extra-curricular: $25.00 (annual)\nTotal Annual Estimated: $1,075.00'
    );
    const tid = t1.lastInsertRowid;

    // Assign free plan to seed tenant
    db.prepare('INSERT INTO tenant_subscriptions (tenant_id, plan_id) VALUES (?, 1)').run(tid);

    const insertUser = db.prepare('INSERT INTO users (tenant_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)');
    insertUser.run(tid, 'Global Admin', 'admin', 'password', 'admin');
    const teacherRes = insertUser.run(tid, 'Prof. Oak', 'teacher', 'password', 'teacher');
    const studentUserRes = insertUser.run(tid, 'Ash Ketchum', 'student', 'password', 'student');
    const student2UserRes = insertUser.run(tid, 'Misty Waterflower', 'student2', 'password', 'student');

    const c1 = db.prepare('INSERT INTO classes (tenant_id, name) VALUES (?, ?)').run(tid, 'Form 1');
    const c2 = db.prepare('INSERT INTO classes (tenant_id, name) VALUES (?, ?)').run(tid, 'Form 2');

    const insertStudent = db.prepare('INSERT INTO students (tenant_id, user_id, class_id, system_uid) VALUES (?, ?, ?, ?)');
    insertStudent.run(tid, studentUserRes.lastInsertRowid, c1.lastInsertRowid, 'GLB-101');
    insertStudent.run(tid, student2UserRes.lastInsertRowid, c1.lastInsertRowid, 'GLB-102');

    // Seed a fee structure
    const insertFee = db.prepare('INSERT INTO fees (tenant_id, name, amount, due_date, description) VALUES (?, ?, ?, ?, ?)');
    insertFee.run(tid, 'Semester 1 Tuition', 500, '2026-06-30', 'First semester tuition fee');
    insertFee.run(tid, 'Library Fee', 50, '2026-05-15', 'Annual library access fee');

    // Seed Attendance
    const insertAttendance = db.prepare('INSERT INTO attendance (tenant_id, student_id, date, status) VALUES (?, ?, ?, ?)');
    const today = new Date().toISOString().split('T')[0];
    insertAttendance.run(tid, 1, today, 'present');
    insertAttendance.run(tid, 2, today, 'absent');

    // Seed Announcements
    const insertAnnouncement = db.prepare('INSERT INTO announcements (tenant_id, message, created_by) VALUES (?, ?, ?)');
    insertAnnouncement.run(tid, 'Welcome to the 2026 Academic Session! Check your schedule for new modules.', 1);
    insertAnnouncement.run(tid, 'Midterm exams start next month. Prepare well!', 1);

    // Seed Assignments (with enhanced fields)
    const insertAssignment = db.prepare('INSERT INTO assignments (tenant_id, title, description, class_id, due_date, max_score, allow_resubmission, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertAssignment.run(tid, 'Math Homework 1', 'Solve equations on page 42.', c1.lastInsertRowid, '2026-05-15', 100, 1, teacherRes.lastInsertRowid);
    insertAssignment.run(tid, 'Science Project', 'Create a model of the solar system.', c1.lastInsertRowid, '2026-06-01', 50, 0, teacherRes.lastInsertRowid);

    // Seed Results
    const insertResult = db.prepare('INSERT INTO results (tenant_id, student_id, exam_name, score, grades) VALUES (?, ?, ?, ?, ?)');
    insertResult.run(tid, 1, 'Unit Test 1', 95, 'A+');
    insertResult.run(tid, 2, 'Unit Test 1', 82, 'B');
  }
};

initDb();
module.exports = db;
