const crypto = require('crypto');

function generateRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

function requestIdMiddleware(req, res, next) {
  const id = req.headers['x-request-id'] || generateRequestId();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

function trustProxy(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim();
}

function getClientIp(req) {
  return trustProxy(req) || req.socket?.remoteAddress || 'unknown';
}

module.exports = {
  generateRequestId,
  requestIdMiddleware,
  trustProxy,
  getClientIp,
};
