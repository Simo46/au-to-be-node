'use strict';

const { body } = require('express-validator');

/**
 * Validazioni per le rotte di gestione asset
 */
const assetValidators = {
  /**
   * Validazioni per la creazione di un asset
   */
  createAsset: [
    body('code')
      .notEmpty().withMessage('Il codice è obbligatorio')
      .isLength({ min: 2, max: 50 }).withMessage('Il codice deve essere compreso tra 2 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .notEmpty().withMessage('La descrizione è obbligatoria')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('asset_type')
      .notEmpty().withMessage('Il tipo di asset è obbligatorio')
      .isIn(['attrezzatura', 'strumento_misura', 'impianto']).withMessage('Il tipo di asset deve essere uno tra: attrezzatura, strumento_misura, impianto'),
    
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
    
    body('data_ultima_manutenzione')
      .optional()
      .isISO8601().withMessage('La data deve essere in formato ISO8601'),
    
    body('data_prossima_manutenzione')
      .optional()
      .isISO8601().withMessage('La data deve essere in formato ISO8601'),
    
    body('frequenza_manutenzione')
      .optional()
      .isInt({ min: 1 }).withMessage('La frequenza di manutenzione deve essere un numero intero positivo'),
    
    body('stato_interventi_id')
      .optional()
      .isUUID().withMessage('L\'ID dello stato interventi deve essere un UUID valido'),
    
    body('scatola')
      .optional()
      .isLength({ max: 100 }).withMessage('La scatola non può superare 100 caratteri'),
    
    body('scaffale')
      .optional()
      .isLength({ max: 100 }).withMessage('Lo scaffale non può superare 100 caratteri'),
    
    body('data_acquisto')
      .optional()
      .isISO8601().withMessage('La data deve essere in formato ISO8601'),
    
    body('notes')
      .optional()
      .isString().withMessage('Le note devono essere una stringa'),
    
    body('active')
      .optional()
      .isBoolean().withMessage('Lo stato attivo deve essere un booleano')
  ],

  /**
   * Validazioni per l'aggiornamento di un asset
   */
  updateAsset: [
    body('code')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Il codice deve essere compreso tra 2 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .optional()
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('asset_type')
      .optional()
      .isIn(['attrezzatura', 'strumento_misura', 'impianto']).withMessage('Il tipo di asset deve essere uno tra: attrezzatura, strumento_misura, impianto'),
    
    body('filiale_id')
      .optional()
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
    
    body('data_ultima_manutenzione')
      .optional()
      .isISO8601().withMessage('La data deve essere in formato ISO8601'),
    
    body('data_prossima_manutenzione')
      .optional()
      .isISO8601().withMessage('La data deve essere in formato ISO8601'),
    
    body('frequenza_manutenzione')
      .optional()
      .isInt({ min: 1 }).withMessage('La frequenza di manutenzione deve essere un numero intero positivo'),
    
    body('stato_interventi_id')
      .optional()
      .isUUID().withMessage('L\'ID dello stato interventi deve essere un UUID valido'),
    
    body('scatola')
      .optional()
      .isLength({ max: 100 }).withMessage('La scatola non può superare 100 caratteri'),
    
    body('scaffale')
      .optional()
      .isLength({ max: 100 }).withMessage('Lo scaffale non può superare 100 caratteri'),
    
    body('data_acquisto')
      .optional()
      .isISO8601().withMessage('La data deve essere in formato ISO8601'),
    
    body('notes')
      .optional()
      .isString().withMessage('Le note devono essere una stringa'),
    
    body('active')
      .optional()
      .isBoolean().withMessage('Lo stato attivo deve essere un booleano')
  ]
};

module.exports = assetValidators;