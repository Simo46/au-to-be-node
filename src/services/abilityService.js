'use strict';

const { Ability, AbilityBuilder, subject } = require('@casl/ability');
const { createLogger } = require('../utils/logger');
const logger = createLogger('services:ability');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

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
      if (!user) {
        logger.debug('Definizione ability per utente non autenticato');
        return this.defineGuestAbility();
      }

      // Ottieni tutti i permessi dall'utente (da ruoli e permessi individuali)
      const roleAbilities = await this.extractAbilitiesFromUser(user);
      let userAbilities = [];
      
      // Ottieni i permessi individuali dell'utente
      if (user.id) {
        userAbilities = await this.extractIndividualAbilitiesFromUser(user);
      }
      
      // Combina tutte le abilities
      const allAbilities = [...roleAbilities, ...userAbilities];
      
      logger.debug(`Caricate ${allAbilities.length} abilities totali per utente ${user.id}`);
      
      // Crea l'oggetto Ability usando CASL
      const { can, cannot, build } = new AbilityBuilder(Ability);
      
      // Ordina le abilities per priorità (prima quelle con priorità più alta)
      allAbilities.sort((a, b) => {
        const priorityA = a.priority || 1;
        const priorityB = b.priority || 1;
        return priorityB - priorityA;
      });
      
      // Applica tutti i permessi estratti
      for (const ability of allAbilities) {
        // Aggiungi logging per debug
        logger.debug(`Processing ability: ${ability.action} ${ability.subject} (inverted: ${ability.inverted})`);
        
        // Gestione speciale per "all" come subject
        if (ability.subject === 'all') {
          // Se trova 'all', applica il permesso a tutti i soggetti
          if (ability.inverted) {
            cannot(ability.action, 'all', ability.conditions || {});
          } else {
            can(ability.action, 'all', ability.conditions || {});
            
            // Aggiungi esplicitamente i permessi importanti per model specifici
            can(ability.action, 'UserAbility', ability.conditions || {});
            can(ability.action, 'User', ability.conditions || {});
            can(ability.action, 'Role', ability.conditions || {});
            // Aggiungi altri soggetti secondo necessità
            
            // Se l'azione è 'manage', aggiunge implicitamente tutte le altre azioni
            if (ability.action === 'manage') {
              can(['create', 'read', 'update', 'delete'], 'all', ability.conditions || {});
              can(['create', 'read', 'update', 'delete'], 'UserAbility', ability.conditions || {});
            }
          }
        } else {
          // Gestione normale per subject specifici
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
              // if (['read', 'update'].includes(ability.action)) {
              //   can(ability.action, ability.subject, ability.conditions || {}).attributes(ability.fields);
              // }
              can(ability.action, ability.subject, {
                ...(ability.conditions || {}),
                // Aggiungi un attributo speciale per i campi
                _fields: ability.fields
              });
            }
          }
        }
      }
      
      const builtAbility = build({
        detectSubjectType: (subject) => {
          if (!subject || typeof subject === 'string') {
            return subject;
          }
          return subject.__type || subject.constructor.name;
        }
      });
      
      logger.debug(`Ability creata con ${builtAbility.rules.length} regole`);
      logger.debug(`Permessi per UserAbility: manageAll=${builtAbility.can('manage', 'all')}, manageUserAbility=${builtAbility.can('manage', 'UserAbility')}`);
      
      return builtAbility;
      /* return build({
        // Configurazione per la conversione di oggetti in subjects
        detectSubjectType: (subject) => {
          if (!subject || typeof subject === 'string') {
            return subject;
          }
          
          return subject.__type || subject.constructor.name;
        }
      }); */
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
      
      // Aggiungi questo log per vedere la struttura dei ruoli
      logger.debug(`Ruoli utente: ${JSON.stringify(user.roles.map(r => r.name))}`);
      
      // Verifica se i ruoli hanno le abilities precaricate
      const abilitiesPreloaded = user.roles.some(role => role.abilities && Array.isArray(role.abilities));
      
      if (abilitiesPreloaded) {
        // Aggiungi log dettagliato
        user.roles.forEach(role => {
          if (role.abilities) {
            logger.debug(`Ruolo ${role.name} ha ${role.abilities.length} abilities`);
            role.abilities.forEach((ability, idx) => {
              logger.debug(`Ability ${idx} del ruolo ${role.name}: action=${ability.action}, subject=${ability.subject}`);
            });
          }
        });
        
        // Se le abilities sono già precaricate, le estrae direttamente
        const abilities = user.roles.flatMap(role => {
          if (!role.abilities) return [];
          
          // Manipola direttamente l'oggetto Sequelize
          return role.abilities.map(ability => {
            // Se ability è un oggetto Sequelize, usa .get() per ottenere un oggetto puro
            const abilityData = typeof ability.get === 'function' ? ability.get() : ability;
            
            // Assicurati che i campi essenziali siano presenti
            return {
              action: abilityData.action,
              subject: abilityData.subject,
              conditions: abilityData.conditions,
              fields: abilityData.fields,
              inverted: abilityData.inverted === true,
              priority: abilityData.priority || 1
            };
          });
        });
        
        // Log del risultato finale
        logger.debug(`Estratte ${abilities.length} abilities dai ruoli`);
        abilities.forEach((a, i) => {
          logger.debug(`Ability estratta ${i}: action=${a.action}, subject=${a.subject}`);
        });
        
        return abilities;
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
        return rolesWithAbilities.flatMap(role => {
          const abilities = role.abilities || [];
          // Aggiungi priorità predefinita 1 (più bassa dei permessi individuali)
          return abilities.map(ability => ({
            ...ability.get(),
            priority: 1
          }));
        });
      }
    } catch (error) {
      logger.error({ err: error }, `Errore nell'estrazione delle abilities per utente ${user.id}`);
      throw error;
    }
  }

  /**
   * Estrae tutti i permessi individuali dell'utente
   * @param {Object} user - Utente
   * @returns {Array} - Array di oggetti userAbility
   */
  async extractIndividualAbilitiesFromUser(user) {
    try {
      // Verifica che l'utente abbia un ID
      if (!user.id) {
        logger.warn('Impossibile estrarre permessi individuali: utente senza ID');
        return [];
      }
      
      // Verifica se l'utente ha già le userAbilities precaricate
      if (user.userAbilities && Array.isArray(user.userAbilities)) {
        // Filtra per escludere quelle scadute
        return user.userAbilities
          .filter(ability => !ability.isExpired())
          .map(ability => ability.get());
      }
      
      // Altrimenti, carica le userAbilities per l'utente
      const { UserAbility } = require('../models');
      
      // Carica le abilities individuali non scadute
      const userAbilities = await UserAbility.findAll({
        where: {
          user_id: user.id,
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        }
      });
      
      logger.debug(`Caricate ${userAbilities.length} abilities individuali per utente ${user.id}`);
      
      // Converti in oggetti plain per compatibilità
      return userAbilities.map(ability => ability.get());
    } catch (error) {
      logger.error({ err: error }, `Errore nell'estrazione delle abilities individuali per utente ${user.id}`);
      return []; // In caso di errore, restituisci un array vuoto
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