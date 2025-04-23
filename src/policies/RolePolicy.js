'use strict';

const BasePolicy = require('./BasePolicy');
const { createLogger } = require('../utils/logger');
const logger = createLogger('policies:role');

/**
 * Policy per il modello Role
 */
class RolePolicy extends BasePolicy {
  constructor() {
    super('Role');
  }

  /**
   * Verifica se un utente può creare un nuovo ruolo
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} data - Dati del nuovo ruolo
   * @returns {boolean} - True se l'utente può creare
   */
  async canCreate(user, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanCreate = await super.canCreate(user, data);
      
      if (!baseCanCreate) {
        return false;
      }
      
      // Solo gli amministratori possono creare ruoli
      if (!user.hasRole('Amministratore di Sistema')) {
        logger.warn(`Utente non amministratore tenta di creare ruolo: ${user.username}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in RolePolicy.canCreate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può leggere un ruolo
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} role - Ruolo da leggere
   * @returns {boolean} - True se l'utente può leggere
   */
  async canRead(user, role) {
    try {
      // Verifica base dalla classe padre
      const baseCanRead = await super.canRead(user, role);
      
      if (!baseCanRead) {
        return false;
      }
      
      // Tutti gli utenti autenticati possono leggere i ruoli
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in RolePolicy.canRead per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può aggiornare un ruolo
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} role - Ruolo da aggiornare
   * @param {Object} data - Dati di aggiornamento
   * @returns {boolean} - True se l'utente può aggiornare
   */
  async canUpdate(user, role, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanUpdate = await super.canUpdate(user, role);
      
      if (!baseCanUpdate) {
        return false;
      }
      
      // Solo gli amministratori possono modificare ruoli
      if (!user.hasRole('Amministratore di Sistema')) {
        logger.warn(`Utente non amministratore tenta di modificare ruolo: ${user.username}`);
        return false;
      }
      
      // Protezione aggiuntiva per il ruolo amministratore
      if (role.name === 'Amministratore di Sistema') {
        // Se sta cercando di modificare le abilità del ruolo amministratore
        if (data.abilities && Array.isArray(data.abilities)) {
          logger.warn(`Tentativo di modificare abilità del ruolo amministratore da parte di ${user.username}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in RolePolicy.canUpdate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può eliminare un ruolo
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} role - Ruolo da eliminare
   * @returns {boolean} - True se l'utente può eliminare
   */
  async canDelete(user, role) {
    try {
      // Verifica base dalla classe padre
      const baseCanDelete = await super.canDelete(user, role);
      
      if (!baseCanDelete) {
        return false;
      }
      
      // Solo gli amministratori possono eliminare ruoli
      if (!user.hasRole('Amministratore di Sistema')) {
        logger.warn(`Utente non amministratore tenta di eliminare ruolo: ${user.username}`);
        return false;
      }
      
      // Non consentire l'eliminazione dei ruoli predefiniti del sistema
      const systemRoles = [
        'Amministratore di Sistema', 
        'Ufficio Tecnico', 
        'Ufficio Post Vendita', 
        'Area Manager', 
        'Responsabile Filiale', 
        'Responsabile Officina e Service', 
        'Magazzino'
      ];
      
      if (systemRoles.includes(role.name)) {
        logger.warn(`Tentativo di eliminare ruolo predefinito ${role.name} da parte di ${user.username}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in RolePolicy.canDelete per utente ${user?.id}`);
      return false;
    }
  }
}

module.exports = new RolePolicy();