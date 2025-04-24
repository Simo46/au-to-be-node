'use strict';

const { body } = require('express-validator');

/**
 * Validazioni per le rotte di autenticazione
 */
const authValidators = {
  /**
   * Validazioni per la registrazione
   */
  register: [
    body('name')
      .notEmpty().withMessage('Il nome è obbligatorio')
      .isLength({ min: 2, max: 100 }).withMessage('Il nome deve essere compreso tra 2 e 100 caratteri'),
    
    body('email')
      .notEmpty().withMessage('L\'email è obbligatoria')
      .isEmail().withMessage('L\'email non è valida')
      .normalizeEmail(),
    
    body('username')
      .notEmpty().withMessage('Il nome utente è obbligatorio')
      .isLength({ min: 3, max: 50 }).withMessage('Il nome utente deve essere compreso tra 3 e 50 caratteri')
      .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Il nome utente può contenere solo lettere, numeri, punti, trattini e underscore'),
    
    body('password')
      .notEmpty().withMessage('La password è obbligatoria')
      .isLength({ min: 8 }).withMessage('La password deve essere di almeno 8 caratteri')
      .matches(/[a-z]/).withMessage('La password deve contenere almeno una lettera minuscola')
      .matches(/[A-Z]/).withMessage('La password deve contenere almeno una lettera maiuscola')
      .matches(/[0-9]/).withMessage('La password deve contenere almeno un numero'),
    
    body('filiale_id')
      .optional()
      .isUUID().withMessage('L\'ID della filiale non è valido')
  ],

  /**
   * Validazioni per il login
   */
  login: [
    body('username')
      .notEmpty().withMessage('Username o email è obbligatorio'),
    
    body('password')
      .notEmpty().withMessage('La password è obbligatoria')
  ],

  /**
   * Validazioni per il refresh token
   */
  refreshToken: [
    body('refreshToken')
      .notEmpty().withMessage('Il refresh token è obbligatorio')
  ]
};

module.exports = authValidators;