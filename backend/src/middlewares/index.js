const express = require('express');
const morgan = require('morgan');

const { helmetConfig, xssProtection, removePoweredBy } = require('./security');
const { requestIdMiddleware } = require('./requestId');
const { sanitizeHtml } = require('./sanitize');

function setupSecurityMiddleware(app) {
  app.use(removePoweredBy);
  app.use(requestIdMiddleware);
  app.use(helmetConfig);
  app.use(xssProtection);
}

function setupBodyParsing(app) {
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(express.text({ limit: '10kb' }));
}

function setupRequestLogging(app) {
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms [:date[iso]] :req[x-request-id]')
  );
}

module.exports = {
  setupSecurityMiddleware,
  setupBodyParsing,
  setupRequestLogging,
};
