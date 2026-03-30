const validator = require('validator');

function sanitizeString(value) {
  if (typeof value !== 'string') return value;

  return validator.escape(validator.trim(value));
}

function sanitizeObject(obj, allowedFields) {
  const sanitized = {};

  for (const field of allowedFields) {
    if (obj[field] !== undefined) {
      const value = obj[field];

      if (typeof value === 'string') {
        sanitized[field] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[field] = value.map((item) =>
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else {
        sanitized[field] = value;
      }
    }
  }

  return sanitized;
}

function sanitizeHtml(req, res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key]);
      }
    }
  }
  next();
}

function removeEmptyStrings(obj) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === '') {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      removeEmptyStrings(obj[key]);
    }
  }
  return obj;
}

function sanitizeFilename(filename) {
  return validator.escape(filename.replace(/[^a-zA-Z0-9._-]/g, '_'));
}

function isValidEmail(email) {
  return validator.isEmail(email);
}

function isValidUrl(url) {
  return validator.isURL(url, { require_protocol: true });
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeHtml,
  removeEmptyStrings,
  sanitizeFilename,
  isValidEmail,
  isValidUrl,
};
