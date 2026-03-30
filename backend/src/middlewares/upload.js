const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function sanitizeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);

  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');

  return sanitized + '_' + timestamp + '_' + random + ext;
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const subDir = file.fieldname === 'prescriptions' ? 'prescriptions' : 'images';
    const dir = path.join(UPLOAD_DIR, subDir);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const sanitized = sanitizeFilename(file.originalname);
    cb(null, sanitized);
  }
});

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/jpg',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLLOWED_TYPES = ALLOWED_IMAGE_TYPES.concat(ALLOWED_DOCUMENT_TYPES);

function fileFilter(req, file, cb) {
  if (ALLLOWED_TYPES.indexOf(file.mimetype) !== -1) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF, DOC, DOCX'), false);
  }
}

const limits = {
  fileSize: 5 * 1024 * 1024,
  files: 5,
  fields: 10,
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

const uploadImages = upload.array('images', 5);
const uploadPrescriptions = upload.array('prescriptions', 3);
const uploadFiles = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'prescriptions', maxCount: 3 },
]);

module.exports = {
  upload: upload,
  uploadImages: uploadImages,
  uploadPrescriptions: uploadPrescriptions,
  uploadFiles: uploadFiles,
  ALLOWED_TYPES: ALLLOWED_TYPES,
  UPLOAD_DIR: UPLOAD_DIR,
};
