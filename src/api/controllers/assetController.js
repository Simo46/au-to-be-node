'use strict';

const { Op } = require('sequelize');
const { Asset, Filiale, Edificio, Piano, locale, StatoDotazione, Fornitore, sequelize } = require('../../models');
const AssetPolicy = require('../../policies/AssetPolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:asset');

/**
 * Controller per la gestione degli asset
 */
class AssetController {
  /**
   * Ottiene la lista degli asset con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getAssets(req, res, next) {
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
        locale_id,
        asset_type,
        stato_dotazione_id,
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
          { description: { [Op.iLike]: `%${search}%` } },
          { marca: { [Op.iLike]: `%${search}%` } },
          { modello: { [Op.iLike]: `%${search}%` } },
          { matricola: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Applica filtro per tipo di asset
      if (asset_type) {
        where.asset_type = asset_type;
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

      // Applica filtro per locale
      if (locale_id) {
        where.locale_id = locale_id;
      }

      // Applica filtro per stato dotazione
      if (stato_dotazione_id) {
        where.stato_dotazione_id = stato_dotazione_id;
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        where.active = active === 'true';
      }

      // Se l'utente è un Responsabile Filiale, limita la vista agli asset della sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        where.filiale_id = req.user.filiale_id;
      }

      // Se l'utente è un Area Manager, limita la vista agli asset delle filiali della sua area
      if (req.user.hasRole('Area Manager')) {
        const managedFiliali = req.user.settings?.managed_filiali || [];
        if (managedFiliali.length > 0) {
          where.filiale_id = { [Op.in]: managedFiliali };
        }
      }

      // Esegui la query con tutti i filtri
      const { count, rows: assets } = await Asset.findAndCountAll({
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
          },
          {
            model: locale,
            as: 'locale',
            attributes: ['id', 'code', 'description']
          },
          {
            model: StatoDotazione,
            as: 'stato_dotazione',
            attributes: ['id', 'code', 'description', 'color']
          },
          {
            model: Fornitore,
            as: 'fornitore',
            attributes: ['id', 'code', 'description']
          }
        ],
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset
      });

      // Filtra i dati degli asset in base alle policy
      const filteredAssets = await Promise.all(
        assets.map(async (asset) => {
          if (await AssetPolicy.canRead(req.user, asset)) {
            return asset.toJSON();
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

      // Calcola informazioni sulla paginazione
      const totalPages = Math.ceil(count / limit);

      res.json({
        status: 'success',
        data: {
          assets: filteredAssets,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero degli asset');
      next(error);
    }
  }

  /**
   * Ottiene un asset specifico per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getAssetById(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera l'asset
      const asset = await Asset.findOne({
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
          },
          {
            model: locale,
            as: 'locale',
            attributes: ['id', 'code', 'description']
          },
          {
            model: StatoDotazione,
            as: 'stato_dotazione',
            attributes: ['id', 'code', 'description', 'color']
          },
          {
            model: Fornitore,
            as: 'fornitore',
            attributes: ['id', 'code', 'description']
          }
        ]
      });

      if (!asset) {
        return next(AppError.notFound('Asset non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await AssetPolicy.canRead(req.user, asset);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo asset'));
      }

      // Recupera dati specializzati basati sul tipo di asset
      let specializedAsset = null;
      if (asset.asset_type) {
        specializedAsset = await asset.getSpecializedAsset();
      }

      // Combina l'asset base con i dati specializzati
      const assetJSON = asset.toJSON();
      if (specializedAsset) {
        assetJSON.specialized = specializedAsset.toJSON();
      }

      res.json({
        status: 'success',
        data: {
          asset: assetJSON
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di un asset specifico');
      next(error);
    }
  }

  /**
   * Crea un nuovo asset
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createAsset(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      // Estrai i dati dalla richiesta
      const assetData = { ...req.body };

      // Verifica autorizzazione
      const canCreate = await AssetPolicy.canCreate(req.user, assetData);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare asset'));
      }

      // Verifica che la filiale esista e appartenga al tenant corrente
      const filiale = await Filiale.findOne({
        where: {
          id: assetData.filiale_id,
          tenant_id: req.tenantId
        }
      });

      if (!filiale) {
        return next(AppError.notFound('Filiale non trovata o non appartiene al tenant corrente'));
      }

      // Verifica le relazioni di localizzazione (edificio, piano, locale)
      if (assetData.edificio_id) {
        const edificio = await Edificio.findOne({
          where: {
            id: assetData.edificio_id,
            filiale_id: assetData.filiale_id,
            tenant_id: req.tenantId
          }
        });

        if (!edificio) {
          return next(AppError.notFound('Edificio non trovato, non appartiene alla filiale specificata o al tenant corrente'));
        }

        if (assetData.piano_id) {
          const piano = await Piano.findOne({
            where: {
              id: assetData.piano_id,
              edificio_id: assetData.edificio_id,
              filiale_id: assetData.filiale_id,
              tenant_id: req.tenantId
            }
          });

          if (!piano) {
            return next(AppError.notFound('Piano non trovato, non appartiene all\'edificio specificato o al tenant corrente'));
          }

          if (assetData.locale_id) {
            const locale = await sequelize.models.locale.findOne({
              where: {
                id: assetData.locale_id,
                piano_id: assetData.piano_id,
                edificio_id: assetData.edificio_id,
                filiale_id: assetData.filiale_id,
                tenant_id: req.tenantId
              }
            });

            if (!locale) {
              return next(AppError.notFound('Locale non trovato, non appartiene al piano specificato o al tenant corrente'));
            }
          }
        }
      }

      // Verifica se esiste già un asset con lo stesso codice nel tenant
      const existingAsset = await Asset.findOne({
        where: {
          code: assetData.code,
          tenant_id: req.tenantId
        }
      });

      if (existingAsset) {
        return next(AppError.conflict(`Esiste già un asset con il codice ${assetData.code}`));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Crea il nuovo asset
        const asset = await Asset.create(
          {
            ...assetData,
            tenant_id: req.tenantId
          },
          {
            transaction,
            userId: req.user.id
          }
        );

        // Commit della transazione
        await transaction.commit();

        logger.info(`Nuovo asset creato: ${asset.code} (${asset.id})`);

        // Recupera l'asset con relazioni
        const createdAsset = await Asset.findByPk(asset.id, {
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
            },
            {
              model: locale,
              as: 'locale',
              attributes: ['id', 'code', 'description']
            },
            {
              model: StatoDotazione,
              as: 'stato_dotazione',
              attributes: ['id', 'code', 'description', 'color']
            },
            {
              model: Fornitore,
              as: 'fornitore',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        res.status(201).json({
          status: 'success',
          message: 'Asset creato con successo',
          data: {
            asset: createdAsset.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di un asset');
      next(error);
    }
  }

  /**
   * Aggiorna un asset esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateAsset(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const updateData = { ...req.body };

      // Recupera l'asset da aggiornare
      const asset = await Asset.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!asset) {
        return next(AppError.notFound('Asset non trovato'));
      }

      // Verifica autorizzazione
      const canUpdate = await AssetPolicy.canUpdate(req.user, asset, updateData);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questo asset'));
      }

      // Se l'utente sta cercando di modificare filiale, edificio, piano o locale, verifica che esistano e siano coerenti
      if (updateData.filiale_id && updateData.filiale_id !== asset.filiale_id) {
        const filiale = await Filiale.findOne({
          where: {
            id: updateData.filiale_id,
            tenant_id: req.tenantId
          }
        });

        if (!filiale) {
          return next(AppError.notFound('Filiale non trovata o non appartiene al tenant corrente'));
        }
      }

      // Verifica edificio
      if (updateData.edificio_id) {
        const filialeId = updateData.filiale_id || asset.filiale_id;
        const edificio = await Edificio.findOne({
          where: {
            id: updateData.edificio_id,
            filiale_id: filialeId,
            tenant_id: req.tenantId
          }
        });

        if (!edificio) {
          return next(AppError.notFound('Edificio non trovato, non appartiene alla filiale specificata o al tenant corrente'));
        }
      }

      // Verifica piano
      if (updateData.piano_id) {
        const filialeId = updateData.filiale_id || asset.filiale_id;
        const edificioId = updateData.edificio_id || asset.edificio_id;
        const piano = await Piano.findOne({
          where: {
            id: updateData.piano_id,
            edificio_id: edificioId,
            filiale_id: filialeId,
            tenant_id: req.tenantId
          }
        });

        if (!piano) {
          return next(AppError.notFound('Piano non trovato, non appartiene all\'edificio specificato o al tenant corrente'));
        }
      }

      // Verifica locale
      if (updateData.locale_id) {
        const filialeId = updateData.filiale_id || asset.filiale_id;
        const edificioId = updateData.edificio_id || asset.edificio_id;
        const pianoId = updateData.piano_id || asset.piano_id;
        const locale = await sequelize.models.locale.findOne({
          where: {
            id: updateData.locale_id,
            piano_id: pianoId,
            edificio_id: edificioId,
            filiale_id: filialeId,
            tenant_id: req.tenantId
          }
        });

        if (!locale) {
          return next(AppError.notFound('Locale non trovato, non appartiene al piano specificato o al tenant corrente'));
        }
      }

      // Verifica se il nuovo codice è già in uso (se viene modificato)
      if (updateData.code && updateData.code !== asset.code) {
        const existingAsset = await Asset.findOne({
          where: {
            code: updateData.code,
            tenant_id: req.tenantId,
            id: { [Op.ne]: id }
          }
        });

        if (existingAsset) {
          return next(AppError.conflict(`Esiste già un asset con il codice ${updateData.code}`));
        }
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Aggiorna l'asset
        await asset.update(updateData, {
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Asset aggiornato: ${asset.code} (${asset.id})`);

        // Recupera l'asset aggiornato con relazioni
        const updatedAsset = await Asset.findByPk(id, {
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
            },
            {
              model: locale,
              as: 'locale',
              attributes: ['id', 'code', 'description']
            },
            {
              model: StatoDotazione,
              as: 'stato_dotazione',
              attributes: ['id', 'code', 'description', 'color']
            },
            {
              model: Fornitore,
              as: 'fornitore',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Recupera dati specializzati basati sul tipo di asset
        let specializedAsset = null;
        if (updatedAsset.asset_type) {
          specializedAsset = await updatedAsset.getSpecializedAsset();
        }

        // Combina l'asset base con i dati specializzati
        const assetJSON = updatedAsset.toJSON();
        if (specializedAsset) {
          assetJSON.specialized = specializedAsset.toJSON();
        }

        res.json({
          status: 'success',
          message: 'Asset aggiornato con successo',
          data: {
            asset: assetJSON
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di un asset');
      next(error);
    }
  }

  /**
   * Elimina un asset
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteAsset(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera l'asset da eliminare
      const asset = await Asset.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!asset) {
        return next(AppError.notFound('Asset non trovato'));
      }

      // Verifica autorizzazione
      const canDelete = await AssetPolicy.canDelete(req.user, asset);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questo asset'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina prima le specializzazioni dell'asset
        if (asset.asset_type === 'attrezzatura') {
          await sequelize.models.Attrezzatura.destroy({
            where: { asset_id: id },
            transaction,
            userId: req.user.id,
            force: false // Soft delete
          });
        } else if (asset.asset_type === 'strumento_misura') {
          await sequelize.models.StrumentoDiMisura.destroy({
            where: { asset_id: id },
            transaction,
            userId: req.user.id,
            force: false // Soft delete
          });
        } else if (asset.asset_type === 'impianto') {
          await sequelize.models.ImpiantoTecnologico.destroy({
            where: { asset_id: id },
            transaction,
            userId: req.user.id,
            force: false // Soft delete
          });
        }

        // Elimina l'asset base
        await asset.destroy({
          transaction,
          userId: req.user.id,
          force: false // Soft delete
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Asset eliminato: ${asset.code} (${asset.id})`);

        res.json({
          status: 'success',
          message: 'Asset eliminato con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di un asset');
      next(error);
    }
  }

  /**
   * Ottiene la history delle modifiche di un asset
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getAssetHistory(req, res, next) {
    try {
      const { id } = req.params;

      // Verifica che l'asset esista
      const asset = await Asset.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!asset) {
        return next(AppError.notFound('Asset non trovato'));
      }

      // Verifica autorizzazione
      const canRead = await AssetPolicy.canRead(req.user, asset);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare la history di questo asset'));
      }

      // Recupera la history dell'asset
      const history = await sequelize.models.AssetHistory.findAll({
        where: { asset_id: id },
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
      logger.error({ err: error }, 'Errore durante il recupero della history di un asset');
      next(error);
    }
  }
}

module.exports = new AssetController();