const express = require('express');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const path = require('path');

const { helmetConfig, xssProtection, removePoweredBy } = require('./middlewares/security');
const { requestIdMiddleware } = require('./middlewares/requestId');
const { sanitizeHtml } = require('./middlewares/sanitize');
const { corsMiddleware } = require('./middlewares/cors');
const {
  standardLimiter,
  authLimiter,
  loginLimiter,
  analyzeLimiter,
  uploadLimiter,
} = require('./middlewares/rateLimiter');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const fileRoutes = require('./routes/fileRoutes');
const globalErrorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(removePoweredBy);
app.use(requestIdMiddleware);
app.use(helmetConfig);
app.use(xssProtection);
app.use(corsMiddleware);
app.use(cookieParser());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.text({ limit: '10kb' }));
app.use(hpp());
app.use(sanitizeHtml);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/health', standardLimiter);

app.use('/api/auth', authLimiter);
app.use('/api/auth/login', loginLimiter);

app.use('/api/analyze', analyzeLimiter);

app.use('/api/files', uploadLimiter);

app.use('/api', standardLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/files', fileRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

app.use(globalErrorHandler);

app.use((err, req, res, next) => {
  if (err.message?.includes('CORS')) {
    return res.status(403).json({
      status: 'fail',
      message: 'CORS not allowed',
    });
  }
  next(err);
});

module.exports = app;
