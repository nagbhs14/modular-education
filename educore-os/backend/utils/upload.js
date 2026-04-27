const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// ─── Allowed file types ───
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.zip', '.rar', '.7z',
  '.txt', '.csv', '.md'
];

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'text/plain', 'text/csv', 'text/markdown'
];

// ─── Sanitize filename ───
function sanitizeFilename(filename) {
  // Remove path traversal, special chars, keep only alphanumeric, hyphens, underscores, dots
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .substring(0, 100); // Limit length
}

// ─── Ensure upload directory exists ───
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

// ─── Create tenant-scoped multer storage ───
// category: 'assignments' | 'submissions' | 'materials' | 'announcements' | 'general'
function createStorage(category) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const tenantId = req.tenant ? req.tenant.id : 'global';
      const uploadDir = path.join(__dirname, '..', 'uploads', String(tenantId), category);
      ensureDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const suffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = sanitizeFilename(path.basename(file.originalname, ext));
      const tenantPrefix = req.tenant ? `t${req.tenant.id}` : 'global';
      cb(null, `${tenantPrefix}-${Date.now()}-${suffix}-${baseName}${ext}`);
    }
  });
}

// ─── File filter ───
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIMETYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk || extOk) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${ext} (${file.mimetype}). Allowed: PDF, DOC, PPT, XLS, images, ZIP`), false);
  }
}

// ─── Create upload middleware for a specific category ───
function createUpload(category, maxSizeMB = 25) {
  return multer({
    storage: createStorage(category),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter
  });
}

// ─── Pre-built upload middleware for each module ───
const uploadAssignment = createUpload('assignments');
const uploadSubmission = createUpload('submissions');
const uploadMaterial = createUpload('materials');
const uploadAnnouncement = createUpload('announcements');
const uploadGeneral = createUpload('general');

// ─── Helper to get tenant-scoped file URL ───
function getFileUrl(req, file) {
  if (!file) return null;
  const tenantId = req.tenant ? req.tenant.id : 'global';
  // file.filename already includes the full name; file.destination has the abs path
  // We reconstruct the relative URL
  const relPath = path.relative(path.join(__dirname, '..', 'uploads'), file.destination);
  return `/uploads/${relPath.replace(/\\/g, '/')}/${file.filename}`;
}

// ─── Multer error handler middleware ───
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 25MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err && err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
}

module.exports = {
  uploadAssignment,
  uploadSubmission,
  uploadMaterial,
  uploadAnnouncement,
  uploadGeneral,
  getFileUrl,
  handleUploadError,
  sanitizeFilename,
  ALLOWED_EXTENSIONS,
  // Legacy default export for backward compat
  single: (fieldName) => uploadGeneral.single(fieldName)
};
