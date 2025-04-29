'use strict';

const BasePolicy = require('./BasePolicy');
const { createLogger } = require('../utils/logger');
const logger = createLogger('policies:asset');

/**
 * Policy per il modello Asset
 */
class AssetPolicy extends BasePolicy {
  constructor() {
    super('Asset');
  }

  /**
   * Verifica se un utente può creare un nuovo asset
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} data - Dati del nuovo asset
   * @returns {boolean} - True se l'utente può creare
   */
  async canCreate(user, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanCreate = await super.canCreate(user, data);
      
      if (!baseCanCreate) {
        return false;
      }
      
      // Regole specifiche per la creazione di asset:
      
      // 1. Verifica che il tenant_id sia lo stesso dell'utente che crea (se specificato)
      if (data.tenant_id && user.tenant_id && data.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di creare asset in tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Amministratori, Ufficio Tecnico e Responsabili Filiale possono creare asset
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Responsabile Filiale può creare asset solo nella propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id) {
        return user.filiale_id === data.filiale_id;
      }
      
      // 4. Responsabile Officina e Service può creare asset solo nella propria filiale
      if (user.hasRole('Responsabile Officina e Service') && user.filiale_id) {
        return user.filiale_id === data.filiale_id;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per creare asset`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in AssetPolicy.canCreate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può leggere un asset
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} asset - Asset da leggere
   * @returns {boolean} - True se l'utente può leggere
   */
  async canRead(user, asset) {
    try {
      // Verifica base dalla classe padre
      const baseCanRead = await super.canRead(user, asset);
      
      if (!baseCanRead) {
        return false;
      }
      
      // Regole specifiche per la lettura di asset:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (asset.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di accesso a asset di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Amministratori e Ufficio Tecnico possono leggere qualsiasi asset
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico', 'Ufficio Post Vendita'])) {
        return true;
      }
      
      // 3. Area Manager può leggere solo asset nelle filiali della propria area
      if (user.hasRole('Area Manager')) {
        const managedFiliali = user.settings?.managed_filiali || [];
        return managedFiliali.includes(asset.filiale_id);
      }
      
      // 4. Responsabile Filiale può leggere solo asset della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id) {
        return user.filiale_id === asset.filiale_id;
      }
      
      // 5. Responsabile Officina e Service può leggere solo asset della propria filiale
      if (user.hasRole('Responsabile Officina e Service') && user.filiale_id) {
        return user.filiale_id === asset.filiale_id;
      }
      
      // 6. Magazzino può leggere solo asset della propria filiale
      if (user.hasRole('Magazzino') && user.filiale_id) {
        return user.filiale_id === asset.filiale_id;
      }
      
      // 7. Per altri ruoli, controllo ulteriore a livello di filiale
      if (user.filiale_id) {
        return user.filiale_id === asset.filiale_id;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per leggere asset`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in AssetPolicy.canRead per utente ${user?.id}`);
      return false;
    }
  }
  
  /**
   * Verifica se un utente può aggiornare un asset
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} asset - Asset da aggiornare
   * @param {Object} data - Dati di aggiornamento
   * @returns {boolean} - True se l'utente può aggiornare
   */
  async canUpdate(user, asset, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanUpdate = await super.canUpdate(user, asset);
      
      if (!baseCanUpdate) {
        return false;
      }
      
      // Regole specifiche per l'aggiornamento di asset:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (asset.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di modificare asset di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Amministratori e Ufficio Tecnico possono aggiornare qualsiasi asset
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Ufficio Post Vendita può aggiornare asset di qualsiasi filiale
      if (user.hasRole('Ufficio Post Vendita')) {
        return true;
      }
      
      // 4. Area Manager può aggiornare solo asset nelle filiali della propria area
      if (user.hasRole('Area Manager')) {
        const managedFiliali = user.settings?.managed_filiali || [];
        if (!managedFiliali.includes(asset.filiale_id)) {
          logger.warn(`Area Manager ${user.username} tenta di modificare asset fuori dalla sua area`);
          return false;
        }
        
        // Se si sta cercando di cambiare la filiale, verificare che la nuova sia nell'area
        if (data.filiale_id && !managedFiliali.includes(data.filiale_id)) {
          logger.warn(`Area Manager ${user.username} tenta di spostare asset in filiale fuori dalla sua area`);
          return false;
        }
        
        return true;
      }
      
      // 5. Responsabile Filiale può aggiornare solo asset della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id) {
        if (user.filiale_id !== asset.filiale_id) {
          logger.warn(`Responsabile Filiale ${user.username} tenta di modificare asset di altra filiale`);
          return false;
        }
        
        // Non può cambiare filiale
        if (data.filiale_id && data.filiale_id !== user.filiale_id) {
          logger.warn(`Responsabile Filiale ${user.username} tenta di spostare asset in altra filiale`);
          return false;
        }
        
        return true;
      }
      
      // 6. Responsabile Officina e Service può aggiornare solo asset della propria filiale
      if (user.hasRole('Responsabile Officina e Service') && user.filiale_id) {
        if (user.filiale_id !== asset.filiale_id) {
          logger.warn(`Responsabile Officina ${user.username} tenta di modificare asset di altra filiale`);
          return false;
        }
        
        // Non può cambiare filiale
        if (data.filiale_id && data.filiale_id !== user.filiale_id) {
          logger.warn(`Responsabile Officina ${user.username} tenta di spostare asset in altra filiale`);
          return false;
        }
        
        return true;
      }
      
      // 7. Magazzino può aggiornare solo campi limitati (scatola, scaffale) degli asset della propria filiale
      if (user.hasRole('Magazzino') && user.filiale_id) {
        if (user.filiale_id !== asset.filiale_id) {
          logger.warn(`Magazzino ${user.username} tenta di modificare asset di altra filiale`);
          return false;
        }
        
        // Può aggiornare solo campi specifici
        const allowedFields = ['scatola', 'scaffale', 'notes'];
        const requestedFields = Object.keys(data);
        
        const forbiddenFields = requestedFields.filter(field => !allowedFields.includes(field));
        if (forbiddenFields.length > 0) {
          logger.warn(`Magazzino ${user.username} tenta di modificare campi non consentiti: ${forbiddenFields.join(', ')}`);
          return false;
        }
        
        return true;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per modificare asset`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in AssetPolicy.canUpdate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può eliminare un asset
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} asset - Asset da eliminare
   * @returns {boolean} - True se l'utente può eliminare
   */
  async canDelete(user, asset) {
    try {
      // Verifica base dalla classe padre
      const baseCanDelete = await super.canDelete(user, asset);
      
      if (!baseCanDelete) {
        return false;
      }
      
      // Regole specifiche per l'eliminazione di asset:
      
      // 1. Verifica che il tenant_id sia lo stesso
      if (asset.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di eliminare asset di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori e ufficio tecnico possono eliminare asset
      if (user.hasAnyRole(['Amministratore di Sistema', 'Ufficio Tecnico'])) {
        return true;
      }
      
      // 3. Responsabile Filiale può eliminare solo asset della propria filiale
      if (user.hasRole('Responsabile Filiale') && user.filiale_id) {
        return user.filiale_id === asset.filiale_id;
      }
      
      logger.warn(`Utente ${user.username} senza permessi sufficienti per eliminare asset`);
      return false;
    } catch (error) {
      logger.error({ err: error }, `Errore in AssetPolicy.canDelete per utente ${user?.id}`);
      return false;
    }
  }
}

module.exports = new AssetPolicy();