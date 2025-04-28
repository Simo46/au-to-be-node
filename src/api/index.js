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
const pianoController = require('./controllers/pianoController'); 
const localeController = require('./controllers/localeController');

// Routes
const routes = require('./routes');

// Validators
const authValidators = require('./validators/authValidators');
const userValidators = require('./validators/userValidators');
const roleValidators = require('./validators/roleValidators');
const filialeValidators = require('./validators/filialeValidators');
const pianoValidators = require('./validators/pianoValidators'); 
const localeValidators = require('./validators/localeValidators'); 

module.exports = {
  controllers: {
    authController,
    userController,
    roleController,
    filialeController,
    pianoController,
    localeController
  },
  routes,
  validators: {
    authValidators,
    userValidators,
    roleValidators,
    filialeValidators,
    pianoValidators,
    localeValidators
  }
};