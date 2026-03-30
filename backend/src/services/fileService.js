const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../middlewares/upload');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('[FileService] pdf-parse not available:', e.message);
}

async function extractTextFromPDF(filePath) {
  if (!pdfParse) {
    console.warn('[FileService] pdf-parse module not loaded');
    return null;
  }

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (data && data.text && data.text.trim().length > 0) {
      console.log('[FileService] Extracted', data.text.length, 'characters from PDF');
      return data.text.trim();
    }
    
    console.warn('[FileService] PDF appears to be empty or image-based');
    return null;
  } catch (error) {
    console.error('[FileService] PDF extraction error:', error.message);
    return null;
  }
}

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

async function extractTextFromPrescription(filePath) {
  if (!filePath) return null;
  
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return await extractTextFromPDF(filePath);
  }
  
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
    console.log('[FileService] Image file detected - OCR not implemented yet');
    return '[Image-based document - visual review recommended]';
  }
  
  return null;
}

async function processPrescriptionsForAnalysis(prescriptionFiles) {
  if (!prescriptionFiles || prescriptionFiles.length === 0) {
    return { extractedTexts: [], combinedText: '' };
  }

  const extractedTexts = [];

  for (const file of prescriptionFiles) {
    console.log('[FileService] Processing prescription:', file.originalName);
    const text = await extractTextFromPrescription(file.path);
    if (text) {
      extractedTexts.push({
        fileName: file.originalName,
        text: text
      });
    }
  }

  const combinedText = extractedTexts.map(t => 
    `[Document: ${t.fileName}]\n${t.text}`
  ).join('\n\n');

  console.log('[FileService] Total extracted text length:', combinedText.length);

  return { extractedTexts, combinedText };
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
  processPrescriptionsForAnalysis,
  extractTextFromPrescription,
  deleteFile,
  deleteFiles,
  getFileInfo,
  formatFileSize,
};
