'use strict';

/**
 * Index file per l'API
 * Questo file esporta i controller, i route e i validatori
 */

// Controllers
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const roleController = require('./controllers/roleController');

// Routes
const routes = require('./routes');

// Validators
const authValidators = require('./validators/authValidators');
const userValidators = require('./validators/userValidators');
const roleValidators = require('./validators/roleValidators');

module.exports = {
  controllers: {
    authController,
    userController,
    roleController
  },
  routes,
  validators: {
    authValidators,
    userValidators,
    roleValidators
  }
};