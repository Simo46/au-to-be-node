'use strict';

const BasePolicy = require('./BasePolicy');
const { createLogger } = require('../utils/logger');
const logger = createLogger('policies:user');

/**
 * Policy per il modello User
 */
class UserPolicy extends BasePolicy {
  constructor() {
    super('User');
  }

  /**
   * Verifica se un utente può creare un nuovo utente
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} data - Dati del nuovo utente
   * @returns {boolean} - True se l'utente può creare
   */
  async canCreate(user, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanCreate = await super.canCreate(user, data);
      
      if (!baseCanCreate) {
        return false;
      }
      
      // Regole specifiche per la creazione di utenti:
      
      // 1. Verifica che il tenant_id sia lo stesso dell'utente che crea (se specificato)
      if (data.tenant_id && user.tenant_id && data.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di creare utente in tenant diverso: ${user.username}`);
        return false;
      }
      
      // 2. Solo amministratori possono assegnare ruoli elevati
      if (data.roles && Array.isArray(data.roles)) {
        // Se l'utente sta cercando di assegnare ruoli amministrativi, verifica che sia admin
        const hasAdminRole = data.roles.some(role => 
          typeof role === 'string' 
            ? role === 'admin' || role === 'Amministratore di Sistema' 
            : (role.name === 'admin' || role.name === 'Amministratore di Sistema')
        );
        
        if (hasAdminRole && !user.hasRole('Amministratore di Sistema')) {
          logger.warn(`Tentativo di assegnare ruoli amministrativi da parte di ${user.username}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in UserPolicy.canCreate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può leggere un altro utente
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} targetUser - Utente da leggere
   * @returns {boolean} - True se l'utente può leggere
   */
  async canRead(user, targetUser) {
    try {
      // Verifica base dalla classe padre
      const baseCanRead = await super.canRead(user, targetUser);
      
      if (!baseCanRead) {
        return false;
      }
      
      // Regole specifiche per la lettura di utenti:
      
      // 1. Un utente può sempre leggere il proprio profilo
      if (user.id === targetUser.id) {
        return true;
      }
      
      // 2. Verifica che il tenant_id sia lo stesso (a meno che l'utente sia un amministratore globale)
      if (!user.hasRole('Amministratore di Sistema') && 
          targetUser.tenant_id && user.tenant_id && 
          targetUser.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di accesso a utente di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 3. Gli Area Manager possono vedere solo gli utenti delle filiali nella loro area
      if (user.hasRole('Area Manager') && targetUser.filiale_id) {
        // Questa è una verifica semplificata - in una implementazione reale
        // dovremmo verificare se la filiale dell'utente target appartiene all'area del manager
        // Per ora, assumiamo che un Area Manager possa vedere tutti gli utenti con filiale_id
        return true;
      }
      
      // 4. I Responsabili Filiale possono vedere solo gli utenti della loro filiale
      if (user.hasRole('Responsabile Filiale') && 
          user.filiale_id && targetUser.filiale_id && 
          user.filiale_id !== targetUser.filiale_id) {
        logger.warn(`Responsabile Filiale tenta di accedere a utente di un'altra filiale: ${user.username}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in UserPolicy.canRead per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può aggiornare un altro utente
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} targetUser - Utente da aggiornare
   * @param {Object} data - Dati di aggiornamento
   * @returns {boolean} - True se l'utente può aggiornare
   */
  async canUpdate(user, targetUser, data) {
    try {
      // Verifica base dalla classe padre
      const baseCanUpdate = await super.canUpdate(user, targetUser);
      
      if (!baseCanUpdate) {
        return false;
      }
      
      // Regole specifiche per l'aggiornamento di utenti:
      
      // 1. Un utente può sempre aggiornare il proprio profilo (ma non i propri ruoli)
      if (user.id === targetUser.id) {
        // Se sta cercando di modificare i propri ruoli, verifica che sia amministratore
        if (data.roles && !user.hasRole('Amministratore di Sistema')) {
          logger.warn(`Tentativo di auto-modifica ruoli da parte di ${user.username}`);
          return false;
        }
        return true;
      }
      
      // 2. Verifica che il tenant_id sia lo stesso (a meno che l'utente sia un amministratore globale)
      if (!user.hasRole('Amministratore di Sistema') && 
          targetUser.tenant_id && user.tenant_id && 
          targetUser.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di modificare utente di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 3. Solo amministratori possono modificare altri amministratori
      if (targetUser.hasRole('Amministratore di Sistema') && !user.hasRole('Amministratore di Sistema')) {
        logger.warn(`Tentativo di modificare amministratore da parte di ${user.username}`);
        return false;
      }
      
      // 4. Solo amministratori possono assegnare ruoli elevati
      if (data.roles && Array.isArray(data.roles)) {
        // Se l'utente sta cercando di assegnare ruoli amministrativi, verifica che sia admin
        const hasAdminRole = data.roles.some(role => 
          typeof role === 'string' 
            ? role === 'admin' || role === 'Amministratore di Sistema' 
            : (role.name === 'admin' || role.name === 'Amministratore di Sistema')
        );
        
        if (hasAdminRole && !user.hasRole('Amministratore di Sistema')) {
          logger.warn(`Tentativo di assegnare ruoli amministrativi da parte di ${user.username}`);
          return false;
        }
      }
      
      // 5. Un Responsabile Filiale può modificare solo utenti della sua filiale
      if (user.hasRole('Responsabile Filiale') && 
          user.filiale_id && targetUser.filiale_id && 
          user.filiale_id !== targetUser.filiale_id) {
        logger.warn(`Responsabile Filiale tenta di modificare utente di un'altra filiale: ${user.username}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in UserPolicy.canUpdate per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente può eliminare un altro utente
   * @param {Object} user - Utente che effettua l'operazione
   * @param {Object} targetUser - Utente da eliminare
   * @returns {boolean} - True se l'utente può eliminare
   */
  async canDelete(user, targetUser) {
    try {
      // Verifica base dalla classe padre
      const baseCanDelete = await super.canDelete(user, targetUser);
      
      if (!baseCanDelete) {
        return false;
      }
      
      // Regole specifiche per l'eliminazione di utenti:
      
      // 1. Un utente non può eliminare sé stesso
      if (user.id === targetUser.id) {
        logger.warn(`Tentativo di auto-eliminazione da parte di ${user.username}`);
        return false;
      }
      
      // 2. Verifica che il tenant_id sia lo stesso (a meno che l'utente sia un amministratore globale)
      if (!user.hasRole('Amministratore di Sistema') && 
          targetUser.tenant_id && user.tenant_id && 
          targetUser.tenant_id !== user.tenant_id) {
        logger.warn(`Tentativo di eliminare utente di tenant diverso: ${user.username}`);
        return false;
      }
      
      // 3. Solo amministratori possono eliminare altri amministratori
      if (targetUser.hasRole('Amministratore di Sistema') && !user.hasRole('Amministratore di Sistema')) {
        logger.warn(`Tentativo di eliminare amministratore da parte di ${user.username}`);
        return false;
      }
      
      // 4. Un Responsabile Filiale può eliminare solo utenti della sua filiale
      if (user.hasRole('Responsabile Filiale') && 
          user.filiale_id && targetUser.filiale_id && 
          user.filiale_id !== targetUser.filiale_id) {
        logger.warn(`Responsabile Filiale tenta di eliminare utente di un'altra filiale: ${user.username}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error({ err: error }, `Errore in UserPolicy.canDelete per utente ${user?.id}`);
      return false;
    }
  }
}