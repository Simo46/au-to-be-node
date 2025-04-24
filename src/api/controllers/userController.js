'use strict';

const { Op } = require('sequelize');
const { User, Role, Ability, Filiale, sequelize } = require('../../models');
const UserPolicy = require('../../policies/UserPolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:user');

/**
 * Controller per la gestione degli utenti
 */
class UserController {
  /**
   * Ottiene la lista degli utenti con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getUsers(req, res, next) {
    try {
      // Estrai parametri di query
      const {
        page = 1,
        limit = 10,
        sort_by = 'created_at', 
        sort_dir = 'DESC',
        search,
        role,
        filiale_id,
        active
      } = req.query;

      // Calcola offset per paginazione
      const offset = (page - 1) * limit;

      // Costruisci condizioni di ricerca base
      const where = {
        tenant_id: req.tenantId
      };

      // Applica filtro di ricerca testuale
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { username: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        where.active = active === 'true';
      }

      // Applica filtro per filiale
      if (filiale_id) {
        where.filiale_id = filiale_id;
      }

      // Condizioni aggiuntive per filtro per ruolo
      let includeOptions = [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }
      }];

      if (role) {
        includeOptions = [{
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          where: { name: role }
        }];
      }

      // Se l'utente è un responsabile filiale, limita la vista agli utenti della sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        where.filiale_id = req.user.filiale_id;
      }

      // Se l'utente è un Area Manager, limita la vista agli utenti delle filiali della sua area
      // Nota: questa implementazione andrebbe espansa con la logica per determinare
      // quali filiali appartengono all'area di un Area Manager
      if (req.user.hasRole('Area Manager')) {
        // Per implementazione completa, qui andrebbe una query per ottenere tutte
        // le filiali nell'area dell'Area Manager e filtrare gli utenti di conseguenza
      }

      // Esegui la query con tutti i filtri
      const { count, rows: users } = await User.findAndCountAll({
        where,
        include: includeOptions,
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset,
        distinct: true // Necessario per conteggio corretto con include
      });

      // Filtra i dati degli utenti in base alle policy
      const filteredUsers = await Promise.all(
        users.map(async (user) => {
          if (await UserPolicy.canRead(req.user, user)) {
            return user.toJSON();
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

      // Calcola informazioni sulla paginazione
      const totalPages = Math.ceil(count / limit);

      res.json({
        status: 'success',
        data: {
          users: filteredUsers,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero degli utenti');
      next(error);
    }
  }

  /**
   * Ottiene un utente specifico per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera l'utente con i suoi ruoli e filiale
      const user = await User.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [
          {
            model: Role,
            as: 'roles',
            include: [
              {
                model: Ability,
                as: 'abilities'
              }
            ]
          },
          {
            model: Filiale,
            as: 'filiale',
            attributes: ['id', 'code', 'description']
          }
        ]
      });

      if (!user) {
        return next(AppError.notFound('Utente non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await UserPolicy.canRead(req.user, user);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo utente'));
      }

      res.json({
        status: 'success',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di un utente specifico');
      next(error);
    }
  }

  /**
   * Crea un nuovo utente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createUser(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const {
        name,
        email,
        username,
        password,
        filiale_id,
        phone,
        job_title,
        avatar,
        active = true,
        roles = [],
        abilities = []
      } = req.body;

      // Verifica autorizzazione
      const canCreate = await UserPolicy.canCreate(req.user, req.body);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare utenti'));
      }

      // Verifica se l'utente esiste già
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email },
            { username }
          ],
          tenant_id: req.tenantId
        }
      });

      if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'username';
        return next(AppError.conflict(`Utente con questo ${field} esiste già`));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Crea il nuovo utente
        const user = await User.create({
          name,
          email,
          username,
          password,
          filiale_id,
          phone,
          job_title,
          avatar,
          active,
          tenant_id: req.tenantId
        }, {
          transaction,
          userId: req.user.id
        });

        // Assegna ruoli
        if (roles.length > 0) {
          const rolesToAssign = await Role.findAll({
            where: {
              name: {
                [Op.in]: roles
              }
            }
          });

          if (rolesToAssign.length > 0) {
            await user.setRoles(rolesToAssign, { transaction });
          }
        }

        // Assegna abilità personalizzate (implementazione futura)
        // Questa è solo una simulazione - l'implementazione reale richiederebbe
        // un modello specifico per le abilità personalizzate degli utenti
        if (abilities.length > 0) {
          // Qui implementeresti la logica per assegnare abilità personalizzate
          logger.info(`Abilità personalizzate da implementare per l'utente ${user.id}`);
        }

        // Commit della transazione
        await transaction.commit();

        // Carica l'utente con ruoli per la risposta
        const createdUser = await User.findByPk(user.id, {
          include: [{
            model: Role,
            as: 'roles'
          }]
        });

        res.status(201).json({
          status: 'success',
          message: 'Utente creato con successo',
          data: {
            user: createdUser.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di un utente');
      next(error);
    }
  }

  /**
   * Aggiorna un utente esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateUser(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const {
        name,
        email,
        username,
        password,
        filiale_id,
        phone,
        job_title,
        avatar,
        active,
        roles,
        abilities
      } = req.body;

      // Recupera l'utente da aggiornare
      const user = await User.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [{
          model: Role,
          as: 'roles'
        }]
      });

      if (!user) {
        return next(AppError.notFound('Utente non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await UserPolicy.canUpdate(req.user, user, req.body);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questo utente'));
      }

      // Verifica unicità email e username se modificati
      if (email && email !== user.email) {
        const existingEmail = await User.findOne({
          where: {
            email,
            tenant_id: req.tenantId,
            id: { [Op.ne]: id }
          }
        });

        if (existingEmail) {
          return next(AppError.conflict('Email già in uso'));
        }
      }

      if (username && username !== user.username) {
        const existingUsername = await User.findOne({
          where: {
            username,
            tenant_id: req.tenantId,
            id: { [Op.ne]: id }
          }
        });

        if (existingUsername) {
          return next(AppError.conflict('Nome utente già in uso'));
        }
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Prepara i dati di aggiornamento
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (username !== undefined) updateData.username = username;
        if (password !== undefined) updateData.password = password;
        if (filiale_id !== undefined) updateData.filiale_id = filiale_id;
        if (phone !== undefined) updateData.phone = phone;
        if (job_title !== undefined) updateData.job_title = job_title;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (active !== undefined) updateData.active = active;

        // Aggiorna l'utente
        await user.update(updateData, {
          transaction,
          userId: req.user.id
        });

        // Aggiorna i ruoli se specificati
        if (roles && Array.isArray(roles)) {
          const rolesToAssign = await Role.findAll({
            where: {
              name: {
                [Op.in]: roles
              }
            }
          });

          if (rolesToAssign.length > 0) {
            await user.setRoles(rolesToAssign, { transaction });
          } else {
            // Se viene passato un array vuoto, rimuovi tutti i ruoli
            await user.setRoles([], { transaction });
          }
        }

        // Aggiorna abilità personalizzate (implementazione futura)
        if (abilities && Array.isArray(abilities)) {
          // Qui implementeresti la logica per aggiornare abilità personalizzate
          logger.info(`Abilità personalizzate da implementare per l'utente ${user.id}`);
        }

        // Commit della transazione
        await transaction.commit();

        // Carica l'utente aggiornato con ruoli per la risposta
        const updatedUser = await User.findByPk(user.id, {
          include: [{
            model: Role,
            as: 'roles'
          }]
        });

        res.json({
          status: 'success',
          message: 'Utente aggiornato con successo',
          data: {
            user: updatedUser.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di un utente');
      next(error);
    }
  }

  /**
   * Elimina un utente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera l'utente da eliminare
      const user = await User.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [{
          model: Role,
          as: 'roles'
        }]
      });

      if (!user) {
        return next(AppError.notFound('Utente non trovato'));
      }

      // Verifica autorizzazione
      const canDelete = await UserPolicy.canDelete(req.user, user);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questo utente'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Rimuovi relazioni
        await user.setRoles([], { transaction });

        // Soft delete dell'utente (poiché il modello ha paranoid: true)
        await user.destroy({
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        res.json({
          status: 'success',
          message: 'Utente eliminato con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di un utente');
      next(error);
    }
  }

  /**
   * Ottiene i ruoli disponibili
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getRoles(req, res, next) {
    try {
      // Recupera tutti i ruoli
      const roles = await Role.findAll({
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']]
      });

      res.json({
        status: 'success',
        data: {
          roles
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero dei ruoli');
      next(error);
    }
  }

  /**
   * Assegna ruoli a un utente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async assignRoles(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const { roles } = req.body;

      if (!Array.isArray(roles)) {
        return next(AppError.validation('I ruoli devono essere un array'));
      }

      // Recupera l'utente
      const user = await User.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [{
          model: Role,
          as: 'roles'
        }]
      });

      if (!user) {
        return next(AppError.notFound('Utente non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await UserPolicy.canUpdate(req.user, user, { roles });
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare i ruoli di questo utente'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Ottieni i ruoli da assegnare
        const rolesToAssign = await Role.findAll({
          where: {
            name: {
              [Op.in]: roles
            }
          }
        });

        // Assegna i ruoli
        await user.setRoles(rolesToAssign, { transaction });

        // Commit della transazione
        await transaction.commit();

        // Carica l'utente aggiornato con ruoli per la risposta
        const updatedUser = await User.findByPk(user.id, {
          include: [{
            model: Role,
            as: 'roles'
          }]
        });

        res.json({
          status: 'success',
          message: 'Ruoli assegnati con successo',
          data: {
            user: updatedUser.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'assegnazione dei ruoli');
      next(error);
    }
  }
}

module.exports = new UserController();