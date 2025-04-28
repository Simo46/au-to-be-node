'use strict';

const { Op } = require('sequelize');
const { Piano, Edificio, Filiale, sequelize } = require('../../models');
const PianoPolicy = require('../../policies/PianoPolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:piano');

/**
 * Controller per la gestione dei piani
 */
class PianoController {
  /**
   * Ottiene la lista dei piani con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getPiani(req, res, next) {
    try {
      // Estrai parametri di query
      const {
        page = 1,
        limit = 10,
        sort_by = 'code', 
        sort_dir = 'ASC',
        search,
        filiale_id,
        edificio_id,
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

      // Applica filtro per edificio
      if (edificio_id) {
        where.edificio_id = edificio_id;
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        where.active = active === 'true';
      }

      // Se l'utente è un Responsabile Filiale, limita la vista ai piani della sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        where.filiale_id = req.user.filiale_id;
      }

      // Se l'utente è un Area Manager, limita la vista ai piani delle filiali della sua area
      if (req.user.hasRole('Area Manager')) {
        const managedFiliali = req.user.settings?.managed_filiali || [];
        if (managedFiliali.length > 0) {
          where.filiale_id = { [Op.in]: managedFiliali };
        }
      }

      // Esegui la query con tutti i filtri
      const { count, rows: piani } = await Piano.findAndCountAll({
        where,
        include: [
          {
            model: Filiale,
            as: 'filiale',
            attributes: ['id', 'code', 'description']
          },
          {
            model: Edificio,
            as: 'edificio',
            attributes: ['id', 'code', 'description']
          }
        ],
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset
      });

      // Filtra i dati dei piani in base alle policy
      const filteredPiani = await Promise.all(
        piani.map(async (piano) => {
          if (await PianoPolicy.canRead(req.user, piano)) {
            return piano.toJSON();
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

      // Calcola informazioni sulla paginazione
      const totalPages = Math.ceil(count / limit);

      res.json({
        status: 'success',
        data: {
          piani: filteredPiani,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero dei piani');
      next(error);
    }
  }

  /**
   * Ottiene un piano specifico per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getPianoById(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera il piano
      const piano = await Piano.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [
          {
            model: Filiale,
            as: 'filiale',
            attributes: ['id', 'code', 'description']
          },
          {
            model: Edificio,
            as: 'edificio',
            attributes: ['id', 'code', 'description']
          }
        ]
      });

      if (!piano) {
        return next(AppError.notFound('Piano non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await PianoPolicy.canRead(req.user, piano);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo piano'));
      }

      res.json({
        status: 'success',
        data: {
          piano: piano.toJSON()
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di un piano specifico');
      next(error);
    }
  }

  /**
   * Crea un nuovo piano
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createPiano(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const pianoData = { ...req.body };

      // Verifica autorizzazione
      const canCreate = await PianoPolicy.canCreate(req.user, pianoData);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare piani'));
      }

      // Verifica che la filiale esista e appartenga al tenant corrente
      const filiale = await Filiale.findOne({
        where: {
          id: pianoData.filiale_id,
          tenant_id: req.tenantId
        }
      });

      if (!filiale) {
        return next(AppError.validation('La filiale specificata non esiste o non appartiene al tenant corrente'));
      }

      // Verifica che l'edificio esista, appartenga al tenant corrente e alla filiale specificata
      const edificio = await Edificio.findOne({
        where: {
          id: pianoData.edificio_id,
          tenant_id: req.tenantId,
          filiale_id: pianoData.filiale_id
        }
      });

      if (!edificio) {
        return next(AppError.validation('L\'edificio specificato non esiste, non appartiene al tenant corrente o non è associato alla filiale specificata'));
      }

      // Verifica che non esista già un piano con lo stesso codice nell'edificio
      const existingPiano = await Piano.findOne({
        where: {
          code: pianoData.code,
          edificio_id: pianoData.edificio_id,
          tenant_id: req.tenantId
        }
      });

      if (existingPiano) {
        return next(AppError.conflict(`Esiste già un piano con il codice ${pianoData.code} nell'edificio specificato`));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Crea il nuovo piano
        const piano = await Piano.create(
          {
            ...pianoData,
            tenant_id: req.tenantId
          },
          {
            transaction,
            userId: req.user.id
          }
        );

        // Commit della transazione
        await transaction.commit();

        logger.info(`Nuovo piano creato: ${piano.code} (${piano.id})`);

        // Recupera il piano con i dati delle relazioni
        const createdPiano = await Piano.findByPk(piano.id, {
          include: [
            {
              model: Filiale,
              as: 'filiale',
              attributes: ['id', 'code', 'description']
            },
            {
              model: Edificio,
              as: 'edificio',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Restituisci risposta
        res.status(201).json({
          status: 'success',
          message: 'Piano creato con successo',
          data: {
            piano: createdPiano.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di un piano');
      next(error);
    }
  }

  /**
   * Aggiorna un piano esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updatePiano(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const updateData = { ...req.body };

      // Recupera il piano da aggiornare
      const piano = await Piano.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [
          {
            model: Filiale,
            as: 'filiale',
            attributes: ['id', 'code', 'description']
          },
          {
            model: Edificio,
            as: 'edificio',
            attributes: ['id', 'code', 'description']
          }
        ]
      });

      if (!piano) {
        return next(AppError.notFound('Piano non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await PianoPolicy.canUpdate(req.user, piano, updateData);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questo piano'));
      }

      // Se l'utente sta cercando di cambiare la filiale o l'edificio, verifica che esistano
      if (updateData.filiale_id) {
        const filiale = await Filiale.findOne({
          where: {
            id: updateData.filiale_id,
            tenant_id: req.tenantId
          }
        });

        if (!filiale) {
          return next(AppError.validation('La filiale specificata non esiste o non appartiene al tenant corrente'));
        }
      }

      if (updateData.edificio_id) {
        const edificio = await Edificio.findOne({
          where: {
            id: updateData.edificio_id,
            tenant_id: req.tenantId,
            filiale_id: updateData.filiale_id || piano.filiale_id
          }
        });

        if (!edificio) {
          return next(AppError.validation('L\'edificio specificato non esiste, non appartiene al tenant corrente o non è associato alla filiale specificata'));
        }
      }

      // Se l'utente sta cercando di cambiare il codice, verifica che non esista già un piano con lo stesso codice nell'edificio
      if (updateData.code && updateData.code !== piano.code) {
        const existingPiano = await Piano.findOne({
          where: {
            code: updateData.code,
            edificio_id: updateData.edificio_id || piano.edificio_id,
            tenant_id: req.tenantId,
            id: { [Op.ne]: id }
          }
        });

        if (existingPiano) {
          return next(AppError.conflict(`Esiste già un piano con il codice ${updateData.code} nell'edificio specificato`));
        }
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Aggiorna il piano
        await piano.update(updateData, {
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Piano aggiornato: ${piano.code} (${piano.id})`);

        // Recupera il piano aggiornato
        const updatedPiano = await Piano.findByPk(id, {
          include: [
            {
              model: Filiale,
              as: 'filiale',
              attributes: ['id', 'code', 'description']
            },
            {
              model: Edificio,
              as: 'edificio',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Restituisci risposta
        res.json({
          status: 'success',
          message: 'Piano aggiornato con successo',
          data: {
            piano: updatedPiano.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di un piano');
      next(error);
    }
  }

  /**
   * Elimina un piano
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deletePiano(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera il piano da eliminare
      const piano = await Piano.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!piano) {
        return next(AppError.notFound('Piano non trovato'));
      }

      // Verifica autorizzazione
      const canDelete = await PianoPolicy.canDelete(req.user, piano);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questo piano'));
      }

      // Verifica se esistono dipendenze (es. locali, asset associati)
      const hasLocali = await sequelize.models.locale.count({
        where: { piano_id: id }
      });

      if (hasLocali > 0) {
        return next(AppError.conflict('Impossibile eliminare il piano: esistono locali associati'));
      }

      const hasAssets = await sequelize.models.Asset.count({
        where: { piano_id: id }
      });

      if (hasAssets > 0) {
        return next(AppError.conflict('Impossibile eliminare il piano: esistono asset associati'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina il piano
        await piano.destroy({
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Piano eliminato: ${piano.code} (${piano.id})`);

        // Restituisci risposta
        res.json({
          status: 'success',
          message: 'Piano eliminato con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di un piano');
      next(error);
    }
  }

  /**
   * Ottiene la history delle modifiche di un piano
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getPianoHistory(req, res, next) {
    try {
      const { id } = req.params;

      // Verifica che il piano esista
      const piano = await Piano.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!piano) {
        return next(AppError.notFound('Piano non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await PianoPolicy.canRead(req.user, piano);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo piano'));
      }

      // Recupera la history del piano
      const history = await sequelize.models.PianoHistory.findAll({
        where: { piano_id: id },
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
      logger.error({ err: error }, 'Errore durante il recupero della history di un piano');
      next(error);
    }
  }
}

module.exports = new PianoController();