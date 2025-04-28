'use strict';

const { body } = require('express-validator');

/**
 * Validazioni per le rotte di gestione locali
 */
const localeValidators = {
  /**
   * Validazioni per la creazione di un locale
   */
  createLocale: [
    body('filiale_id')
      .notEmpty().withMessage('L\'ID della filiale è obbligatorio')
      .isUUID().withMessage('L\'ID della filiale deve essere un UUID valido'),
    
    body('edificio_id')
      .notEmpty().withMessage('L\'ID dell\'edificio è obbligatorio')
      .isUUID().withMessage('L\'ID dell\'edificio deve essere un UUID valido'),
    
    body('piano_id')
      .notEmpty().withMessage('L\'ID del piano è obbligatorio')
      .isUUID().withMessage('L\'ID del piano deve essere un UUID valido'),
    
    body('code')
      .notEmpty().withMessage('Il codice è obbligatorio')
      .isLength({ min: 2, max: 50 }).withMessage('Il codice deve essere compreso tra 2 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .notEmpty().withMessage('La descrizione è obbligatoria')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('superficie')
      .optional()
      .isNumeric().withMessage('La superficie deve essere un numero'),
    
    body('capienza')
      .optional()
      .isInt().withMessage('La capienza deve essere un numero intero'),
    
    body('tipologia')
      .optional()
      .isString().withMessage('La tipologia deve essere una stringa')
      .isLength({ max: 100 }).withMessage('La tipologia non può superare 100 caratteri'),
    
    body('planimetria')
      .optional()
      .isString().withMessage('La planimetria deve essere una stringa'),
    
    body('active')
      .optional()
      .isBoolean().withMessage('Lo stato attivo deve essere un booleano'),
    
    body('notes')
      .optional()
      .isString().withMessage('Le note devono essere una stringa')
  ],

  /**
   * Validazioni per l'aggiornamento di un locale
   */
  updateLocale: [
    body('filiale_id')
      .optional()
      .isUUID().withMessage('L\'ID della filiale deve essere un UUID valido'),
    
    body('edificio_id')
      .optional()
      .isUUID().withMessage('L\'ID dell\'edificio deve essere un UUID valido'),
    
    body('piano_id')
      .optional()
      .isUUID().withMessage('L\'ID del piano deve essere un UUID valido'),
    
    body('code')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Il codice deve essere compreso tra 2 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .optional()
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('superficie')
      .optional()
      .isNumeric().withMessage('La superficie deve essere un numero'),
    
    body('capienza')
      .optional()
      .isInt().withMessage('La capienza deve essere un numero intero'),
    
    body('tipologia')
      .optional()
      .isString().withMessage('La tipologia deve essere una stringa')
      .isLength({ max: 100 }).withMessage('La tipologia non può superare 100 caratteri'),
    
    body('planimetria')
      .optional()
      .isString().withMessage('La planimetria deve essere una stringa'),
    
    body('active')
      .optional()
      .isBoolean().withMessage('Lo stato attivo deve essere un booleano'),
    
    body('notes')
      .optional()
      .isString().withMessage('Le note devono essere una stringa')
  ]
};

module.exports = localeValidators;