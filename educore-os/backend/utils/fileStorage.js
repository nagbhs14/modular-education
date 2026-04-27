const path = require('path');
const fs = require('fs');

// ─── Abstract file storage layer — currently local, easily swappable to S3 ───
class FileStorage {
  constructor() {
    this.basePath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  // Ensure a tenant-scoped upload directory exists
  getUploadDir(tenantId, category = 'general') {
    const dir = path.join(this.basePath, String(tenantId), category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  // Returns a public URL path for a tenant-scoped file
  getUrl(tenantId, category, filename) {
    return `/uploads/${tenantId}/${category}/${filename}`;
  }

  // Returns the absolute path for a file
  getAbsolutePath(filePath) {
    // filePath could be like "/uploads/1/assignments/file.pdf" or just "file.pdf"
    if (filePath.startsWith('/uploads/')) {
      return path.join(this.basePath, '..', filePath);
    }
    return path.join(this.basePath, filePath);
  }

  // Validate that a file path belongs to a specific tenant (prevents cross-tenant access)
  validateAccess(tenantId, filePath) {
    if (!filePath) return false;
    // Normalize the path to prevent traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
    
    // Check that the path contains the tenant's directory
    const tenantPrefix = `/uploads/${tenantId}/`;
    const tenantPrefix2 = `${tenantId}/`;
    
    return normalizedPath.includes(tenantPrefix) || normalizedPath.startsWith(tenantPrefix2);
  }

  // Delete a file
  delete(filePath) {
    const absPath = this.getAbsolutePath(filePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
      return true;
    }
    return false;
  }

  // Check if file exists
  exists(filePath) {
    return fs.existsSync(this.getAbsolutePath(filePath));
  }

  // List files in a tenant's category directory
  listFiles(tenantId, category) {
    const dir = path.join(this.basePath, String(tenantId), category);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).map(f => ({
      name: f,
      url: this.getUrl(tenantId, category, f),
      size: fs.statSync(path.join(dir, f)).size
    }));
  }
}

module.exports = new FileStorage();
