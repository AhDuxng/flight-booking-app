import app from './app.js';
import env from './config/env.js';

// Trigger server reload
const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection. Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception. Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});
