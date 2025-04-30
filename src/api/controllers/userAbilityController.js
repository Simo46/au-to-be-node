'use strict';

const { Op } = require('sequelize');
const { User, UserAbility, sequelize } = require('../../models');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:userAbility');

/**
 * Controller per la gestione dei permessi individuali degli utenti
 */
class UserAbilityController {
  /**
   * Ottiene tutti i permessi individuali di un utente specifico
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getUserAbilities(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Cerca l'utente
      const user = await User.findOne({
        where: {
          id: userId,
          tenant_id: req.tenantId
        }
      });
      
      if (!user) {
        return next(AppError.notFound('Utente non trovato'));
      }
      
      // Carica i permessi individuali dell'utente
      const userAbilities = await UserAbility.findAll({
        where: {
          user_id: userId,
          tenant_id: req.tenantId
        },
        order: [
          ['priority', 'DESC'],
          ['created_at', 'DESC']
        ]
      });
      
      // Restituisci i permessi individuali
      res.json({
        status: 'success',
        data: {
          userAbilities,
          count: userAbilities.length
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero dei permessi individuali');
      next(error);
    }
  }
  
  /**
   * Ottiene un permesso individuale specifico
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getUserAbilityById(req, res, next) {
    try {
      const { userId, abilityId } = req.params;
      
      // Cerca il permesso individuale
      const userAbility = await UserAbility.findOne({
        where: {
          id: abilityId,
          user_id: userId,
          tenant_id: req.tenantId
        }
      });
      
      if (!userAbility) {
        return next(AppError.notFound('Permesso individuale non trovato'));
      }
      
      // Restituisci il permesso individuale
      res.json({
        status: 'success',
        data: {
          userAbility
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero del permesso individuale');
      next(error);
    }
  }
  
  /**
   * Crea un nuovo permesso individuale per un utente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createUserAbility(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }
      
      const { userId } = req.params;
      const {
        action,
        subject,
        conditions,
        fields,
        inverted,
        priority,
        reason,
        expiresAt
      } = req.body;
      
      // Cerca l'utente
      const user = await User.findOne({
        where: {
          id: userId,
          tenant_id: req.tenantId
        }
      });
      
      if (!user) {
        return next(AppError.notFound('Utente non trovato'));
      }
      
      // Verifica se esiste già un permesso simile
      const existingAbility = await UserAbility.findOne({
        where: {
          user_id: userId,
          tenant_id: req.tenantId,
          action,
          subject,
          inverted: inverted || false
        }
      });
      
      if (existingAbility) {
        return next(AppError.conflict('Esiste già un permesso individuale con questa azione e soggetto'));
      }
      
      // Crea il nuovo permesso individuale
      const userAbility = await UserAbility.create({
        user_id: userId,
        tenant_id: req.tenantId,
        action,
        subject,
        conditions: conditions || null,
        fields: fields || null,
        inverted: inverted || false,
        priority: priority || 10,
        reason: reason || null,
        expires_at: expiresAt || null,
        created_by: req.user.id,
        updated_by: req.user.id
      });
      
      // Log della creazione
      logger.info(`Permesso individuale creato per l'utente ${userId} da ${req.user.username}`);
      
      // Restituisci il permesso individuale creato
      res.status(201).json({
        status: 'success',
        message: 'Permesso individuale creato con successo',
        data: {
          userAbility
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione del permesso individuale');
      next(error);
    }
  }
  
  /**
   * Aggiorna un permesso individuale esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateUserAbility(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }
      
      const { userId, abilityId } = req.params;
      const {
        action,
        subject,
        conditions,
        fields,
        inverted,
        priority,
        reason,
        expiresAt
      } = req.body;
      
      // Cerca il permesso individuale
      const userAbility = await UserAbility.findOne({
        where: {
          id: abilityId,
          user_id: userId,
          tenant_id: req.tenantId
        }
      });
      
      if (!userAbility) {
        return next(AppError.notFound('Permesso individuale non trovato'));
      }
      
      // Aggiorna il permesso individuale
      await userAbility.update({
        action: action || userAbility.action,
        subject: subject || userAbility.subject,
        conditions: conditions !== undefined ? conditions : userAbility.conditions,
        fields: fields !== undefined ? fields : userAbility.fields,
        inverted: inverted !== undefined ? inverted : userAbility.inverted,
        priority: priority || userAbility.priority,
        reason: reason !== undefined ? reason : userAbility.reason,
        expires_at: expiresAt !== undefined ? expiresAt : userAbility.expires_at,
        updated_by: req.user.id
      });
      
      // Log dell'aggiornamento
      logger.info(`Permesso individuale aggiornato per l'utente ${userId} da ${req.user.username}`);
      
      // Restituisci il permesso individuale aggiornato
      res.json({
        status: 'success',
        message: 'Permesso individuale aggiornato con successo',
        data: {
          userAbility
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento del permesso individuale');
      next(error);
    }
  }
  
  /**
   * Elimina un permesso individuale
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteUserAbility(req, res, next) {
    try {
      const { userId, abilityId } = req.params;
      
      // Cerca il permesso individuale
      const userAbility = await UserAbility.findOne({
        where: {
          id: abilityId,
          user_id: userId,
          tenant_id: req.tenantId
        }
      });
      
      if (!userAbility) {
        return next(AppError.notFound('Permesso individuale non trovato'));
      }
      
      // Elimina il permesso individuale (soft delete)
      await userAbility.destroy();
      
      // Log dell'eliminazione
      logger.info(`Permesso individuale eliminato per l'utente ${userId} da ${req.user.username}`);
      
      // Restituisci conferma
      res.json({
        status: 'success',
        message: 'Permesso individuale eliminato con successo'
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione del permesso individuale');
      next(error);
    }
  }
  
  /**
   * Ottiene un riassunto combinato di tutti i permessi dell'utente (ruoli + individuali)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getUserEffectiveAbilities(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Cerca l'utente con ruoli e permessi individuali
      const user = await User.findOne({
        where: {
          id: userId,
          tenant_id: req.tenantId
        },
        include: [
          {
            model: sequelize.models.Role,
            as: 'roles',
            include: [
              {
                model: sequelize.models.Ability,
                as: 'abilities'
              }
            ]
          },
          {
            model: sequelize.models.UserAbility,
            as: 'userAbilities',
            where: {
              [Op.or]: [
                { expires_at: null },
                { expires_at: { [Op.gt]: new Date() } }
              ]
            },
            required: false
          }
        ]
      });
      
      if (!user) {
        return next(AppError.notFound('Utente non trovato'));
      }
      
      // Calcola i permessi effettivi utilizzando il servizio delle abilities
      const abilityService = require('../../services/abilityService');
      const ability = await abilityService.defineAbilityFor(user);
      
      // Ottieni le regole dalla ability
      const rules = ability.rules;
      
      // Restituisci la lista dei permessi effettivi
      res.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            name: user.name,
            username: user.username
          },
          roleAbilities: user.roles.flatMap(role => 
            role.abilities.map(ability => ({
              action: ability.action,
              subject: ability.subject,
              conditions: ability.conditions,
              fields: ability.fields,
              inverted: ability.inverted,
              source: `Role: ${role.name}`,
              priority: 1 // Priorità standard per permessi di ruolo
            }))
          ),
          userAbilities: user.userAbilities.map(ability => ({
            action: ability.action,
            subject: ability.subject,
            conditions: ability.conditions,
            fields: ability.fields,
            inverted: ability.inverted,
            reason: ability.reason,
            expires_at: ability.expires_at,
            priority: ability.priority,
            source: 'Individual Permission'
          })),
          effectiveRules: rules
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero dei permessi effettivi');
      next(error);
    }
  }
}

module.exports = new UserAbilityController();