'use strict';

const abilityService = require('../services/abilityService');
const { AppError } = require('../middleware/errorHandler');
const { createLogger } = require('../utils/logger');
const logger = createLogger('policies:base');

/**
 * Classe base per le policy dei modelli
 * Fornisce metodi comuni per il controllo dei permessi
 */
class BasePolicy {
  /**
   * Crea una nuova istanza di policy
   * @param {string} modelName - Nome del modello
   */
  constructor(modelName) {
    this.modelName = modelName;
  }

  /**
   * Verifica se un utente può creare un'istanza del modello
   * @param {Object} user - Utente
   * @param {Object} data - Dati per la creazione
   * @returns {boolean} - True se l'utente può creare
   */
  async canCreate(user, data) {
    try {
      return await abilityService.can(user, 'create', this.modelName);
    } catch (error) {
      logger.error({ err: error }, `Errore verifica canCreate per ${this.modelName}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può leggere un'istanza del modello
   * @param {Object} user - Utente
   * @param {Object} instance - Istanza del modello
   * @returns {boolean} - True se l'utente può leggere
   */
  async canRead(user, instance) {
    try {
      // Se l'istanza non ha un tipo definito, lo aggiungiamo
      if (!instance.__type) {
        instance.__type = this.modelName;
      }
      
      return await abilityService.can(user, 'read', instance);
    } catch (error) {
      logger.error({ err: error }, `Errore verifica canRead per ${this.modelName}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può aggiornare un'istanza del modello
   * @param {Object} user - Utente
   * @param {Object} instance - Istanza del modello
   * @param {Object} data - Dati di aggiornamento
   * @returns {boolean} - True se l'utente può aggiornare
   */
  async canUpdate(user, instance, data) {
    try {
      // Se l'istanza non ha un tipo definito, lo aggiungiamo
      if (!instance.__type) {
        instance.__type = this.modelName;
      }
      
      return await abilityService.can(user, 'update', instance);
    } catch (error) {
      logger.error({ err: error }, `Errore verifica canUpdate per ${this.modelName}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può eliminare un'istanza del modello
   * @param {Object} user - Utente
   * @param {Object} instance - Istanza del modello
   * @returns {boolean} - True se l'utente può eliminare
   */
  async canDelete(user, instance) {
    try {
      // Se l'istanza non ha un tipo definito, lo aggiungiamo
      if (!instance.__type) {
        instance.__type = this.modelName;
      }
      
      return await abilityService.can(user, 'delete', instance);
    } catch (error) {
      logger.error({ err: error }, `Errore verifica canDelete per ${this.modelName}`);
      return false;
    }
  }

  /**
   * Autorizza un'azione o lancia un'eccezione
   * @param {boolean} condition - Risultato della verifica permessi
   * @param {string} message - Messaggio di errore
   * @throws {AppError} - Errore di autorizzazione
   */
  authorize(condition, message = 'Non autorizzato') {
    if (!condition) {
      throw AppError.authorization(message);
    }
  }

  /**
   * Filtra i campi di un'istanza in base ai permessi dell'utente
   * @param {Object} user - Utente
   * @param {Object} instance - Istanza del modello
   * @returns {Object} - Istanza con solo i campi accessibili
   */
  async scopeFields(user, instance) {
    try {
      const ability = await abilityService.defineAbilityFor(user);
      
      // Se l'istanza non ha un tipo definito, lo aggiungiamo
      if (!instance.__type) {
        instance.__type = this.modelName;
      }
      
      // Ottieni gli attributi accessibili
      const accessibleFields = ability.rulesFor('read', instance)
        .filter(rule => !rule.inverted)
        .flatMap(rule => rule.fields || []);
      
      // Se non ci sono campi specificati, restituisci l'istanza completa
      if (!accessibleFields.length) {
        return instance;
      }
      
      // Filtra i campi dell'istanza
      const filteredInstance = {};
      accessibleFields.forEach(field => {
        if (instance[field] !== undefined) {
          filteredInstance[field] = instance[field];
        }
      });
      
      return filteredInstance;
    } catch (error) {
      logger.error({ err: error }, `Errore filtraggio campi per ${this.modelName}`);
      return instance;
    }
  }
}

module.exports = BasePolicy;