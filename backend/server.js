const app = require('./src/app');
const connectDB = require('./src/config/database');
const config = require('./src/config');

if (!config.jwt || !config.jwt.secret) {
  console.error('ERROR: JWT_SECRET is not configured in .env file');
  console.error('Please copy .env.example to .env and set your values');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not configured in .env file');
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  process.exit(1);
});

connectDB().then(() => {
  const server = app.listen(config.port, () => {
    console.log('========================================');
    console.log(`🚀 ArogyaAI Server running on port ${config.port}`);
    console.log(`📦 Environment: ${config.nodeEnv}`);
    console.log('========================================');
  });

  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Process terminated!');
    });
  });

  process.on('SIGINT', () => {
    console.log('👋 SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Process terminated!');
    });
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});
