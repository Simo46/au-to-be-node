'use strict';

const { body } = require('express-validator');

/**
 * Validazioni per le rotte di gestione piani
 */
const pianoValidators = {
  /**
   * Validazioni per la creazione di un piano
   */
  createPiano: [
    body('filiale_id')
      .notEmpty().withMessage('L\'ID della filiale è obbligatorio')
      .isUUID().withMessage('L\'ID della filiale deve essere un UUID valido'),
    
    body('edificio_id')
      .notEmpty().withMessage('L\'ID dell\'edificio è obbligatorio')
      .isUUID().withMessage('L\'ID dell\'edificio deve essere un UUID valido'),
    
    body('code')
      .notEmpty().withMessage('Il codice è obbligatorio')
      .isLength({ min: 1, max: 50 }).withMessage('Il codice deve essere compreso tra 1 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .notEmpty().withMessage('La descrizione è obbligatoria')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('notes')
      .optional()
      .isString().withMessage('Le note devono essere una stringa'),
    
    body('active')
      .optional()
      .isBoolean().withMessage('Lo stato attivo deve essere un booleano')
  ],

  /**
   * Validazioni per l'aggiornamento di un piano
   */
  updatePiano: [
    body('filiale_id')
      .optional()
      .isUUID().withMessage('L\'ID della filiale deve essere un UUID valido'),
    
    body('edificio_id')
      .optional()
      .isUUID().withMessage('L\'ID dell\'edificio deve essere un UUID valido'),
    
    body('code')
      .optional()
      .isLength({ min: 1, max: 50 }).withMessage('Il codice deve essere compreso tra 1 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .optional()
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('notes')
      .optional()
      .isString().withMessage('Le note devono essere una stringa'),
    
    body('active')
      .optional()
      .isBoolean().withMessage('Lo stato attivo deve essere un booleano')
  ]
};

module.exports = pianoValidators;