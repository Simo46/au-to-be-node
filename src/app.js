// Import required packages
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import error handler - con Express 5 non serve più express-async-errors
const { errorHandler } = require('./middleware/errorHandler');

// Import logger
const { createHttpLogger } = require('./utils/logger');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(createHttpLogger()); // HTTP request logger (Pino)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is up and running',
    timestamp: new Date().toISOString(),
  });
});

// API routes will be defined here
// app.use('/api/auth', require('./api/routes/authRoutes'));
// app.use('/api/users', require('./api/routes/userRoutes'));
// app.use('/api/assets', require('./api/routes/assetRoutes'));
// app.use('/api/locations', require('./api/routes/locationRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.originalUrl}`,
  });
});

// Error handler middleware
app.use(errorHandler);

module.exports = app;