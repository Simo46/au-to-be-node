'use strict';

const { Op } = require('sequelize');
const { Role, Ability, sequelize } = require('../../models');
const RolePolicy = require('../../policies/RolePolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:role');

/**
 * Controller per la gestione dei ruoli
 */
class RoleController {
  /**
   * Ottiene la lista di tutti i ruoli
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getRoles(req, res, next) {
    try {
      // Estrai parametri di query per filtri e paginazione
      const {
        page = 1,
        limit = 10,
        sort_by = 'name',
        sort_dir = 'ASC',
        search
      } = req.query;

      // Calcola offset per paginazione
      const offset = (page - 1) * limit;

      // Costruisci condizioni di ricerca
      const where = {};

      // Applica filtro di ricerca testuale
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Esegui la query
      const { count, rows: roles } = await Role.findAndCountAll({
        where,
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset,
        include: [
          {
            model: Ability,
            as: 'abilities',
            required: false
          }
        ]
      });

      // Calcola informazioni sulla paginazione
      const totalPages = Math.ceil(count / limit);

      res.json({
        status: 'success',
        data: {
          roles,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero dei ruoli');
      next(error);
    }
  }

  /**
   * Ottiene un ruolo specifico per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getRoleById(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera il ruolo con le sue abilities
      const role = await Role.findByPk(id, {
        include: [
          {
            model: Ability,
            as: 'abilities'
          }
        ]
      });

      if (!role) {
        return next(AppError.notFound('Ruolo non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await RolePolicy.canRead(req.user, role);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo ruolo'));
      }

      res.json({
        status: 'success',
        data: {
          role
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di un ruolo specifico');
      next(error);
    }
  }

  /**
   * Crea un nuovo ruolo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createRole(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { name, description, abilities } = req.body;

      // Verifica autorizzazione
      const canCreate = await RolePolicy.canCreate(req.user, req.body);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare ruoli'));
      }

      // Verifica se il ruolo esiste già
      const existingRole = await Role.findOne({
        where: { name }
      });

      if (existingRole) {
        return next(AppError.conflict(`Il ruolo "${name}" esiste già`));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Crea il nuovo ruolo
        const role = await Role.create({
          name,
          description
        }, {
          transaction,
          userId: req.user.id
        });

        // Crea abilities se specificate
        if (abilities && Array.isArray(abilities) && abilities.length > 0) {
          const abilityPromises = abilities.map(ability => {
            return Ability.create({
              role_id: role.id,
              action: ability.action,
              subject: ability.subject,
              conditions: ability.conditions || null,
              fields: ability.fields || null,
              inverted: ability.inverted || false,
              reason: ability.reason || null
            }, { transaction });
          });

          await Promise.all(abilityPromises);
        }

        // Commit della transazione
        await transaction.commit();

        // Recupera il ruolo completo con abilities per la risposta
        const createdRole = await Role.findByPk(role.id, {
          include: [
            {
              model: Ability,
              as: 'abilities'
            }
          ]
        });

        res.status(201).json({
          status: 'success',
          message: 'Ruolo creato con successo',
          data: {
            role: createdRole
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di un ruolo');
      next(error);
    }
  }

  /**
   * Aggiorna un ruolo esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateRole(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const { name, description } = req.body;

      // Recupera il ruolo da aggiornare
      const role = await Role.findByPk(id);

      if (!role) {
        return next(AppError.notFound('Ruolo non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await RolePolicy.canUpdate(req.user, role, req.body);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questo ruolo'));
      }

      // Verifica unicità nome se modificato
      if (name && name !== role.name) {
        const existingRole = await Role.findOne({
          where: {
            name,
            id: { [Op.ne]: id }
          }
        });

        if (existingRole) {
          return next(AppError.conflict(`Il ruolo "${name}" esiste già`));
        }
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Prepara i dati di aggiornamento
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        // Aggiorna il ruolo
        await role.update(updateData, {
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        // Recupera il ruolo aggiornato con abilities per la risposta
        const updatedRole = await Role.findByPk(id, {
          include: [
            {
              model: Ability,
              as: 'abilities'
            }
          ]
        });

        res.json({
          status: 'success',
          message: 'Ruolo aggiornato con successo',
          data: {
            role: updatedRole
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di un ruolo');
      next(error);
    }
  }

  /**
   * Elimina un ruolo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteRole(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera il ruolo da eliminare
      const role = await Role.findByPk(id);

      if (!role) {
        return next(AppError.notFound('Ruolo non trovato'));
      }

      // Verifica autorizzazione
      const canDelete = await RolePolicy.canDelete(req.user, role);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questo ruolo'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina prima tutte le abilities associate
        await Ability.destroy({
          where: { role_id: id },
          transaction
        });

        // Elimina il ruolo (soft delete)
        await role.destroy({
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        res.json({
          status: 'success',
          message: 'Ruolo eliminato con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di un ruolo');
      next(error);
    }
  }

  /**
   * Assegna abilities a un ruolo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async assignAbilities(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const { abilities } = req.body;

      if (!Array.isArray(abilities)) {
        return next(AppError.validation('Le abilities devono essere un array'));
      }

      // Recupera il ruolo
      const role = await Role.findByPk(id);

      if (!role) {
        return next(AppError.notFound('Ruolo non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await RolePolicy.canUpdate(req.user, role, { abilities });
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare le abilities di questo ruolo'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Crea le abilities
        const abilityPromises = abilities.map(ability => {
          return Ability.create({
            role_id: role.id,
            action: ability.action,
            subject: ability.subject,
            conditions: ability.conditions || null,
            fields: ability.fields || null,
            inverted: ability.inverted || false,
            reason: ability.reason || null
          }, { transaction });
        });

        await Promise.all(abilityPromises);

        // Commit della transazione
        await transaction.commit();

        // Recupera il ruolo aggiornato con abilities per la risposta
        const updatedRole = await Role.findByPk(id, {
          include: [
            {
              model: Ability,
              as: 'abilities'
            }
          ]
        });

        res.json({
          status: 'success',
          message: 'Abilities assegnate con successo',
          data: {
            role: updatedRole
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'assegnazione delle abilities');
      next(error);
    }
  }

  /**
   * Rimuove abilities da un ruolo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async removeAbilities(req, res, next) {
    try {
      const { id } = req.params;
      const { abilityIds } = req.body;

      if (!Array.isArray(abilityIds)) {
        return next(AppError.validation('Gli ID delle abilities devono essere un array'));
      }

      // Recupera il ruolo
      const role = await Role.findByPk(id);

      if (!role) {
        return next(AppError.notFound('Ruolo non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await RolePolicy.canUpdate(req.user, role, {});
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare le abilities di questo ruolo'));
      }

      // Verifica che le abilities appartengano effettivamente al ruolo
      const abilities = await Ability.findAll({
        where: {
          id: { [Op.in]: abilityIds },
          role_id: id
        }
      });

      if (abilities.length !== abilityIds.length) {
        return next(AppError.validation('Alcune abilities specificate non appartengono a questo ruolo'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina le abilities
        await Ability.destroy({
          where: {
            id: { [Op.in]: abilityIds },
            role_id: id
          },
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        // Recupera il ruolo aggiornato con abilities per la risposta
        const updatedRole = await Role.findByPk(id, {
          include: [
            {
              model: Ability,
              as: 'abilities'
            }
          ]
        });

        res.json({
          status: 'success',
          message: 'Abilities rimosse con successo',
          data: {
            role: updatedRole
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la rimozione delle abilities');
      next(error);
    }
  }

  /**
   * Sostituzione completa delle abilities di un ruolo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async replaceAbilities(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const { abilities } = req.body;

      if (!Array.isArray(abilities)) {
        return next(AppError.validation('Le abilities devono essere un array'));
      }

      // Recupera il ruolo
      const role = await Role.findByPk(id);

      if (!role) {
        return next(AppError.notFound('Ruolo non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await RolePolicy.canUpdate(req.user, role, { abilities });
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare le abilities di questo ruolo'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina tutte le abilities esistenti
        await Ability.destroy({
          where: { role_id: id },
          transaction,
          userId: req.user.id
        });

        // Crea le nuove abilities
        if (abilities.length > 0) {
          const abilityPromises = abilities.map(ability => {
            return Ability.create({
              role_id: role.id,
              action: ability.action,
              subject: ability.subject,
              conditions: ability.conditions || null,
              fields: ability.fields || null,
              inverted: ability.inverted || false,
              reason: ability.reason || null
            }, { transaction });
          });

          await Promise.all(abilityPromises);
        }

        // Commit della transazione
        await transaction.commit();

        // Recupera il ruolo aggiornato con abilities per la risposta
        const updatedRole = await Role.findByPk(id, {
          include: [
            {
              model: Ability,
              as: 'abilities'
            }
          ]
        });

        res.json({
          status: 'success',
          message: 'Abilities sostituite con successo',
          data: {
            role: updatedRole
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la sostituzione delle abilities');
      next(error);
    }
  }
}

module.exports = new RoleController();