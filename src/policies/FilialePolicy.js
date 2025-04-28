'use strict';

const BasePolicy = require('./BasePolicy');
const { createLogger } = require('../utils/logger');
const logger = createLogger('policies:filiale');

/**
 * Policy per il modello Filiale
 */
class FilialePolicy extends BasePolicy {
  constructor() {
    super('Filiale');
  }

  /**
   * Verifica se un utente può creare una nuova filiale
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} data - Dati della nuova filiale
   * @returns {boolean} - True se l'utente può creare
   */
  async canCreate(user, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanCreate = await super.canCreate(user, data);
      
      if (!baseCanCreate) {
        return false;
      }
      
      // Regole specifiche per la creazione di filiali:
      
      // 1. Verifica che il tenant_id sia lo stesso dell'utente che crea (se specificato)
      if (data.tenant_id && user.tenant_id && data.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di creare filiale in tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori, ufficio tecnico e ufficio post vendita possono creare filiali
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per creare filiali`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in FilialePolicy.canCreate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può leggere una filiale
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} filiale - Filiale da leggere
   * @returns {boolean} - True se l'utente può leggere
   */
  async canRead(user, filiale) {
    try {
      // Verifica base dalla classe padre
      const baseCanRead = await super.canRead(user, filiale);
      
      if (!baseCanRead) {
        return false;
      }
      
      // Regole specifiche per la lettura di filiali:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (filiale.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di accesso a filiale di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Tutti gli utenti possono leggere le filiali del proprio tenant
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in FilialePolicy.canRead per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può aggiornare una filiale
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} filiale - Filiale da aggiornare
   * @param {Object} data - Dati di aggiornamento
   * @returns {boolean} - True se l'utente può aggiornare
   */
  async canUpdate(user, filiale, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanUpdate = await super.canUpdate(user, filiale);
      
      if (!baseCanUpdate) {
        return false;
      }
      
      // Regole specifiche per l'aggiornamento di filiali:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (filiale.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di modificare filiale di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori, ufficio tecnico e area manager possono aggiornare filiali
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Area Manager può aggiornare solo filiali nella propria area
      if (user.hasRole('Area Manager')) {
        // Implementazione semplificata: verifichiamo se la filiale è nell'area dell'Area Manager
        // usando i settings dell'utente dove sono memorizzate le filiali gestite
        const managedFiliali = user.settings?.managed_filiali || [];
        if (managedFiliali.includes(filiale.id)) {
          return true;
        }
        logger.warn(`Area Manager ${user.username} tenta di modificare filiale fuori dalla sua area`);
        return false;
      }
      
      // 4. Responsabile Filiale può aggiornare solo la propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id === filiale.id) {
        // Limita i campi che può modificare
        const allowedFields = ['telefono', 'email', 'fax', 'notes'];
        const requestedFields = Object.keys(data);
        
        // Verifica se sta cercando di modificare campi non consentiti
        const forbiddenFields = requestedFields.filter(field => !allowedFields.includes(field));
        if (forbiddenFields.length > 0) {
          logger.warn(`Responsabile Filiale ${user.username} tenta di modificare campi non consentiti: ${forbiddenFields.join(', ')}`);
          return false;
        }
        
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per modificare filiali`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in FilialePolicy.canUpdate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può eliminare una filiale
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} filiale - Filiale da eliminare
   * @returns {boolean} - True se l'utente può eliminare
   */
  async canDelete(user, filiale) {
    try {
      // Verifica base dalla classe padre
      const baseCanDelete = await super.canDelete(user, filiale);
      
      if (!baseCanDelete) {
        return false;
      }
      
      // Regole specifiche per l'eliminazione di filiali:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (filiale.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di eliminare filiale di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori e ufficio tecnico possono eliminare filiali
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per eliminare filiali`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in FilialePolicy.canDelete per utente ${user?.id}`);
      return false;
    }
  }
}

module.exports = new FilialePolicy();