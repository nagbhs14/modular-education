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
      active_modules TEXT DEFAULT 'settings,sis,attendance,assignments,materials,results,communication,messages',
      logo_url TEXT,
      about_us TEXT,
      id_prefix TEXT NOT NULL DEFAULT 'EDU',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // ─── CLASSES / BATCHES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    )
  `);

  // ─── SUBJECTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      class_id INTEGER,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL
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

  // ─── ANNOUNCEMENTS / NOTICES ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
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

  // ─── MESSAGES (async email-like system) ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // ─── COMPLAINTS ───
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_reply TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    )
  `);

  // ─── PERFORMANCE INDEXES ───
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_tenant_student ON attendance(tenant_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(tenant_id, date);
    CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id, role);
    CREATE INDEX IF NOT EXISTS idx_students_tenant ON students(tenant_id, class_id);
    CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id, receiver_id, is_read);
  `);
};

initDb();
module.exports = db;
