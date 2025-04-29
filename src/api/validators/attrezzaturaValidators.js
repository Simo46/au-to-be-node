'use strict';

const { body } = require('express-validator');

/**
 * Validazioni per le rotte di gestione attrezzature
 */
const attrezzaturaValidators = {
  /**
   * Validazioni per la creazione di un'attrezzatura
   * Nota: i campi base dell'asset devono essere validati separatamente
   */
  createAttrezzatura: [
    body('asset_id')
      .notEmpty().withMessage('L\'ID dell\'asset è obbligatorio')
      .isUUID().withMessage('L\'ID dell\'asset deve essere un UUID valido'),
    
    body('categoria_id')
      .optional()
      .isUUID().withMessage('L\'ID della categoria deve essere un UUID valido'),
    
    body('altro_fornitore_id')
      .optional()
      .isUUID().withMessage('L\'ID del fornitore deve essere un UUID valido'),
    
    body('super_tool')
      .optional()
      .isBoolean().withMessage('Il campo super_tool deve essere un booleano'),
    
    body('descrizione')
      .optional()
      .isString().withMessage('La descrizione deve essere una stringa')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri')
  ],

  /**
   * Validazioni per l'aggiornamento di un'attrezzatura
   */
  updateAttrezzatura: [
    body('categoria_id')
      .optional()
      .isUUID().withMessage('L\'ID della categoria deve essere un UUID valido'),
    
    body('altro_fornitore_id')
      .optional()
      .isUUID().withMessage('L\'ID del fornitore deve essere un UUID valido'),
    
    body('super_tool')
      .optional()
      .isBoolean().withMessage('Il campo super_tool deve essere un booleano'),
    
    body('descrizione')
      .optional()
      .isString().withMessage('La descrizione deve essere una stringa')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri')
  ],

  /**
   * Validazioni per la creazione combinata di asset e attrezzatura
   */
  createCombined: [
    // Campi asset base
    body('code')
      .notEmpty().withMessage('Il codice è obbligatorio')
      .isLength({ min: 2, max: 50 }).withMessage('Il codice deve essere compreso tra 2 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .notEmpty().withMessage('La descrizione è obbligatoria')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('filiale_id')
      .notEmpty().withMessage('L\'ID della filiale è obbligatorio')
      .isUUID().withMessage('L\'ID della filiale deve essere un UUID valido'),
    
    body('edificio_id')
      .optional()
      .isUUID().withMessage('L\'ID dell\'edificio deve essere un UUID valido'),
    
    body('piano_id')
      .optional()
      .isUUID().withMessage('L\'ID del piano deve essere un UUID valido'),
    
    body('locale_id')
      .optional()
      .isUUID().withMessage('L\'ID del locale deve essere un UUID valido'),
    
    body('marca')
      .optional()
      .isLength({ max: 100 }).withMessage('La marca non può superare 100 caratteri'),
    
    body('modello')
      .optional()
      .isLength({ max: 100 }).withMessage('Il modello non può superare 100 caratteri'),
    
    body('matricola')
      .optional()
      .isLength({ max: 100 }).withMessage('La matricola non può superare 100 caratteri'),
    
    body('stato_dotazione_id')
      .optional()
      .isUUID().withMessage('L\'ID dello stato dotazione deve essere un UUID valido'),
    
    body('tipo_possesso_id')
      .optional()
      .isUUID().withMessage('L\'ID del tipo possesso deve essere un UUID valido'),
    
    body('fornitore_id')
      .optional()
      .isUUID().withMessage('L\'ID del fornitore deve essere un UUID valido'),
    
    // Campi specifici attrezzatura
    body('categoria_id')
      .optional()
      .isUUID().withMessage('L\'ID della categoria deve essere un UUID valido'),
    
    body('altro_fornitore_id')
      .optional()
      .isUUID().withMessage('L\'ID del fornitore deve essere un UUID valido'),
    
    body('super_tool')
      .optional()
      .isBoolean().withMessage('Il campo super_tool deve essere un booleano'),
    
    body('descrizione')
      .optional()
      .isString().withMessage('La descrizione deve essere una stringa')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri')
  ]
};

module.exports = attrezzaturaValidators;