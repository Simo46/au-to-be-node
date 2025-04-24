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

// Import middleware tenant
const tenantMiddleware = require('./middleware/tenantMiddleware');

// Import API centrale
const api = require('./api');

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

// Aggiungi il logger di risposta
app.use(createResponseLogger());

// Applica il middleware tenant e il middleware di contesto DB escludendo /api/health
app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  
  // Prima il tenant middleware
  tenantMiddleware(req, res, (err) => {
    if (err) return next(err);
    
    // Poi il middleware di contesto DB
    dbContextMiddleware(req, res, next);
  });
});

// Pass tenant info to sequelize options for all routes
app.use((req, res, next) => {
  if (req.tenantId) {
    req.sequelizeOptions = { tenantId: req.tenantId };
  }
  next();
});

// Utilizza le rotte API centrali
app.use(apiPrefix, api.routes);

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