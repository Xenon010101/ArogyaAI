const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const hpp = require('hpp');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const globalErrorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');
const rateLimiter = require('./middlewares/rateLimiter');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(hpp());

app.use('/api', rateLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.all('*', (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

app.use(globalErrorHandler);

module.exports = app;
