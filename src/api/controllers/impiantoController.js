'use strict';

const { Op } = require('sequelize');
const { Asset, ImpiantoTecnologico, CategoriaImpiantoTecnologico, TipoAlimentazione, Filiale, sequelize } = require('../../models');
const AssetPolicy = require('../../policies/AssetPolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:impianto');

/**
 * Controller per la gestione degli impianti tecnologici
 */
class ImpiantoController {
  /**
   * Ottiene la lista degli impianti tecnologici con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getImpianti(req, res, next) {
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
        tipo_alimentazione_id,
        active
      } = req.query;

      // Calcola offset per paginazione
      const offset = (page - 1) * limit;

      // Costruisci condizioni di ricerca base per asset
      const assetWhere = {
        tenant_id: req.tenantId,
        asset_type: 'impianto'
      };

      // Costruisci condizioni di ricerca per impianto
      const impiantoWhere = {
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
        impiantoWhere.categoria_id = categoria_id;
      }

      // Applica filtro per tipo alimentazione
      if (tipo_alimentazione_id) {
        impiantoWhere.tipo_alimentazione_id = tipo_alimentazione_id;
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        assetWhere.active = active === 'true';
      }

      // Se l'utente è un Responsabile Filiale, limita la vista agli impianti della sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        assetWhere.filiale_id = req.user.filiale_id;
      }

      // Se l'utente è un Area Manager, limita la vista agli impianti delle filiali della sua area
      if (req.user.hasRole('Area Manager')) {
        const managedFiliali = req.user.settings?.managed_filiali || [];
        if (managedFiliali.length > 0) {
          assetWhere.filiale_id = { [Op.in]: managedFiliali };
        }
      }

      // Ordina per campo dell'asset o dell'impianto
      const order = [];
      if (['categoria_id', 'tipo_alimentazione_id'].includes(sort_by)) {
        order.push([sequelize.literal(`"impianto_tecnologico"."${sort_by}"`), sort_dir]);
      } else {
        order.push([sort_by, sort_dir]);
      }

      // Esegui la query con tutti i filtri
      const { count, rows: impianti } = await Asset.findAndCountAll({
        where: assetWhere,
        include: [
          {
            model: ImpiantoTecnologico,
            as: 'impianto_tecnologico',
            where: impiantoWhere,
            include: [
              {
                model: CategoriaImpiantoTecnologico,
                as: 'categoria',
                attributes: ['id', 'code', 'description']
              },
              {
                model: TipoAlimentazione,
                as: 'tipo_alimentazione',
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

      // Filtra i dati degli impianti in base alle policy
      const filteredImpianti = await Promise.all(
        impianti.map(async (asset) => {
          if (await AssetPolicy.canRead(req.user, asset)) {
            const assetJSON = asset.toJSON();
            
            // Estrai i dati dell'impianto per semplificare la struttura
            if (assetJSON.impianto_tecnologico) {
              const result = {
                ...assetJSON,
                impianto_id: assetJSON.impianto_tecnologico.id, // Aggiungi l'ID dell'impianto
                categoria: assetJSON.impianto_tecnologico.categoria,
                tipo_alimentazione: assetJSON.impianto_tecnologico.tipo_alimentazione,
                descrizione: assetJSON.impianto_tecnologico.descrizione
              };
              
              // Rimuovi la proprietà nidificata per evitare duplicazione
              delete result.impianto_tecnologico;
              
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
          impianti: filteredImpianti,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero degli impianti tecnologici');
      next(error);
    }
  }

  /**
   * Ottiene un impianto tecnologico specifico per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getImpiantoById(req, res, next) {
    try {
      const { id } = req.params; // Questo ora è l'ID dell'impianto

      // Recupera l'impianto usando l'ID specializzato
      const impianto = await ImpiantoTecnologico.findOne({
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
            model: CategoriaImpiantoTecnologico,
            as: 'categoria',
            attributes: ['id', 'code', 'description']
          },
          {
            model: TipoAlimentazione,
            as: 'tipo_alimentazione',
            attributes: ['id', 'code', 'description']
          }
        ]
      });

      if (!impianto || !impianto.asset) {
        return next(AppError.notFound('Impianto tecnologico non trovato'));
      }

      // Verifica autorizzazione sull'asset base
      const canRead = await AssetPolicy.canRead(req.user, impianto.asset);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questo impianto tecnologico'));
      }

      // Combina l'asset base con i dati dell'impianto
      const assetJSON = impianto.asset.toJSON();
      const result = {
        ...assetJSON,
        impianto_id: impianto.id,
        categoria: impianto.categoria,
        tipo_alimentazione: impianto.tipo_alimentazione,
        descrizione: impianto.descrizione
      };

      res.json({
        status: 'success',
        data: {
          impianto: result
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di un impianto tecnologico specifico');
      next(error);
    }
  }

  /**
   * Crea un nuovo impianto tecnologico completo (asset + dettagli)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createImpianto(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      // Estrai i dati dalla richiesta e separa asset e impianto
      const {
        // Campi specifici per impianto
        categoria_id,
        tipo_alimentazione_id,
        descrizione,
        
        // Gli altri campi sono per l'asset
        ...assetData
      } = req.body;

      // Imposta il tipo di asset
      assetData.asset_type = 'impianto';

      // Verifica autorizzazione
      const canCreate = await AssetPolicy.canCreate(req.user, assetData);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare impianti tecnologici'));
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

        // Crea il nuovo impianto
        const impianto = await ImpiantoTecnologico.create(
          {
            asset_id: asset.id,
            tenant_id: req.tenantId,
            categoria_id,
            tipo_alimentazione_id,
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

        logger.info(`Nuovo impianto tecnologico creato: ${asset.code} (${asset.id}), impianto_id: ${impianto.id}`);

        // Recupera l'impianto completo con le relazioni
        const createdImpianto = await ImpiantoTecnologico.findByPk(impianto.id, {
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
              model: CategoriaImpiantoTecnologico,
              as: 'categoria',
              attributes: ['id', 'code', 'description']
            },
            {
              model: TipoAlimentazione,
              as: 'tipo_alimentazione',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Combina l'asset base con i dati dell'impianto
        const assetJSON = createdImpianto.asset.toJSON();
        const result = {
          ...assetJSON,
          impianto_id: createdImpianto.id,
          categoria: createdImpianto.categoria,
          tipo_alimentazione: createdImpianto.tipo_alimentazione,
          descrizione: createdImpianto.descrizione
        };

        res.status(201).json({
          status: 'success',
          message: 'Impianto tecnologico creato con successo',
          data: {
            impianto: result
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di un impianto tecnologico');
      next(error);
    }
  }

  /**
   * Aggiunge dettagli di impianto tecnologico a un asset esistente
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
      const impiantoData = { ...req.body };

      // Verifica che l'asset esista e appartenga al tenant corrente
      const asset = await Asset.findOne({
        where: {
          id: impiantoData.asset_id,
          tenant_id: req.tenantId
        }
      });

      if (!asset) {
        return next(AppError.notFound('Asset non trovato o non appartiene al tenant corrente'));
      }

      // Verifica autorizzazione
      const canCreate = await AssetPolicy.canCreate(req.user, asset);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare impianti tecnologici per questo asset'));
      }

      // Verifica che non esista già un impianto per questo asset
      const existingImpianto = await ImpiantoTecnologico.findOne({
        where: {
          asset_id: impiantoData.asset_id
        }
      });

      if (existingImpianto) {
        return next(AppError.conflict('Esiste già un impianto tecnologico per questo asset'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Aggiorna l'asset per impostare il tipo
        await asset.update({ asset_type: 'impianto' }, {
          transaction,
          userId: req.user.id
        });

        // Crea il nuovo impianto
        const impianto = await ImpiantoTecnologico.create(
          {
            ...impiantoData,
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

        logger.info(`Nuovo impianto tecnologico creato per asset ${asset.code} (${asset.id}), impianto_id: ${impianto.id}`);

        // Recupera l'impianto completo con le relazioni
        const createdImpianto = await ImpiantoTecnologico.findByPk(impianto.id, {
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
              model: CategoriaImpiantoTecnologico,
              as: 'categoria',
              attributes: ['id', 'code', 'description']
            },
            {
              model: TipoAlimentazione,
              as: 'tipo_alimentazione',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Combina l'asset base con i dati dell'impianto
        const assetJSON = createdImpianto.asset.toJSON();
        const result = {
          ...assetJSON,
          impianto_id: createdImpianto.id,
          categoria: createdImpianto.categoria,
          tipo_alimentazione: createdImpianto.tipo_alimentazione,
          descrizione: createdImpianto.descrizione
        };

        res.status(201).json({
          status: 'success',
          message: 'Dettagli impianto tecnologico aggiunti con successo',
          data: {
            impianto: result
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiunta di dettagli impianto tecnologico a un asset esistente');
      next(error);
    }
  }

  /**
   * Crea un nuovo asset di tipo impianto tecnologico (creazione combinata)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createCombined(req, res, next) {
    // Reindirizza alla funzione createImpianto che gestisce già questo caso
    return this.createImpianto(req, res, next);
  }

  /**
   * Aggiorna un impianto tecnologico esistente (asset e/o dettagli)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateImpianto(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params; // Questo ora è l'ID dell'impianto
      const updateData = { ...req.body };

      // Verifica che l'impianto esista
      const impianto = await ImpiantoTecnologico.findOne({
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

      if (!impianto || !impianto.asset) {
        return next(AppError.notFound('Impianto tecnologico non trovato'));
      }

      const asset = impianto.asset;

      // Verifica autorizzazione
      const canUpdate = await AssetPolicy.canUpdate(req.user, asset, updateData);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questo impianto tecnologico'));
      }

      // Separa i campi per asset e impianto
      const assetFields = [
        'code', 'description', 'marca', 'modello', 'matricola', 'stato_dotazione_id',
        'tipo_possesso_id', 'fornitore_id', 'data_ultima_manutenzione', 'data_prossima_manutenzione',
        'frequenza_manutenzione', 'stato_interventi_id', 'filiale_id', 'edificio_id', 'piano_id',
        'locale_id', 'scatola', 'scaffale', 'data_acquisto', 'active', 'notes'
      ];
      
      const impiantoFields = [
        'categoria_id', 'tipo_alimentazione_id', 'descrizione'
      ];
      
      const assetUpdate = {};
      const impiantoUpdate = {};

      // Distribuisci i campi ai rispettivi oggetti di aggiornamento
      Object.keys(updateData).forEach(key => {
        if (assetFields.includes(key)) {
          assetUpdate[key] = updateData[key];
        } else if (impiantoFields.includes(key)) {
          impiantoUpdate[key] = updateData[key];
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
        
        // Aggiorna impianto se ci sono campi
        if (Object.keys(impiantoUpdate).length > 0) {
          await impianto.update(impiantoUpdate, {
            transaction,
            userId: req.user.id
          });
        }
        
        // Commit della transazione
        await transaction.commit();

        logger.info(`Impianto tecnologico aggiornato: ${asset.code} (${asset.id}), impianto_id: ${impianto.id}`);

        // Recupera l'impianto aggiornato con le relazioni
        const updatedImpianto = await ImpiantoTecnologico.findByPk(id, {
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
              model: CategoriaImpiantoTecnologico,
              as: 'categoria',
              attributes: ['id', 'code', 'description']
            },
            {
              model: TipoAlimentazione,
              as: 'tipo_alimentazione',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Combina l'asset base con i dati dell'impianto
        const assetJSON = updatedImpianto.asset.toJSON();
        const result = {
          ...assetJSON,
          impianto_id: updatedImpianto.id,
          categoria: updatedImpianto.categoria,
          tipo_alimentazione: updatedImpianto.tipo_alimentazione,
          descrizione: updatedImpianto.descrizione
        };

        res.json({
          status: 'success',
          message: 'Impianto tecnologico aggiornato con successo',
          data: {
            impianto: result
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di un impianto tecnologico');
      next(error);
    }
  }

  /**
   * Elimina un impianto tecnologico
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteImpianto(req, res, next) {
    try {
      const { id } = req.params; // Questo ora è l'ID dell'impianto

      // Verifica che l'impianto esista
      const impianto = await ImpiantoTecnologico.findOne({
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

      if (!impianto || !impianto.asset) {
        return next(AppError.notFound('Impianto tecnologico non trovato'));
      }

      const asset = impianto.asset;

      // Verifica autorizzazione
      const canDelete = await AssetPolicy.canDelete(req.user, asset);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questo impianto tecnologico'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina la specializzazione impianto
        await impianto.destroy({
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

        logger.info(`Impianto tecnologico eliminato: ${asset.code} (${asset.id}), impianto_id: ${id}`);

        res.json({
          status: 'success',
          message: 'Impianto tecnologico eliminato con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di un impianto tecnologico');
      next(error);
    }
  }

  /**
   * Ottiene la history delle modifiche di un impianto tecnologico
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getImpiantoHistory(req, res, next) {
    try {
      const { id } = req.params; // Questo ora è l'ID dell'impianto

      // Verifica che l'impianto esista
      const impianto = await ImpiantoTecnologico.findOne({
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

      if (!impianto || !impianto.asset) {
        return next(AppError.notFound('Impianto tecnologico non trovato'));
      }

      const asset = impianto.asset;

      // Verifica autorizzazione
      const canRead = await AssetPolicy.canRead(req.user, asset);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare la history di questo impianto tecnologico'));
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
      logger.error({ err: error }, 'Errore durante il recupero della history di un impianto tecnologico');
      next(error);
    }
  }
}

module.exports = new ImpiantoController();