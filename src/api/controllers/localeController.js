'use strict';

const { Op } = require('sequelize');
const { locale, Piano, Edificio, Filiale, sequelize } = require('../../models');
const LocalePolicy = require('../../policies/LocalePolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:locale');

/**
 * Controller per la gestione dei locali
 */
class LocaleController {
  /**
   * Ottiene la lista dei locali con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getLocali(req, res, next) {
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
        piano_id,
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

      // Applica filtro per piano
      if (piano_id) {
        where.piano_id = piano_id;
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        where.active = active === 'true';
      }

      // Se l'utente è un Responsabile Filiale, limita la vista alla sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        where.filiale_id = req.user.filiale_id;
      }

      // Se l'utente è un Area Manager, limita la vista alle filiali della sua area
      if (req.user.hasRole('Area Manager')) {
        const managedFiliali = req.user.settings?.managed_filiali || [];
        if (managedFiliali.length > 0) {
          where.filiale_id = { [Op.in]: managedFiliali };
        }
      }

      // Esegui la query con tutti i filtri
      const { count, rows: locali } = await locale.findAndCountAll({
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
          },
          {
            model: Piano,
            as: 'piano',
            attributes: ['id', 'code', 'description']
          }
        ],
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset
      });

      // Filtra i dati dei locali in base alle policy
      const filteredLocali = await Promise.all(
        locali.map(async (locale) => {
          if (await LocalePolicy.canRead(req.user, locale)) {
            return locale.toJSON();
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

      // Calcola informazioni sulla paginazione
      const totalPages = Math.ceil(count / limit);

      res.json({
        status: 'success',
        data: {
          locali: filteredLocali,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero dei locali');
      next(error);
    }
  }

  /**
   * Ottiene un locale specifico per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getLocaleById(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera il locale
      const locale = await sequelize.models.locale.findOne({
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
          },
          {
            model: Piano,
            as: 'piano',
            attributes: ['id', 'code', 'description']
          }
        ]
      });

      if (!locale) {
        return next(AppError.notFound('Locale non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await LocalePolicy.canRead(req.user, locale);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo locale'));
      }

      res.json({
        status: 'success',
        data: {
          locale: locale.toJSON()
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di un locale specifico');
      next(error);
    }
  }

  /**
   * Crea un nuovo locale
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createLocale(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      // Estrai i dati dalla richiesta
      const localeData = { ...req.body };

      // Verifica autorizzazione
      const canCreate = await LocalePolicy.canCreate(req.user, localeData);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare locali'));
      }

      // Verifica che la filiale, l'edificio e il piano esistano e siano coerenti
      const piano = await Piano.findOne({
        where: {
          id: localeData.piano_id,
          edificio_id: localeData.edificio_id,
          filiale_id: localeData.filiale_id,
          tenant_id: req.tenantId
        }
      });

      if (!piano) {
        return next(AppError.notFound('Piano, edificio o filiale non trovati o non corrispondenti'));
      }

      // Verifica se esiste già un locale con lo stesso codice per lo stesso piano
      const existingLocale = await sequelize.models.locale.findOne({
        where: {
          code: localeData.code,
          piano_id: localeData.piano_id,
          tenant_id: req.tenantId
        }
      });

      if (existingLocale) {
        return next(AppError.conflict(`Esiste già un locale con il codice ${localeData.code} in questo piano`));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Crea il nuovo locale
        const locale = await sequelize.models.locale.create(
          {
            ...localeData,
            tenant_id: req.tenantId
          },
          {
            transaction,
            userId: req.user.id
          }
        );

        // Commit della transazione
        await transaction.commit();

        logger.info(`Nuovo locale creato: ${locale.code} (${locale.id})`);

        // Carica il locale con le relazioni
        const createdLocale = await sequelize.models.locale.findByPk(locale.id, {
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
            },
            {
              model: Piano,
              as: 'piano',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Restituisci il locale creato
        res.status(201).json({
          status: 'success',
          message: 'Locale creato con successo',
          data: {
            locale: createdLocale.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di un locale');
      next(error);
    }
  }

  /**
   * Aggiorna un locale esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateLocale(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const updateData = { ...req.body };

      // Recupera il locale da aggiornare
      const locale = await sequelize.models.locale.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!locale) {
        return next(AppError.notFound('Locale non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await LocalePolicy.canUpdate(req.user, locale, updateData);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questo locale'));
      }

      // Se vengono modificati piano, edificio o filiale, verifica che esistano e siano coerenti
      if (updateData.piano_id || updateData.edificio_id || updateData.filiale_id) {
        const pianoId = updateData.piano_id || locale.piano_id;
        const edificioId = updateData.edificio_id || locale.edificio_id;
        const filialeId = updateData.filiale_id || locale.filiale_id;

        const piano = await Piano.findOne({
          where: {
            id: pianoId,
            edificio_id: edificioId,
            filiale_id: filialeId,
            tenant_id: req.tenantId
          }
        });

        if (!piano) {
          return next(AppError.notFound('Piano, edificio o filiale non trovati o non corrispondenti'));
        }
      }

      // Verifica se il nuovo codice è già in uso (se viene modificato)
      if (updateData.code && updateData.code !== locale.code) {
        const existingLocale = await sequelize.models.locale.findOne({
          where: {
            code: updateData.code,
            piano_id: updateData.piano_id || locale.piano_id,
            tenant_id: req.tenantId,
            id: { [Op.ne]: id }
          }
        });

        if (existingLocale) {
          return next(AppError.conflict(`Esiste già un locale con il codice ${updateData.code} in questo piano`));
        }
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Aggiorna il locale
        await locale.update(updateData, {
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Locale aggiornato: ${locale.code} (${locale.id})`);

        // Carica il locale aggiornato con le relazioni
        const updatedLocale = await sequelize.models.locale.findByPk(id, {
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
            },
            {
              model: Piano,
              as: 'piano',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Restituisci il locale aggiornato
        res.json({
          status: 'success',
          message: 'Locale aggiornato con successo',
          data: {
            locale: updatedLocale.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di un locale');
      next(error);
    }
  }

  /**
   * Elimina un locale
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteLocale(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera il locale da eliminare
      const locale = await sequelize.models.locale.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!locale) {
        return next(AppError.notFound('Locale non trovato'));
      }

      // Verifica autorizzazione
      const canDelete = await LocalePolicy.canDelete(req.user, locale);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questo locale'));
      }

      // Verifica se esistono asset associati al locale
      const hasAssets = await sequelize.models.Asset.count({
        where: { locale_id: id }
      });

      if (hasAssets > 0) {
        return next(AppError.conflict('Impossibile eliminare il locale: esistono asset associati'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina il locale (soft delete, grazie a paranoid: true nel modello)
        await locale.destroy({
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Locale eliminato: ${locale.code} (${locale.id})`);

        // Restituisci risposta
        res.json({
          status: 'success',
          message: 'Locale eliminato con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di un locale');
      next(error);
    }
  }

  /**
   * Ottiene la history delle modifiche di un locale
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getLocaleHistory(req, res, next) {
    try {
      const { id } = req.params;

      // Verifica che il locale esista
      const locale = await sequelize.models.locale.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!locale) {
        return next(AppError.notFound('Locale non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await LocalePolicy.canRead(req.user, locale);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo locale'));
      }

      // Recupera la history del locale
      const history = await sequelize.models.localeHistory.findAll({
        where: { locale_id: id },
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
      logger.error({ err: error }, 'Errore durante il recupero della history di un locale');
      next(error);
    }
  }
}

module.exports = new LocaleController();