import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File, CheckCircle, AlertCircle } from 'lucide-react';

// ─── File type icons & labels ───
const FILE_ICONS = {
  'application/pdf': { icon: FileText, color: 'text-error', label: 'PDF' },
  'application/msword': { icon: FileText, color: 'text-primary', label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, color: 'text-primary', label: 'DOCX' },
  'application/vnd.ms-powerpoint': { icon: FileText, color: 'text-orange-400', label: 'PPT' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: FileText, color: 'text-orange-400', label: 'PPTX' },
  'application/vnd.ms-excel': { icon: FileText, color: 'text-green-400', label: 'XLS' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, color: 'text-green-400', label: 'XLSX' },
  'application/zip': { icon: File, color: 'text-yellow-400', label: 'ZIP' },
  'application/x-rar-compressed': { icon: File, color: 'text-yellow-400', label: 'RAR' },
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.zip', '.rar', '.7z', '.txt', '.csv', '.md'
];

function getFileInfo(file) {
  if (IMAGE_TYPES.includes(file.type)) {
    return { icon: Image, color: 'text-secondary', label: file.type.split('/')[1].toUpperCase(), isImage: true };
  }
  return FILE_ICONS[file.type] || { icon: File, color: 'text-outline', label: 'FILE', isImage: false };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type "${ext}" is not allowed. Allowed: PDF, DOC, PPT, XLS, images, ZIP`;
  }
  if (file.size > 25 * 1024 * 1024) {
    return 'File size exceeds 25MB limit';
  }
  return null;
}

// ─── FileUpload Component ───
export default function FileUpload({ 
  onFileSelect, 
  file = null, 
  onRemove, 
  accept = ALLOWED_EXTENSIONS.join(','),
  label = 'Upload File',
  compact = false,
  progress = null // 0-100, null means no upload in progress
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((selectedFile) => {
    setError('');
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Generate preview for images
    const info = getFileInfo(selectedFile);
    if (info.isImage) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    onFileSelect(selectedFile);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleFile(selectedFile);
    e.target.value = ''; // Reset input for same file re-select
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    if (onRemove) onRemove();
  };

  // ─── File Selected State ───
  if (file) {
    const info = getFileInfo(file);
    const IconComponent = info.icon;

    return (
      <div className="relative">
        <div className={`
          flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
          ${progress !== null && progress < 100 
            ? 'bg-primary-container/10 border-primary/30' 
            : 'bg-surface-container-low border-outline-variant/30 hover:border-outline-variant/50'}
        `}>
          {/* Preview / Icon */}
          <div className="shrink-0">
            {preview ? (
              <img src={preview} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-outline-variant/30" />
            ) : (
              <div className={`w-14 h-14 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-center`}>
                <IconComponent size={24} className={info.color} />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="font-body-md text-sm font-medium text-on-surface truncate">{file.name}</p>
            <p className="font-label-sm text-xs text-on-surface-variant mt-0.5">
              {info.label} · {formatFileSize(file.size)}
            </p>
            
            {/* Progress Bar */}
            {progress !== null && progress < 100 && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,209,255,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="font-label-sm text-xs text-primary mt-1">{progress}% uploaded</p>
              </div>
            )}

            {/* Upload complete */}
            {progress === 100 && (
              <p className="font-label-sm text-xs text-green-400 mt-1 flex items-center gap-1">
                <CheckCircle size={12} /> Upload complete
              </p>
            )}
          </div>

          {/* Remove Button */}
          {progress === null && (
            <button 
              type="button"
              onClick={handleRemove} 
              className="shrink-0 p-2 rounded-lg hover:bg-error-container/20 text-outline hover:text-error transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Drop Zone State ───
  return (
    <div className="relative">
      <div
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${compact ? 'p-4' : 'p-8'}
          ${isDragging 
            ? 'border-primary bg-primary-container/10 scale-[1.02]' 
            : 'border-outline-variant/50 hover:border-outline bg-surface-container-low hover:bg-surface-container'}
          ${error ? 'border-error/50 bg-error-container/5' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className={`flex ${compact ? 'flex-row items-center gap-4' : 'flex-col items-center gap-3'}`}>
          <div className={`
            ${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-xl 
            ${isDragging ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-highest text-outline'} 
            flex items-center justify-center transition-colors
          `}>
            <Upload size={compact ? 18 : 24} className="currentColor" />
          </div>
          
          <div className={compact ? '' : 'text-center'}>
            <p className={`${compact ? 'font-label-sm text-sm' : 'font-body-md text-base'} text-on-surface`}>
              {isDragging ? (
                <span className="text-primary font-semibold">Drop file here</span>
              ) : (
                <>
                  <span className="text-primary font-semibold hover:text-primary-fixed-dim">{label}</span>
                  {!compact && <span className="text-on-surface-variant"> or drag & drop</span>}
                </>
              )}
            </p>
            {!compact && (
              <p className="font-label-sm text-xs text-outline mt-1">PDF, DOC, PPT, XLS, Images, ZIP — Max 25MB</p>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-error text-sm font-label-sm animate-pulse">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
