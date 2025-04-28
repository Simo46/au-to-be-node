'use strict';

const { body } = require('express-validator');

/**
 * Validazioni per le rotte di gestione filiali
 */
const filialeValidators = {
  /**
   * Validazioni per la creazione di una filiale
   */
  createFiliale: [
    body('code')
      .notEmpty().withMessage('Il codice è obbligatorio')
      .isLength({ min: 2, max: 50 }).withMessage('Il codice deve essere compreso tra 2 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .notEmpty().withMessage('La descrizione è obbligatoria')
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('comune')
      .notEmpty().withMessage('Il comune è obbligatorio')
      .isLength({ max: 100 }).withMessage('Il comune non può superare 100 caratteri'),
    
    body('provincia')
      .notEmpty().withMessage('La provincia è obbligatoria')
      .isLength({ max: 50 }).withMessage('La provincia non può superare 50 caratteri'),
    
    body('regione')
      .notEmpty().withMessage('La regione è obbligatoria')
      .isLength({ max: 50 }).withMessage('La regione non può superare 50 caratteri'),
    
    body('cap')
      .notEmpty().withMessage('Il CAP è obbligatorio')
      .isLength({ max: 10 }).withMessage('Il CAP non può superare 10 caratteri'),
    
    body('numero_civico')
      .optional()
      .isLength({ max: 10 }).withMessage('Il numero civico non può superare 10 caratteri'),
    
    body('via')
      .optional()
      .isLength({ max: 100 }).withMessage('La via non può superare 100 caratteri'),
    
    body('interno')
      .optional()
      .isLength({ max: 10 }).withMessage('L\'interno non può superare 10 caratteri'),
    
    body('telefono')
      .optional()
      .isLength({ max: 20 }).withMessage('Il telefono non può superare 20 caratteri'),
    
    body('email')
      .optional()
      .isEmail().withMessage('L\'email non è valida')
      .isLength({ max: 100 }).withMessage('L\'email non può superare 100 caratteri'),
    
    body('fax')
      .optional()
      .isLength({ max: 20 }).withMessage('Il fax non può superare 20 caratteri'),
    
    // Referenti
    body('nome_referente_sede')
      .optional()
      .isLength({ max: 100 }).withMessage('Il nome del referente non può superare 100 caratteri'),
    
    body('cognome_referente_sede')
      .optional()
      .isLength({ max: 100 }).withMessage('Il cognome del referente non può superare 100 caratteri'),
    
    body('email_referente_sede')
      .optional()
      .isEmail().withMessage('L\'email del referente non è valida')
      .isLength({ max: 100 }).withMessage('L\'email del referente non può superare 100 caratteri'),
    
    // Struttura
    body('mq_sales')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_after_sales')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_bagno')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_accettazione')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_officina')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_locale_tecnico')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_magazzino')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_area_consegna')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_piazzale_esterno')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_ufficio')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('mq_area_di_vendita')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('superficie_lotto')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('superficie_coperta')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('superficie_netta')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    body('superficie_utilizzata')
      .optional()
      .isNumeric().withMessage('I metri quadri devono essere un numero'),
    
    // Informazioni aziendali
    body('brand')
      .optional()
      .isArray().withMessage('I brand devono essere un array'),
    
    body('tipologia_contrattuale')
      .optional()
      .isInt().withMessage('La tipologia contrattuale deve essere un numero intero'),
    
    body('scadenza_tipo_contratto')
      .optional()
      .isISO8601().withMessage('La data deve essere nel formato ISO8601'),
    
    body('anno_costruzione')
      .optional()
      .isInt().withMessage('L\'anno deve essere un numero intero'),
    
    body('importo_annuo')
      .optional()
      .isNumeric().withMessage('L\'importo deve essere un numero'),
    
    body('locatore')
      .optional()
      .isLength({ max: 100 }).withMessage('Il locatore non può superare 100 caratteri'),
    
    body('licenza_di_commercio')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    // Servizi offerti
    body('autolavaggio')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    body('carrozzeria')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    body('officina_mezzi_pesanti')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    body('reti_antigrandine')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    // Impianti tecnologici
    body('impianto_fotovoltaico')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    body('kw_impianto_fotovoltaico')
      .optional()
      .isNumeric().withMessage('I kilowatt devono essere un numero'),
    
    body('cabina_trasformazione')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    body('presenza_luci_led')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    body('presenza_scarico_notturno')
      .optional()
      .isBoolean().withMessage('Il valore deve essere booleano'),
    
    // Altri campi validati sono omessi per brevità
    
    body('active')
      .optional()
      .isBoolean().withMessage('Lo stato attivo deve essere un booleano'),
    
    body('notes')
      .optional()
      .isString().withMessage('Le note devono essere una stringa')
  ],

  /**
   * Validazioni per l'aggiornamento di una filiale (simili a quelle di creazione ma tutti i campi sono opzionali)
   */
  updateFiliale: [
    body('code')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Il codice deve essere compreso tra 2 e 50 caratteri')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Il codice può contenere solo lettere, numeri, trattini e underscore'),
    
    body('description')
      .optional()
      .isLength({ max: 255 }).withMessage('La descrizione non può superare 255 caratteri'),
    
    body('comune')
      .optional()
      .isLength({ max: 100 }).withMessage('Il comune non può superare 100 caratteri'),
    
    body('provincia')
      .optional()
      .isLength({ max: 50 }).withMessage('La provincia non può superare 50 caratteri'),
    
    body('regione')
      .optional()
      .isLength({ max: 50 }).withMessage('La regione non può superare 50 caratteri'),
    
    body('cap')
      .optional()
      .isLength({ max: 10 }).withMessage('Il CAP non può superare 10 caratteri'),
    
    body('numero_civico')
      .optional()
      .isLength({ max: 10 }).withMessage('Il numero civico non può superare 10 caratteri'),
    
    body('via')
      .optional()
      .isLength({ max: 100 }).withMessage('La via non può superare 100 caratteri'),
    
    body('interno')
      .optional()
      .isLength({ max: 10 }).withMessage('L\'interno non può superare 10 caratteri'),
    
    body('telefono')
      .optional()
      .isLength({ max: 20 }).withMessage('Il telefono non può superare 20 caratteri'),
    
    body('email')
      .optional()
      .isEmail().withMessage('L\'email non è valida')
      .isLength({ max: 100 }).withMessage('L\'email non può superare 100 caratteri'),
    
    body('fax')
      .optional()
      .isLength({ max: 20 }).withMessage('Il fax non può superare 20 caratteri'),
    
    // Altri campi validati sono omessi per brevità e sono tutti optional

    body('active')
      .optional()
      .isBoolean().withMessage('Lo stato attivo deve essere un booleano'),
    
    body('notes')
      .optional()
      .isString().withMessage('Le note devono essere una stringa')
  ]
};

module.exports = filialeValidators;