'use strict';

const { body } = require('express-validator');

/**
 * Validazioni per le rotte di gestione strumenti di misura
 */
const strumentoValidators = {
  /**
   * Validazioni per la creazione di uno strumento di misura
   * Nota: i campi base dell'asset devono essere validati separatamente
   */
  createStrumento: [
    body('asset_id')
      .notEmpty().withMessage('L\'ID dell\'asset è obbligatorio')
      .isUUID().withMessage('L\'ID dell\'asset deve essere un UUID valido'),
    
    body('categoria_id')
      .optional()
      .isUUID().withMessage('L\'ID della categoria deve essere un UUID valido'),
    
    body('descrizione')
      .optional()
      .isString().withMessage('La descrizione deve essere una stringa')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri')
  ],

  /**
   * Validazioni per l'aggiornamento di uno strumento di misura
   */
  updateStrumento: [
    body('categoria_id')
      .optional()
      .isUUID().withMessage('L\'ID della categoria deve essere un UUID valido'),
    
    body('descrizione')
      .optional()
      .isString().withMessage('La descrizione deve essere una stringa')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri')
  ],

  /**
   * Validazioni per la creazione combinata di asset e strumento di misura
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
    
    // Campi specifici strumento di misura
    body('categoria_id')
      .optional()
      .isUUID().withMessage('L\'ID della categoria deve essere un UUID valido'),
    
    body('descrizione')
      .optional()
      .isString().withMessage('La descrizione deve essere una stringa')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri')
  ]
};

module.exports = strumentoValidators;