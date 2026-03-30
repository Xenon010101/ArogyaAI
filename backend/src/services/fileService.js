const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../middlewares/upload');

function processUploadedFiles(files) {
  const result = {
    images: [],
    prescriptions: [],
    all: [],
  };

  if (!files) {
    return result;
  }

  const imageFiles = files.images || [];
  const prescriptionFiles = files.prescriptions || [];

  imageFiles.forEach((file) => {
    const processed = {
      originalName: file.originalname,
      fileName: file.filename,
      fileUrl: `/uploads/images/${file.filename}`,
      path: file.path,
      mimetype: file.mimetype,
      fileType: file.mimetype,
      fileSize: file.size,
      category: 'image',
    };
    result.images.push(processed);
    result.all.push(processed);
  });

  prescriptionFiles.forEach((file) => {
    const processed = {
      originalName: file.originalname,
      fileName: file.filename,
      fileUrl: `/uploads/prescriptions/${file.filename}`,
      path: file.path,
      mimetype: file.mimetype,
      fileType: file.mimetype,
      fileSize: file.size,
      category: 'prescription',
    };
    result.prescriptions.push(processed);
    result.all.push(processed);
  });

  return result;
}

function deleteFile(fileUrl) {
  if (!fileUrl) return false;

  const relativePath = fileUrl.replace('/uploads/', '');
  const fullPath = path.join(UPLOAD_DIR, relativePath);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
  } catch (error) {
    console.error('File deletion error:', error);
  }

  return false;
}

function deleteFiles(fileUrls) {
  if (!Array.isArray(fileUrls)) {
    return deleteFile(fileUrls);
  }

  return fileUrls.map((url) => deleteFile(url));
}

function getFileInfo(fileUrl) {
  if (!fileUrl) return null;

  const relativePath = fileUrl.replace('/uploads/', '');
  const fullPath = path.join(UPLOAD_DIR, relativePath);

  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        path: fullPath,
      };
    }
  } catch (error) {
    console.error('File info error:', error);
  }

  return { exists: false };
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  processUploadedFiles,
  deleteFile,
  deleteFiles,
  getFileInfo,
  formatFileSize,
};
