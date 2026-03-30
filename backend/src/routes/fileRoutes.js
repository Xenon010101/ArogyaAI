const express = require('express');
const path = require('path');
const fs = require('fs');
const { UPLOAD_DIR } = require('../middlewares/upload');

const router = express.Router();

router.get('/:filename', (req, res, next) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: 'error',
      message: 'File not found',
    });
  }

  res.sendFile(filePath);
});

router.get('/images/:filename', (req, res, next) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, 'images', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: 'error',
      message: 'File not found',
    });
  }

  res.sendFile(filePath);
});

router.get('/prescriptions/:filename', (req, res, next) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, 'prescriptions', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: 'error',
      message: 'File not found',
    });
  }

  res.sendFile(filePath);
});

module.exports = router;
