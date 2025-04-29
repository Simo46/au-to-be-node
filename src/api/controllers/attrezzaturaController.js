'use strict';

const { Op } = require('sequelize');
const { Asset, Attrezzatura, CategoriaAttrezzatura, Fornitore, Filiale, sequelize } = require('../../models');
const AssetPolicy = require('../../policies/AssetPolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:attrezzatura');

/**
 * Controller per la gestione delle attrezzature
 */
class AttrezzaturaController {
  /**
   * Ottiene la lista delle attrezzature con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getAttrezzature(req, res, next) {
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
        super_tool,
        active
      } = req.query;

      // Calcola offset per paginazione
      const offset = (page - 1) * limit;

      // Costruisci condizioni di ricerca base per asset
      const assetWhere = {
        tenant_id: req.tenantId,
        asset_type: 'attrezzatura'
      };

      // Costruisci condizioni di ricerca per attrezzatura
      const attrezzaturaWhere = {
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
        attrezzaturaWhere.categoria_id = categoria_id;
      }

      // Applica filtro per super_tool
      if (super_tool !== undefined) {
        attrezzaturaWhere.super_tool = super_tool === 'true';
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        assetWhere.active = active === 'true';
      }

      // Se l'utente è un Responsabile Filiale, limita la vista alle attrezzature della sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        assetWhere.filiale_id = req.user.filiale_id;
      }

      // Se l'utente è un Area Manager, limita la vista alle attrezzature delle filiali della sua area
      if (req.user.hasRole('Area Manager')) {
        const managedFiliali = req.user.settings?.managed_filiali || [];
        if (managedFiliali.length > 0) {
          assetWhere.filiale_id = { [Op.in]: managedFiliali };
        }
      }

      // Ordina per campo dell'asset o dell'attrezzatura
      const order = [];
      if (['categoria_id', 'super_tool'].includes(sort_by)) {
        order.push([sequelize.literal(`"attrezzatura"."${sort_by}"`), sort_dir]);
      } else {
        order.push([sort_by, sort_dir]);
      }

      // Esegui la query con tutti i filtri
      const { count, rows: attrezzature } = await Asset.findAndCountAll({
        where: assetWhere,
        include: [
          {
            model: Attrezzatura,
            as: 'attrezzatura',
            where: attrezzaturaWhere,
            include: [
              {
                model: CategoriaAttrezzatura,
                as: 'categoria',
                attributes: ['id', 'code', 'description']
              },
              {
                model: Fornitore,
                as: 'altro_fornitore',
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

      // Filtra i dati delle attrezzature in base alle policy
      const filteredAttrezzature = await Promise.all(
        attrezzature.map(async (asset) => {
          if (await AssetPolicy.canRead(req.user, asset)) {
            const assetJSON = asset.toJSON();
            
            // Estrai i dati dell'attrezzatura per semplificare la struttura
            if (assetJSON.attrezzatura) {
              const result = {
                ...assetJSON,
                attrezzatura_id: assetJSON.attrezzatura.id, // Aggiungi l'ID dell'attrezzatura
                categoria: assetJSON.attrezzatura.categoria,
                altro_fornitore: assetJSON.attrezzatura.altro_fornitore,
                super_tool: assetJSON.attrezzatura.super_tool,
                descrizione: assetJSON.attrezzatura.descrizione
              };
              
              // Rimuovi la proprietà nidificata per evitare duplicazione
              delete result.attrezzatura;
              
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
          attrezzature: filteredAttrezzature,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero delle attrezzature');
      next(error);
    }
  }

  /**
   * Ottiene un'attrezzatura specifica per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getAttrezzaturaById(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera l'attrezzatura usando l'ID specializzato
      const attrezzatura = await Attrezzatura.findOne({
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
            model: CategoriaAttrezzatura,
            as: 'categoria',
            attributes: ['id', 'code', 'description']
          },
          {
            model: Fornitore,
            as: 'altro_fornitore',
            attributes: ['id', 'code', 'description']
          }
        ]
      });

      if (!attrezzatura || !attrezzatura.asset) {
        return next(AppError.notFound('Attrezzatura non trovata'));
      }

      // Verifica autorizzazione sull'asset base
      const canRead = await AssetPolicy.canRead(req.user, attrezzatura.asset);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questa attrezzatura'));
      }

      // Combina l'asset base con i dati dell'attrezzatura
      const assetJSON = attrezzatura.asset.toJSON();
      const result = {
        ...assetJSON,
        attrezzatura_id: attrezzatura.id,
        categoria: attrezzatura.categoria,
        altro_fornitore: attrezzatura.altro_fornitore,
        super_tool: attrezzatura.super_tool,
        descrizione: attrezzatura.descrizione
      };

      res.json({
        status: 'success',
        data: {
          attrezzatura: result
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di un\'attrezzatura specifica');
      next(error);
    }
  }

  /**
   * Crea una nuova attrezzatura completa (asset + dettagli)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createAttrezzatura(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      // Estrai i dati dalla richiesta e separa asset e attrezzatura
      const {
        // Campi specifici per attrezzatura
        categoria_id,
        altro_fornitore_id,
        super_tool,
        descrizione,
        
        // Gli altri campi sono per l'asset
        ...assetData
      } = req.body;

      // Imposta il tipo di asset
      assetData.asset_type = 'attrezzatura';

      // Verifica autorizzazione
      const canCreate = await AssetPolicy.canCreate(req.user, assetData);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare attrezzature'));
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

        // Crea la nuova attrezzatura
        const attrezzatura = await Attrezzatura.create(
          {
            asset_id: asset.id,
            tenant_id: req.tenantId,
            categoria_id,
            altro_fornitore_id,
            super_tool,
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

        logger.info(`Nuova attrezzatura creata: ${asset.code} (${asset.id}), attrezzatura_id: ${attrezzatura.id}`);

        // Recupera l'attrezzatura completa con le relazioni
        const createdAttrezzatura = await Attrezzatura.findByPk(attrezzatura.id, {
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
              model: CategoriaAttrezzatura,
              as: 'categoria',
              attributes: ['id', 'code', 'description']
            },
            {
              model: Fornitore,
              as: 'altro_fornitore',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Combina l'asset base con i dati dell'attrezzatura
        const assetJSON = createdAttrezzatura.asset.toJSON();
        const result = {
          ...assetJSON,
          attrezzatura_id: createdAttrezzatura.id,
          categoria: createdAttrezzatura.categoria,
          altro_fornitore: createdAttrezzatura.altro_fornitore,
          super_tool: createdAttrezzatura.super_tool,
          descrizione: createdAttrezzatura.descrizione
        };

        res.status(201).json({
          status: 'success',
          message: 'Attrezzatura creata con successo',
          data: {
            attrezzatura: result
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di una attrezzatura');
      next(error);
    }
  }

  /**
   * Aggiorna un'attrezzatura esistente (asset e/o dettagli)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateAttrezzatura(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params; // Questo ora è l'ID dell'attrezzatura
      const updateData = { ...req.body };

      // Verifica che l'attrezzatura esista
      const attrezzatura = await Attrezzatura.findOne({
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

      if (!attrezzatura || !attrezzatura.asset) {
        return next(AppError.notFound('Attrezzatura non trovata'));
      }

      const asset = attrezzatura.asset;

      // Verifica autorizzazione
      const canUpdate = await AssetPolicy.canUpdate(req.user, asset, updateData);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questa attrezzatura'));
      }

      // Separa i campi per asset e attrezzatura
      const assetFields = [
        'code', 'description', 'marca', 'modello', 'matricola', 'stato_dotazione_id',
        'tipo_possesso_id', 'fornitore_id', 'data_ultima_manutenzione', 'data_prossima_manutenzione',
        'frequenza_manutenzione', 'stato_interventi_id', 'filiale_id', 'edificio_id', 'piano_id',
        'locale_id', 'scatola', 'scaffale', 'data_acquisto', 'active', 'notes'
      ];
      
      const attrezzaturaFields = [
        'categoria_id', 'altro_fornitore_id', 'super_tool', 'descrizione'
      ];
      
      const assetUpdate = {};
      const attrezzaturaUpdate = {};

      // Distribuisci i campi ai rispettivi oggetti di aggiornamento
      Object.keys(updateData).forEach(key => {
        if (assetFields.includes(key)) {
          assetUpdate[key] = updateData[key];
        } else if (attrezzaturaFields.includes(key)) {
          attrezzaturaUpdate[key] = updateData[key];
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
        
        // Aggiorna attrezzatura se ci sono campi
        if (Object.keys(attrezzaturaUpdate).length > 0) {
          await attrezzatura.update(attrezzaturaUpdate, {
            transaction,
            userId: req.user.id
          });
        }
        
        // Commit della transazione
        await transaction.commit();

        logger.info(`Attrezzatura aggiornata: ${asset.code} (${asset.id}), attrezzatura_id: ${attrezzatura.id}`);

        // Recupera l'attrezzatura aggiornata con le relazioni
        const updatedAttrezzatura = await Attrezzatura.findByPk(id, {
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
              model: CategoriaAttrezzatura,
              as: 'categoria',
              attributes: ['id', 'code', 'description']
            },
            {
              model: Fornitore,
              as: 'altro_fornitore',
              attributes: ['id', 'code', 'description']
            }
          ]
        });

        // Combina l'asset base con i dati dell'attrezzatura
        const assetJSON = updatedAttrezzatura.asset.toJSON();
        const result = {
          ...assetJSON,
          attrezzatura_id: updatedAttrezzatura.id,
          categoria: updatedAttrezzatura.categoria,
          altro_fornitore: updatedAttrezzatura.altro_fornitore,
          super_tool: updatedAttrezzatura.super_tool,
          descrizione: updatedAttrezzatura.descrizione
        };

        res.json({
          status: 'success',
          message: 'Attrezzatura aggiornata con successo',
          data: {
            attrezzatura: result
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di un\'attrezzatura');
      next(error);
    }
  }

  /**
   * Elimina un'attrezzatura
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteAttrezzatura(req, res, next) {
    try {
      const { id } = req.params; // Questo ora è l'ID dell'attrezzatura

      // Verifica che l'attrezzatura esista
      const attrezzatura = await Attrezzatura.findOne({
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

      if (!attrezzatura || !attrezzatura.asset) {
        return next(AppError.notFound('Attrezzatura non trovata'));
      }

      const asset = attrezzatura.asset;

      // Verifica autorizzazione
      const canDelete = await AssetPolicy.canDelete(req.user, asset);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questa attrezzatura'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina la specializzazione attrezzatura
        await attrezzatura.destroy({
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

        logger.info(`Attrezzatura eliminata: ${asset.code} (${asset.id}), attrezzatura_id: ${id}`);

        res.json({
          status: 'success',
          message: 'Attrezzatura eliminata con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di un\'attrezzatura');
      next(error);
    }
  }

  /**
   * Ottiene la history delle modifiche di un'attrezzatura
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getAttrezzaturaHistory(req, res, next) {
    try {
      const { id } = req.params; // Questo ora è l'ID dell'attrezzatura

      // Verifica che l'attrezzatura esista
      const attrezzatura = await Attrezzatura.findOne({
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

      if (!attrezzatura || !attrezzatura.asset) {
        return next(AppError.notFound('Attrezzatura non trovata'));
      }

      const asset = attrezzatura.asset;

      // Verifica autorizzazione
      const canRead = await AssetPolicy.canRead(req.user, asset);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare la history di questa attrezzatura'));
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
      logger.error({ err: error }, 'Errore durante il recupero della history di un\'attrezzatura');
      next(error);
    }
  }
}

module.exports = new AttrezzaturaController();