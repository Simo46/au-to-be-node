'use strict';

const BasePolicy = require('./BasePolicy');
const { createLogger } = require('../utils/logger');
const logger = createLogger('policies:edificio');

/**
 * Policy per il modello Edificio
 */
class EdificioPolicy extends BasePolicy {
  constructor() {
    super('Edificio');
  }

  /**
   * Verifica se un utente può creare un nuovo edificio
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} data - Dati del nuovo edificio
   * @returns {boolean} - True se l'utente può creare
   */
  async canCreate(user, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanCreate = await super.canCreate(user, data);
      
      if (!baseCanCreate) {
        return false;
      }
      
      // Regole specifiche per la creazione di edifici:
      
      // 1. Verifica che il tenant_id sia lo stesso dell'utente che crea (se specificato)
      if (data.tenant_id && user.tenant_id && data.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di creare edificio in tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori, ufficio tecnico possono creare edifici
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per creare edifici`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in EdificioPolicy.canCreate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può leggere un edificio
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} edificio - Edificio da leggere
   * @returns {boolean} - True se l'utente può leggere
   */
  async canRead(user, edificio) {
    try {
      // Verifica base dalla classe padre
      const baseCanRead = await super.canRead(user, edificio);
      
      if (!baseCanRead) {
        return false;
      }
      
      // Regole specifiche per la lettura di edifici:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (edificio.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di accesso a edificio di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Tutti gli utenti possono leggere gli edifici del proprio tenant
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in EdificioPolicy.canRead per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può aggiornare un edificio
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} edificio - Edificio da aggiornare
   * @param {Object} data - Dati di aggiornamento
   * @returns {boolean} - True se l'utente può aggiornare
   */
  async canUpdate(user, edificio, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanUpdate = await super.canUpdate(user, edificio);
      
      if (!baseCanUpdate) {
        return false;
      }
      
      // Regole specifiche per l'aggiornamento di edifici:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (edificio.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di modificare edificio di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori, ufficio tecnico e area manager possono aggiornare edifici
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Area Manager può aggiornare solo edifici nelle filiali della propria area
      if (user.hasRole('Area Manager')) {
        // Implementazione semplificata: verifichiamo se la filiale è nell'area dell'Area Manager
        // usando i settings dell'utente dove sono memorizzate le filiali gestite
        const managedFiliali = user.settings?.managed_filiali || [];
        if (managedFiliali.includes(edificio.filiale_id)) {
          return true;
        }
        logger.warn(`Area Manager ${user.username} tenta di modificare edificio fuori dalla sua area`);
        return false;
      }
      
      // 4. Responsabile Filiale può aggiornare solo edifici della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id === edificio.filiale_id) {
        // Limita i campi che può modificare
        const allowedFields = ['description', 'notes'];
        const requestedFields = Object.keys(data);
        
        // Verifica se sta cercando di modificare campi non consentiti
        const forbiddenFields = requestedFields.filter(field => !allowedFields.includes(field));
        if (forbiddenFields.length > 0) {
          logger.warn(`Responsabile Filiale ${user.username} tenta di modificare campi non consentiti: ${forbiddenFields.join(', ')}`);
          return false;
        }
        
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per modificare edifici`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in EdificioPolicy.canUpdate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può eliminare un edificio
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} edificio - Edificio da eliminare
   * @returns {boolean} - True se l'utente può eliminare
   */
  async canDelete(user, edificio) {
    try {
      // Verifica base dalla classe padre
      const baseCanDelete = await super.canDelete(user, edificio);
      
      if (!baseCanDelete) {
        return false;
      }
      
      // Regole specifiche per l'eliminazione di edifici:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (edificio.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di eliminare edificio di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori e ufficio tecnico possono eliminare edifici
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per eliminare edifici`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in EdificioPolicy.canDelete per utente ${user?.id}`);
      return false;
    }
  }
}

module.exports = new EdificioPolicy();