'use strict';

const { Op } = require('sequelize');
const { Asset, StrumentoDiMisura, CategoriaStrumentoMisura, Filiale, sequelize } = require('../../models');
const AssetPolicy = require('../../policies/AssetPolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:strumento');

/**
 * Controller per la gestione degli strumenti di misura
 */
class StrumentoController {
  /**
   * Ottiene la lista degli strumenti di misura con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getStrumenti(req, res, next) {
    try {
      // Estrai parametri di query
      const {
        page = 1,
        limit = 10,
        sort_by = 'code', 
        sort_dir = 'ASC',
        search,
        filiale_id,
        categoria_id,
        active
      } = req.query;

      // Calcola offset per paginazione
      const offset = (page - 1) * limit;

      // Costruisci condizioni di ricerca base per asset
      const assetWhere = {
        tenant_id: req.tenantId,
        asset_type: 'strumento_misura'
      };

      // Costruisci condizioni di ricerca per strumento di misura
      const strumentoWhere = {
        tenant_id: req.tenantId
      };

      // Applica filtro di ricerca testuale
      if (search) {
        assetWhere[Op.or] = [
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { marca: { [Op.iLike]: `%${search}%` } },
          { modello: { [Op.iLike]: `%${search}%` } },
          { matricola: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Applica filtro per filiale
      if (filiale_id) {
        assetWhere.filiale_id = filiale_id;
      }

      // Applica filtro per categoria
      if (categoria_id) {
        strumentoWhere.categoria_id = categoria_id;
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        assetWhere.active = active === 'true';
      }

      // Se l'utente è un Responsabile Filiale, limita la vista agli strumenti della sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        assetWhere.filiale_id = req.user.filiale_id;
      }

      // Se l'utente è un Area Manager, limita la vista agli strumenti delle filiali della sua area
      if (req.user.hasRole('Area Manager')) {
        const managedFiliali = req.user.settings?.managed_filiali || [];
        if (managedFiliali.length > 0) {
          assetWhere.filiale_id = { [Op.in]: managedFiliali };
        }
      }

      // Ordina per campo dell'asset o dello strumento
      const order = [];
      if (['categoria_id'].includes(sort_by)) {
        order.push([sequelize.literal(`"strumento_di_misura"."${sort_by}"`), sort_dir]);
      } else {
        order.push([sort_by, sort_dir]);
      }

      // Esegui la query con tutti i filtri
      const { count, rows: strumenti } = await Asset.findAndCountAll({
        where: assetWhere,
        include: [
          {
            model: StrumentoDiMisura,
            as: 'strumento_di_misura',
            where: strumentoWhere,
            include: [
              {
                model: CategoriaStrumentoMisura,
                as: 'categoria',
                attributes: ['id', 'code', 'description']
              }
            ]
          },
          {
            model: Filiale,
            as: 'filiale',
            attributes: ['id', 'code', 'description']
          }
        ],
        order,
        limit: parseInt(limit),
        offset,
        distinct: true // Necessario per conteggio corretto con include
      });

      // Filtra i dati degli strumenti in base alle policy
      const filteredStrumenti = await Promise.all(
        strumenti.map(async (asset) => {
          if (await AssetPolicy.canRead(req.user, asset)) {
            const assetJSON = asset.toJSON();
            
            // Estrai i dati dello strumento per semplificare la struttura
            if (assetJSON.strumento_di_misura) {
              const result = {
                ...assetJSON,
                strumento_id: assetJSON.strumento_di_misura.id, // Aggiungi l'ID dello strumento
                categoria: assetJSON.strumento_di_misura.categoria,
                descrizione: assetJSON.strumento_di_misura.descrizione
              };
              
              // Rimuovi la proprietà nidificata per evitare duplicazione
              delete result.strumento_di_misura;
              
              return result;
            }
            
            return assetJSON;
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

      // Calcola informazioni sulla paginazione
      const totalPages = Math.ceil(count / limit);

      res.json({
        status: 'success',
        data: {
          strumenti: filteredStrumenti,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero degli strumenti di misura');
      next(error);
    }
  }

  /**
   * Ottiene uno strumento di misura specifico per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getStrumentoById(req, res, next) {
    try {
      const { id } = req.params; // Questo ora è l'ID dello strumento

      // Recupera lo strumento usando l'ID specializzato
      const strumento = await StrumentoDiMisura.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [
          {
            model: Asset,
            as: 'asset',
            include: [
              {
                model: Filiale,
                as: 'filiale',
                attributes: ['id', 'code', 'description']
              }
            ]
          },
          {
            model: CategoriaStrumentoMisura,
            as: 'categoria',
            attributes: ['id', 'code', 'description']
          }
        ]
      });

      if (!strumento || !strumento.asset) {
        return next(AppError.notFound('Strumento di misura non trovato'));
      }

      // Verifica autorizzazione sull'asset base
      const canRead = await AssetPolicy.canRead(req.user, strumento.asset);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo strumento di misura'));
      }

      // Combina l'asset base con i dati dello strumento
      const assetJSON = strumento.asset.toJSON();
      const result = {
        ...assetJSON,
        strumento_id: strumento.id,
        categoria: strumento.categoria,
        descrizione: strumento.descrizione
      };

      res.json({
        status: 'success',
        data: {
          strumento: result
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di uno strumento di misura specifico');
      next(error);
    }
  }

  /**
   * Crea un nuovo strumento di misura completo (asset + dettagli)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createStrumento(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      // Estrai i dati dalla richiesta e separa asset e strumento
      const {
        // Campi specifici per strumento
        categoria_id,
        descrizione,
        
        // Gli altri campi sono per l'asset
        ...assetData
      } = req.body;

      // Imposta il tipo di asset
      assetData.asset_type = 'strumento_misura';

      // Verifica autorizzazione
      const canCreate = await AssetPolicy.canCreate(req.user, assetData);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare strumenti di misura'));
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

        // Crea il nuovo strumento
        const strumento = await StrumentoDiMisura.create(
          {
            asset_id: asset.id,
            tenant_id: req.tenantId,
            categoria_id,
            descrizione
          },
          {
            transaction,
            userId: req.user.id,
            asset
          }
        );

        // Commit della transazione
        await transaction.commit();

        logger.info(`Nuovo strumento di misura creato: ${asset.code} (${asset.id}), strumento_id: ${strumento.id}`);

        // Recupera lo strumento completo con le relazioni
        const createdStrumento = await StrumentoDiMisura.findByPk(strumento.id, {
          include: [
            {
              model: Asset,
              as: 'asset',
              include: [
                {
                  model: Filiale,
                  as: 'filiale',
                  attributes: ['id', 'code', 'description']
                }
              ]
            },
            {
              model: CategoriaStrumentoMisura,
              as: 'categoria',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Combina l'asset base con i dati dello strumento
        const assetJSON = createdStrumento.asset.toJSON();
        const result = {
          ...assetJSON,
          strumento_id: createdStrumento.id,
          categoria: createdStrumento.categoria,
          descrizione: createdStrumento.descrizione
        };

        res.status(201).json({
          status: 'success',
          message: 'Strumento di misura creato con successo',
          data: {
            strumento: result
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di uno strumento di misura');
      next(error);
    }
  }

  /**
   * Aggiunge dettagli di strumento di misura a un asset esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async addToExistingAsset(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      // Estrai i dati dalla richiesta
      const strumentoData = { ...req.body };

      // Verifica che l'asset esista e appartenga al tenant corrente
      const asset = await Asset.findOne({
        where: {
          id: strumentoData.asset_id,
          tenant_id: req.tenantId
        }
      });

      if (!asset) {
        return next(AppError.notFound('Asset non trovato o non appartiene al tenant corrente'));
      }

      // Verifica autorizzazione
      const canCreate = await AssetPolicy.canCreate(req.user, asset);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare strumenti di misura per questo asset'));
      }

      // Verifica che non esista già uno strumento per questo asset
      const existingStrumento = await StrumentoDiMisura.findOne({
        where: {
          asset_id: strumentoData.asset_id
        }
      });

      if (existingStrumento) {
        return next(AppError.conflict('Esiste già uno strumento di misura per questo asset'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Aggiorna l'asset per impostare il tipo
        await asset.update({ asset_type: 'strumento_misura' }, {
          transaction,
          userId: req.user.id
        });

        // Crea il nuovo strumento
        const strumento = await StrumentoDiMisura.create(
          {
            ...strumentoData,
            tenant_id: req.tenantId
          },
          {
            transaction,
            userId: req.user.id,
            asset
          }
        );

        // Commit della transazione
        await transaction.commit();

        logger.info(`Nuovo strumento di misura creato per asset ${asset.code} (${asset.id}), strumento_id: ${strumento.id}`);

        // Recupera lo strumento completo con le relazioni
        const createdStrumento = await StrumentoDiMisura.findByPk(strumento.id, {
          include: [
            {
              model: Asset,
              as: 'asset',
              include: [
                {
                  model: Filiale,
                  as: 'filiale',
                  attributes: ['id', 'code', 'description']
                }
              ]
            },
            {
              model: CategoriaStrumentoMisura,
              as: 'categoria',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Combina l'asset base con i dati dello strumento
        const assetJSON = createdStrumento.asset.toJSON();
        const result = {
          ...assetJSON,
          strumento_id: createdStrumento.id,
          categoria: createdStrumento.categoria,
          descrizione: createdStrumento.descrizione
        };

        res.status(201).json({
          status: 'success',
          message: 'Dettagli strumento di misura aggiunti con successo',
          data: {
            strumento: result
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiunta di dettagli strumento di misura a un asset esistente');
      next(error);
    }
  }

  /**
   * Crea un nuovo asset di tipo strumento di misura (creazione combinata)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createCombined(req, res, next) {
    // Reindirizza alla funzione createStrumento che gestisce già questo caso
    return this.createStrumento(req, res, next);
  }

  /**
   * Aggiorna uno strumento di misura esistente (asset e/o dettagli)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateStrumento(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params; // Questo ora è l'ID dello strumento
      const updateData = { ...req.body };

      // Verifica che lo strumento esista
      const strumento = await StrumentoDiMisura.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [
          {
            model: Asset,
            as: 'asset'
          }
        ]
      });

      if (!strumento || !strumento.asset) {
        return next(AppError.notFound('Strumento di misura non trovato'));
      }

      const asset = strumento.asset;

      // Verifica autorizzazione
      const canUpdate = await AssetPolicy.canUpdate(req.user, asset, updateData);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questo strumento di misura'));
      }

      // Separa i campi per asset e strumento
      const assetFields = [
        'code', 'description', 'marca', 'modello', 'matricola', 'stato_dotazione_id',
        'tipo_possesso_id', 'fornitore_id', 'data_ultima_manutenzione', 'data_prossima_manutenzione',
        'frequenza_manutenzione', 'stato_interventi_id', 'filiale_id', 'edificio_id', 'piano_id',
        'locale_id', 'scatola', 'scaffale', 'data_acquisto', 'active', 'notes'
      ];
      
      const strumentoFields = [
        'categoria_id', 'descrizione'
      ];
      
      const assetUpdate = {};
      const strumentoUpdate = {};

      // Distribuisci i campi ai rispettivi oggetti di aggiornamento
      Object.keys(updateData).forEach(key => {
        if (assetFields.includes(key)) {
          assetUpdate[key] = updateData[key];
        } else if (strumentoFields.includes(key)) {
          strumentoUpdate[key] = updateData[key];
        }
      });

      // Verifica il codice univoco se viene modificato
      if (assetUpdate.code && assetUpdate.code !== asset.code) {
        const existingAsset = await Asset.findOne({
          where: {
            code: assetUpdate.code,
            tenant_id: req.tenantId,
            id: { [Op.ne]: asset.id }
          }
        });

        if (existingAsset) {
          return next(AppError.conflict(`Esiste già un asset con il codice ${assetUpdate.code}`));
        }
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Aggiorna asset se ci sono campi
        if (Object.keys(assetUpdate).length > 0) {
          await asset.update(assetUpdate, {
            transaction,
            userId: req.user.id
          });
        }
        
        // Aggiorna strumento se ci sono campi
        if (Object.keys(strumentoUpdate).length > 0) {
          await strumento.update(strumentoUpdate, {
            transaction,
            userId: req.user.id
          });
        }
        
        // Commit della transazione
        await transaction.commit();

        logger.info(`Strumento di misura aggiornato: ${asset.code} (${asset.id}), strumento_id: ${strumento.id}`);

        // Recupera lo strumento aggiornato con le relazioni
        const updatedStrumento = await StrumentoDiMisura.findByPk(id, {
          include: [
            {
              model: Asset,
              as: 'asset',
              include: [
                {
                  model: Filiale,
                  as: 'filiale',
                  attributes: ['id', 'code', 'description']
                }
              ]
            },
            {
              model: CategoriaStrumentoMisura,
              as: 'categoria',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Combina l'asset base con i dati dello strumento
        const assetJSON = updatedStrumento.asset.toJSON();
        const result = {
          ...assetJSON,
          strumento_id: updatedStrumento.id,
          categoria: updatedStrumento.categoria,
          descrizione: updatedStrumento.descrizione
        };

        res.json({
          status: 'success',
          message: 'Strumento di misura aggiornato con successo',
          data: {
            strumento: result
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di uno strumento di misura');
      next(error);
    }
  }

  /**
   * Elimina uno strumento di misura
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteStrumento(req, res, next) {
    try {
      const { id } = req.params; // Questo ora è l'ID dello strumento

      // Verifica che lo strumento esista
      const strumento = await StrumentoDiMisura.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [
          {
            model: Asset,
            as: 'asset'
          }
        ]
      });

      if (!strumento || !strumento.asset) {
        return next(AppError.notFound('Strumento di misura non trovato'));
      }

      const asset = strumento.asset;

      // Verifica autorizzazione
      const canDelete = await AssetPolicy.canDelete(req.user, asset);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questo strumento di misura'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina la specializzazione strumento
        await strumento.destroy({
          transaction,
          userId: req.user.id,
          force: false // Soft delete
        });

        // Elimina l'asset base
        await asset.destroy({
          transaction,
          userId: req.user.id,
          force: false // Soft delete
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Strumento di misura eliminato: ${asset.code} (${asset.id}), strumento_id: ${id}`);

        res.json({
          status: 'success',
          message: 'Strumento di misura eliminato con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di uno strumento di misura');
      next(error);
    }
  }

  /**
   * Ottiene la history delle modifiche di uno strumento di misura
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getStrumentoHistory(req, res, next) {
    try {
      const { id } = req.params; // Questo ora è l'ID dello strumento

      // Verifica che lo strumento esista
      const strumento = await StrumentoDiMisura.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        },
        include: [
          {
            model: Asset,
            as: 'asset'
          }
        ]
      });

      if (!strumento || !strumento.asset) {
        return next(AppError.notFound('Strumento di misura non trovato'));
      }

      const asset = strumento.asset;

      // Verifica autorizzazione
      const canRead = await AssetPolicy.canRead(req.user, asset);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare la history di questo strumento di misura'));
      }

      // Recupera la history dell'asset
      const history = await sequelize.models.AssetHistory.findAll({
        where: { asset_id: asset.id },
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
      logger.error({ err: error }, 'Errore durante il recupero della history di uno strumento di misura');
      next(error);
    }
  }
}

module.exports = new StrumentoController();