const app = require('./app');
const { createLogger } = require('./utils/logger');
const { initializeApp } = require('./config/init');
const { testConnection } = require('./config/database');

// Load environment variables
require('dotenv').config();

// Initialize logger
const logger = createLogger('server');

// Get port from environment variable or use default
const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  try {
    await testConnection();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to the database');
  }
  
  // Initialize application services
  await initializeApp();
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

// Handle SIGINT
process.on('SIGINT', () => {
  logger.info('👋 SIGINT RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});