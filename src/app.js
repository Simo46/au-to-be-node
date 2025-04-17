const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Inizializzazione applicazione Express
const app = express();

// Middleware di sicurezza
app.use(helmet());

// Middleware per parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware per logging delle richieste
app.use(morgan('dev'));

// Middleware CORS
app.use(cors());

// Route di base per health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Route per API
app.use('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Au-To-Be Asset Management API',
    version: '1.0.0'
  });
});

// Middleware per gestione errori 404
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Middleware per gestione errori generici
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

module.exports = app;