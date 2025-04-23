// Import required packages
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const configurePassport = require('./config/passport');
const dbContextMiddleware = require('./middleware/db-context');

// Import error handler - con Express 5 non serve più express-async-errors
const { errorHandler } = require('./middleware/errorHandler');

// Import logger
const { createHttpLogger, createResponseLogger } = require('./utils/logger');

// Import tenant middleware
const tenantMiddleware = require('./middleware/tenantMiddleware');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();

configurePassport(app);

// API prefix
const apiPrefix = process.env.API_PREFIX || '/api';

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
})); // Enable CORS with expanded options

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint - no need for tenant identification
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is up and running',
    timestamp: new Date().toISOString(),
  });
});

// Possiamo tenere il logger HTTP per il debug delle richieste in arrivo (opzionale)
// app.use(createHttpLogger());

// Applica il tenant middleware a tutte le rotte API eccetto health check
app.use(new RegExp(`^${apiPrefix}(?!/health)`), tenantMiddleware);

// Aggiungi il logger di risposta dopo il middleware tenant
app.use(createResponseLogger());

app.use(dbContextMiddleware);

// Pass tenant info to sequelize options for all routes
app.use((req, res, next) => {
  if (req.tenantId) {
    req.sequelizeOptions = { tenantId: req.tenantId };
  }
  next();
});

// API routes will be defined here
// app.use('/api/auth', require('./api/routes/authRoutes'));
// app.use('/api/users', require('./api/routes/userRoutes'));
// app.use('/api/assets', require('./api/routes/assetRoutes'));
// app.use('/api/locations', require('./api/routes/locationRoutes'));
app.use('/api/auth-test', require('./api/routes/authTest'));
app.use('/api/test-permissions', require('./api/routes/permissionTestRoutes'));

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