'use strict';

const { body } = require('express-validator');

/**
 * Validazioni per le operazioni sui permessi individuali degli utenti
 */
const userAbilityValidators = {
  /**
   * Validazioni per la creazione di un permesso individuale
   */
  createUserAbility: [
    body('action')
      .notEmpty().withMessage('L\'azione è obbligatoria')
      .isIn(['create', 'read', 'update', 'delete', 'manage']).withMessage('L\'azione deve essere una di: create, read, update, delete, manage'),
    
    body('subject')
      .notEmpty().withMessage('Il soggetto è obbligatorio'),
    
    body('conditions')
      .optional()
      .isObject().withMessage('Le condizioni devono essere un oggetto JSON valido'),
    
    body('fields')
      .optional()
      .isArray().withMessage('I campi devono essere un array'),
    
    body('fields.*')
      .optional()
      .isString().withMessage('Ogni campo deve essere una stringa'),
    
    body('inverted')
      .optional()
      .isBoolean().withMessage('Il valore deve essere un booleano'),
    
    body('priority')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('La priorità deve essere un numero intero tra 1 e 100'),
    
    body('reason')
      .optional()
      .isString().withMessage('Il motivo deve essere una stringa')
      .isLength({ max: 255 }).withMessage('Il motivo non può superare 255 caratteri'),
    
    body('expiresAt')
      .optional()
      .isISO8601().withMessage('La data di scadenza deve essere in formato ISO8601')
      .custom((value) => {
        if (value && new Date(value) <= new Date()) {
          throw new Error('La data di scadenza deve essere futura');
        }
        return true;
      })
  ],

  /**
   * Validazioni per l'aggiornamento di un permesso individuale
   */
  updateUserAbility: [
    body('action')
      .optional()
      .isIn(['create', 'read', 'update', 'delete', 'manage']).withMessage('L\'azione deve essere una di: create, read, update, delete, manage'),
    
    body('subject')
      .optional()
      .notEmpty().withMessage('Il soggetto non può essere vuoto'),
    
    body('conditions')
      .optional()
      .isObject().withMessage('Le condizioni devono essere un oggetto JSON valido'),
    
    body('fields')
      .optional()
      .isArray().withMessage('I campi devono essere un array'),
    
    body('fields.*')
      .optional()
      .isString().withMessage('Ogni campo deve essere una stringa'),
    
    body('inverted')
      .optional()
      .isBoolean().withMessage('Il valore deve essere un booleano'),
    
    body('priority')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('La priorità deve essere un numero intero tra 1 e 100'),
    
    body('reason')
      .optional()
      .isString().withMessage('Il motivo deve essere una stringa')
      .isLength({ max: 255 }).withMessage('Il motivo non può superare 255 caratteri'),
    
    body('expiresAt')
      .optional()
      .isISO8601().withMessage('La data di scadenza deve essere in formato ISO8601')
      .custom((value) => {
        if (value && new Date(value) <= new Date()) {
          throw new Error('La data di scadenza deve essere futura');
        }
        return true;
      })
  ]
};

module.exports = userAbilityValidators;