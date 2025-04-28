'use strict';

const BasePolicy = require('./BasePolicy');
const { createLogger } = require('../utils/logger');
const logger = createLogger('policies:piano');

/**
 * Policy per il modello Piano
 */
class PianoPolicy extends BasePolicy {
  constructor() {
    super('Piano');
  }

  /**
   * Verifica se un utente può creare un nuovo piano
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} data - Dati del nuovo piano
   * @returns {boolean} - True se l'utente può creare
   */
  async canCreate(user, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanCreate = await super.canCreate(user, data);
      
      if (!baseCanCreate) {
        return false;
      }
      
      // Regole specifiche per la creazione di piani:
      
      // 1. Verifica che il tenant_id sia lo stesso dell'utente che crea (se specificato)
      if (data.tenant_id && user.tenant_id && data.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di creare piano in tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori, ufficio tecnico possono creare piani
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Responsabile Filiale può creare piani solo nella propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id && user.filiale_id === data.filiale_id) {
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per creare piani`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in PianoPolicy.canCreate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può leggere un piano
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} piano - Piano da leggere
   * @returns {boolean} - True se l'utente può leggere
   */
  async canRead(user, piano) {
    try {
      // Verifica base dalla classe padre
      const baseCanRead = await super.canRead(user, piano);
      
      if (!baseCanRead) {
        return false;
      }
      
      // Regole specifiche per la lettura di piani:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (piano.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di accesso a piano di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Tutti gli utenti possono leggere i piani del proprio tenant
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in PianoPolicy.canRead per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può aggiornare un piano
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} piano - Piano da aggiornare
   * @param {Object} data - Dati di aggiornamento
   * @returns {boolean} - True se l'utente può aggiornare
   */
  async canUpdate(user, piano, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanUpdate = await super.canUpdate(user, piano);
      
      if (!baseCanUpdate) {
        return false;
      }
      
      // Regole specifiche per l'aggiornamento di piani:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (piano.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di modificare piano di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori e ufficio tecnico possono aggiornare qualsiasi piano
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Area Manager può aggiornare solo piani nelle filiali della propria area
      if (user.hasRole('Area Manager')) {
        // Verifichiamo se la filiale del piano è nell'area dell'Area Manager
        const managedFiliali = user.settings?.managed_filiali || [];
        if (managedFiliali.includes(piano.filiale_id)) {
          return true;
        }
        logger.warn(`Area Manager ${user.username} tenta di modificare piano fuori dalla sua area`);
        return false;
      }
      
      // 4. Responsabile Filiale può aggiornare solo piani della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id === piano.filiale_id) {
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
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per modificare piani`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in PianoPolicy.canUpdate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può eliminare un piano
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} piano - Piano da eliminare
   * @returns {boolean} - True se l'utente può eliminare
   */
  async canDelete(user, piano) {
    try {
      // Verifica base dalla classe padre
      const baseCanDelete = await super.canDelete(user, piano);
      
      if (!baseCanDelete) {
        return false;
      }
      
      // Regole specifiche per l'eliminazione di piani:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (piano.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di eliminare piano di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori e ufficio tecnico possono eliminare piani
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Responsabile Filiale può eliminare piani della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id === piano.filiale_id) {
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per eliminare piani`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in PianoPolicy.canDelete per utente ${user?.id}`);
      return false;
    }
  }
}

module.exports = new PianoPolicy();