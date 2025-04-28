'use strict';

const BasePolicy = require('./BasePolicy');
const { createLogger } = require('../utils/logger');
const logger = createLogger('policies:locale');

/**
 * Policy per il modello locale
 */
class LocalePolicy extends BasePolicy {
  constructor() {
    super('locale');
  }

  /**
   * Verifica se un utente può creare un nuovo locale
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} data - Dati del nuovo locale
   * @returns {boolean} - True se l'utente può creare
   */
  async canCreate(user, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanCreate = await super.canCreate(user, data);
      
      if (!baseCanCreate) {
        return false;
      }
      
      // Regole specifiche per la creazione di locali:
      
      // 1. Verifica che il tenant_id sia lo stesso dell'utente che crea (se specificato)
      if (data.tenant_id && user.tenant_id && data.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di creare locale in tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori, ufficio tecnico e ufficio post vendita possono creare locali
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Responsabile Filiale può creare locali solo nella propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id) {
        return user.filiale_id === data.filiale_id;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per creare locali`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in LocalePolicy.canCreate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può leggere un locale
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} locale - Locale da leggere
   * @returns {boolean} - True se l'utente può leggere
   */
  async canRead(user, locale) {
    try {
      // Verifica base dalla classe padre
      const baseCanRead = await super.canRead(user, locale);
      
      if (!baseCanRead) {
        return false;
      }
      
      // Regole specifiche per la lettura di locali:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (locale.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di accesso a locale di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Amministratori, Ufficio Tecnico e Ufficio Post Vendita possono leggere qualsiasi locale
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico', 'Ufficio Post Vendita'])) {
        return true;
      }
      
      // 3. Area Manager può leggere solo locali delle filiali nella propria area
      if (user.hasRole('Area Manager')) {
        const managedFiliali = user.settings?.managed_filiali || [];
        return managedFiliali.includes(locale.filiale_id);
      }
      
      // 4. Responsabile Filiale può leggere solo locali della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id) {
        return user.filiale_id === locale.filiale_id;
      }
      
      // 5. Responsabile Officina e Service può leggere solo locali della propria filiale
      if (user.hasRole('Responsabile Officina e Service') && user.filiale_id) {
        return user.filiale_id === locale.filiale_id;
      }
      
      // 6. Magazzino può leggere solo locali della propria filiale
      if (user.hasRole('Magazzino') && user.filiale_id) {
        return user.filiale_id === locale.filiale_id;
      }
      
      // 7. Per altri ruoli, controllo ulteriore a livello di filiale
      if (user.filiale_id) {
        return user.filiale_id === locale.filiale_id;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per leggere locali`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in LocalePolicy.canRead per utente ${user?.id}`);
      return false;
    }
  }
  
  /**
   * Verifica se un utente può aggiornare un locale
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} locale - Locale da aggiornare
   * @param {Object} data - Dati di aggiornamento
   * @returns {boolean} - True se l'utente può aggiornare
   */
  async canUpdate(user, locale, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanUpdate = await super.canUpdate(user, locale);
      
      if (!baseCanUpdate) {
        return false;
      }
      
      // Regole specifiche per l'aggiornamento di locali:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (locale.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di modificare locale di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Amministratori e Ufficio Tecnico possono aggiornare qualsiasi locale
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Area Manager può aggiornare solo locali delle filiali nella propria area
      if (user.hasRole('Area Manager')) {
        const managedFiliali = user.settings?.managed_filiali || [];
        if (!managedFiliali.includes(locale.filiale_id)) {
          logger.warn(`Area Manager ${user.username} tenta di modificare locale fuori dalla sua area`);
          return false;
        }
        
        // Se si sta cercando di cambiare la filiale, verificare che la nuova sia nell'area
        if (data.filiale_id && !managedFiliali.includes(data.filiale_id)) {
          logger.warn(`Area Manager ${user.username} tenta di spostare locale in filiale fuori dalla sua area`);
          return false;
        }
        
        return true;
      }
      
      // 4. Responsabile Filiale può aggiornare solo locali della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id) {
        if (user.filiale_id !== locale.filiale_id) {
          logger.warn(`Responsabile Filiale ${user.username} tenta di modificare locale di altra filiale`);
          return false;
        }
        
        // Non può cambiare filiale
        if (data.filiale_id && data.filiale_id !== user.filiale_id) {
          logger.warn(`Responsabile Filiale ${user.username} tenta di spostare locale in altra filiale`);
          return false;
        }
        
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per modificare locali`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in LocalePolicy.canUpdate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può eliminare un locale
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} locale - Locale da eliminare
   * @returns {boolean} - True se l'utente può eliminare
   */
  async canDelete(user, locale) {
    try {
      // Verifica base dalla classe padre
      const baseCanDelete = await super.canDelete(user, locale);
      
      if (!baseCanDelete) {
        return false;
      }
      
      // Regole specifiche per l'eliminazione di locali:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (locale.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di eliminare locale di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori e ufficio tecnico possono eliminare locali
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Responsabile Filiale può eliminare solo locali della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id) {
        return user.filiale_id === locale.filiale_id;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per eliminare locali`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in LocalePolicy.canDelete per utente ${user?.id}`);
      return false;
    }
  }
}

module.exports = new LocalePolicy();