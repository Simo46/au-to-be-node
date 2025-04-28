'use strict';

const { Op } = require('sequelize');
const { Edificio, Filiale, sequelize } = require('../../models');
const EdificioPolicy = require('../../policies/EdificioPolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:edificio');

/**
 * Controller per la gestione degli edifici
 */
class EdificioController {
  /**
   * Ottiene la lista degli edifici con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getEdifici(req, res, next) {
    try {
      // Estrai parametri di query
      const {
        page = 1,
        limit = 10,
        sort_by = 'code', 
        sort_dir = 'ASC',
        search,
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
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Applica filtro per filiale
      if (filiale_id) {
        where.filiale_id = filiale_id;
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        where.active = active === 'true';
      }

      // Se l'utente è un Area Manager, limita la vista alle filiali della sua area
      if (req.user.hasRole('Area Manager')) {
        const managedFiliali = req.user.settings?.managed_filiali || [];
        if (managedFiliali.length > 0) {
          where.filiale_id = { [Op.in]: managedFiliali };
        }
      }
      
      // Se l'utente è un Responsabile Filiale, limita la vista alla sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        where.filiale_id = req.user.filiale_id;
      }

      // Esegui la query con tutti i filtri
      const { count, rows: edifici } = await Edificio.findAndCountAll({
        where,
        include: [{
          model: Filiale,
          as: 'filiale',
          attributes: ['id', 'code', 'description']
        }],
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset
      });

      // Filtra i dati degli edifici in base alle policy
      const filteredEdifici = await Promise.all(
        edifici.map(async (edificio) => {
          if (await EdificioPolicy.canRead(req.user, edificio)) {
            return edificio.toJSON();
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

      // Calcola informazioni sulla paginazione
      const totalPages = Math.ceil(count / limit);

      res.json({
        status: 'success',
        data: {
          edifici: filteredEdifici,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero degli edifici');
      next(error);
    }
  }

  /**
   * Ottiene un edificio specifico per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getEdificioById(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera l'edificio con la filiale associata
      const edificio = await Edificio.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [{
          model: Filiale,
          as: 'filiale',
          attributes: ['id', 'code', 'description']
        }]
      });

      if (!edificio) {
        return next(AppError.notFound('Edificio non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await EdificioPolicy.canRead(req.user, edificio);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo edificio'));
      }

      res.json({
        status: 'success',
        data: {
          edificio: edificio.toJSON()
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di un edificio specifico');
      next(error);
    }
  }

  /**
   * Crea un nuovo edificio
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createEdificio(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      // Estrai i dati dalla richiesta
      const edificioData = { ...req.body };

      // Verifica autorizzazione
      const canCreate = await EdificioPolicy.canCreate(req.user, edificioData);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare edifici'));
      }

      // Verifica che la filiale esista e appartenga allo stesso tenant
      const filiale = await Filiale.findOne({
        where: {
          id: edificioData.filiale_id,
          tenant_id: req.tenantId
        }
      });

      if (!filiale) {
        return next(AppError.notFound('Filiale non trovata o non appartiene al tuo tenant'));
      }

      // Verifica se esiste già un edificio con lo stesso codice per questa filiale
      const existingEdificio = await Edificio.findOne({
        where: {
          code: edificioData.code,
          filiale_id: edificioData.filiale_id,
          tenant_id: req.tenantId
        }
      });

      if (existingEdificio) {
        return next(AppError.conflict(`Esiste già un edificio con il codice ${edificioData.code} in questa filiale`));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Crea il nuovo edificio
        const edificio = await Edificio.create(
          {
            ...edificioData,
            tenant_id: req.tenantId
          },
          {
            transaction,
            userId: req.user.id
          }
        );

        // Commit della transazione
        await transaction.commit();

        logger.info(`Nuovo edificio creato: ${edificio.code} (${edificio.id})`);

        // Recupera l'edificio con la filiale associata
        const createdEdificio = await Edificio.findByPk(edificio.id, {
          include: [{
            model: Filiale,
            as: 'filiale',
            attributes: ['id', 'code', 'description']
          }]
        });

        // Restituisci l'edificio creato
        res.status(201).json({
          status: 'success',
          message: 'Edificio creato con successo',
          data: {
            edificio: createdEdificio.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di un edificio');
      next(error);
    }
  }

  /**
   * Aggiorna un edificio esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateEdificio(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const updateData = { ...req.body };

      // Recupera l'edificio da aggiornare
      const edificio = await Edificio.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!edificio) {
        return next(AppError.notFound('Edificio non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await EdificioPolicy.canUpdate(req.user, edificio, updateData);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questo edificio'));
      }

      // Se viene modificata la filiale, verifica che esista e appartenga allo stesso tenant
      if (updateData.filiale_id && updateData.filiale_id !== edificio.filiale_id) {
        const filiale = await Filiale.findOne({
          where: {
            id: updateData.filiale_id,
            tenant_id: req.tenantId
          }
        });

        if (!filiale) {
          return next(AppError.notFound('Filiale non trovata o non appartiene al tuo tenant'));
        }
      }

      // Verifica se il nuovo codice è già in uso (se viene modificato)
      if (updateData.code && updateData.code !== edificio.code) {
        const existingEdificio = await Edificio.findOne({
          where: {
            code: updateData.code,
            filiale_id: updateData.filiale_id || edificio.filiale_id,
            tenant_id: req.tenantId,
            id: { [Op.ne]: id }
          }
        });

        if (existingEdificio) {
          return next(AppError.conflict(`Esiste già un edificio con il codice ${updateData.code} in questa filiale`));
        }
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Aggiorna l'edificio
        await edificio.update(updateData, {
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Edificio aggiornato: ${edificio.code} (${edificio.id})`);

        // Recupera l'edificio aggiornato con la filiale associata
        const updatedEdificio = await Edificio.findByPk(id, {
          include: [{
            model: Filiale,
            as: 'filiale',
            attributes: ['id', 'code', 'description']
          }]
        });

        // Restituisci l'edificio aggiornato
        res.json({
          status: 'success',
          message: 'Edificio aggiornato con successo',
          data: {
            edificio: updatedEdificio.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di un edificio');
      next(error);
    }
  }

  /**
   * Elimina un edificio
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteEdificio(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera l'edificio da eliminare
      const edificio = await Edificio.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!edificio) {
        return next(AppError.notFound('Edificio non trovato'));
      }

      // Verifica autorizzazione
      const canDelete = await EdificioPolicy.canDelete(req.user, edificio);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questo edificio'));
      }

      // Verifica se esistono dipendenze (es. piani, asset)
      const hasPiani = await sequelize.models.Piano.count({
        where: { edificio_id: id }
      });

      if (hasPiani > 0) {
        return next(AppError.conflict('Impossibile eliminare l\'edificio: esistono piani associati'));
      }

      const hasAssets = await sequelize.models.Asset.count({
        where: { edificio_id: id }
      });

      if (hasAssets > 0) {
        return next(AppError.conflict('Impossibile eliminare l\'edificio: esistono asset associati'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina l'edificio (soft delete, grazie a paranoid: true nel modello)
        await edificio.destroy({
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Edificio eliminato: ${edificio.code} (${edificio.id})`);

        // Restituisci risposta
        res.json({
          status: 'success',
          message: 'Edificio eliminato con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di un edificio');
      next(error);
    }
  }

  /**
   * Ottiene la history delle modifiche di un edificio
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getEdificioHistory(req, res, next) {
    try {
      const { id } = req.params;

      // Verifica che l'edificio esista
      const edificio = await Edificio.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!edificio) {
        return next(AppError.notFound('Edificio non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await EdificioPolicy.canRead(req.user, edificio);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo edificio'));
      }

      // Recupera la history dell'edificio
      const history = await sequelize.models.EdificioHistory.findAll({
        where: { edificio_id: id },
        include: [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'name', 'username']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        status: 'success',
        data: {
          history
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero della history di un edificio');
      next(error);
    }
  }
}

module.exports = new EdificioController();