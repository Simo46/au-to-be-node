'use strict';

/**
 * Index file per l'API
 * Questo file esporta i controller, i route e i validatori
 */

// Controllers
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const roleController = require('./controllers/roleController');
const filialeController = require('./controllers/filialeController');
const edificioController = require('./controllers/edificioController'); // Nuovo controller

// Routes
const routes = require('./routes');

// Validators
const authValidators = require('./validators/authValidators');
const userValidators = require('./validators/userValidators');
const roleValidators = require('./validators/roleValidators');
const filialeValidators = require('./validators/filialeValidators');
const edificioValidators = require('./validators/edificioValidators'); // Nuovi validatori

module.exports = {
  controllers: {
    authController,
    userController,
    roleController,
    filialeController,
    edificioController // Aggiunto controller
  },
  routes,
  validators: {
    authValidators,
    userValidators,
    roleValidators,
    filialeValidators,
    edificioValidators // Aggiunti validatori
  }
};