'use strict';

const { Ability, AbilityBuilder, subject } = require('@casl/ability');
const { createLogger } = require('../utils/logger');
const logger = createLogger('services:ability');

/**
 * Definisce l'oggetto Ability per un utente in base ai suoi ruoli e permessi
 */
class AbilityService {
  /**
   * Crea un'istanza di Ability per l'utente specificato
   * @param {Object} user - Utente con i ruoli precaricati
   * @returns {Ability} - Istanza di CASL Ability
   */
  async defineAbilityFor(user) {
    try {
      // Se l'utente non è fornito o non ha ruoli, restituisci un'abilità vuota
      if (!user || !user.roles) {
        logger.debug('Definizione ability per utente senza ruoli o non autenticato');
        return this.defineGuestAbility();
      }

      // Ottieni tutti i permessi dall'utente e dai suoi ruoli
      const abilities = await this.extractAbilitiesFromUser(user);
      
      logger.debug(`Caricate ${abilities.length} abilities per utente ${user.id}`);
      
      // Crea l'oggetto Ability usando CASL
      const { can, cannot, build } = new AbilityBuilder(Ability);
      
      // Applica tutti i permessi estratti
      for (const ability of abilities) {
        // Gestisce le regole invertite (cannot)
        if (ability.inverted) {
          cannot(ability.action, ability.subject, ability.conditions || {});
        } else {
          can(ability.action, ability.subject, ability.conditions || {});
          
          // Se l'azione è 'manage', aggiunge implicitamente tutte le altre azioni
          if (ability.action === 'manage') {
            can(['create', 'read', 'update', 'delete'], ability.subject, ability.conditions || {});
          }
          
          // Se sono specificati dei campi, limita le azioni a quei campi
          if (ability.fields && ability.fields.length > 0) {
            // Nota: CASL supporta direttamente la restrizione su campi solo per le azioni di lettura/aggiornamento
            if (['read', 'update'].includes(ability.action)) {
              can(ability.action, ability.subject, ability.conditions || {}).attributes(ability.fields);
            }
          }
        }
      }
      
      return build({
        // Configurazione per la conversione di oggetti in subjects
        detectSubjectType: (subject) => {
          if (!subject || typeof subject === 'string') {
            return subject;
          }
          
          return subject.__type || subject.constructor.name;
        }
      });
    } catch (error) {
      logger.error({ err: error }, `Errore nella definizione delle ability per utente ${user?.id}`);
      throw error;
    }
  }

  /**
   * Estrae tutti i permessi associati all'utente attraverso i suoi ruoli
   * @param {Object} user - Utente con roles precaricati
   * @returns {Array} - Array di oggetti ability
   */
  async extractAbilitiesFromUser(user) {
    try {
      // Verifica che l'utente abbia i ruoli precaricati
      if (!user.roles || !Array.isArray(user.roles)) {
        logger.warn(`Utente ${user.id} non ha ruoli o i ruoli non sono stati precaricati`);
        return [];
      }
      
      // Verifica se i ruoli hanno le abilities precaricate
      const abilitiesPreloaded = user.roles.some(role => role.abilities && Array.isArray(role.abilities));
      
      if (abilitiesPreloaded) {
        // Se le abilities sono già precaricate, le estrae direttamente
        return user.roles.flatMap(role => role.abilities || []);
      } else {
        // Altrimenti, carica le abilities per ogni ruolo
        const { Role, Ability } = require('../models');
        
        // Ottieni gli ID dei ruoli dell'utente
        const roleIds = user.roles.map(role => role.id);
        
        // Carica tutti i ruoli con le abilities
        const rolesWithAbilities = await Role.findAll({
          where: { id: roleIds },
          include: [{
            model: Ability,
            as: 'abilities'
          }]
        });
        
        // Estrai e restituisci tutte le abilities
        return rolesWithAbilities.flatMap(role => role.abilities || []);
      }
    } catch (error) {
      logger.error({ err: error }, `Errore nell'estrazione delle abilities per utente ${user.id}`);
      throw error;
    }
  }

  /**
   * Definisce le abilities per un utente ospite (non autenticato)
   * @returns {Ability} - Istanza di CASL Ability con permessi minimi
   */
  defineGuestAbility() {
    const { can, build } = new AbilityBuilder(Ability);
    
    // Definisci le abilities minime per utenti non autenticati
    // Per esempio, un utente ospite potrebbe avere solo permessi di lettura su contenuti pubblici
    can('read', 'PublicContent');
    
    return build({
      detectSubjectType: (subject) => {
        if (!subject || typeof subject === 'string') {
          return subject;
        }
        
        return subject.__type || subject.constructor.name;
      }
    });
  }

  /**
   * Verifica se un utente può eseguire un'azione su un soggetto
   * @param {Object} user - Utente
   * @param {string} action - Azione (create, read, update, delete, manage)
   * @param {string|Object} subject - Soggetto (nome del modello o istanza)
   * @returns {boolean} - True se l'utente può eseguire l'azione
   */
  async can(user, action, subject) {
    try {
      const ability = await this.defineAbilityFor(user);
      return ability.can(action, subject);
    } catch (error) {
      logger.error({ err: error }, `Errore nella verifica dei permessi per utente ${user?.id}`);
      return false;
    }
  }

  /**
   * Verifica se un utente non può eseguire un'azione su un soggetto
   * @param {Object} user - Utente
   * @param {string} action - Azione (create, read, update, delete, manage)
   * @param {string|Object} subject - Soggetto (nome del modello o istanza)
   * @returns {boolean} - True se l'utente non può eseguire l'azione
   */
  async cannot(user, action, subject) {
    try {
      const ability = await this.defineAbilityFor(user);
      return ability.cannot(action, subject);
    } catch (error) {
      logger.error({ err: error }, `Errore nella verifica dei permessi per utente ${user?.id}`);
      return true; // In caso di errore, nega l'accesso per sicurezza
    }
  }
}

module.exports = new AbilityService();