'use strict';

const { Op } = require('sequelize');
const { Filiale, User, sequelize } = require('../../models');
const FilialePolicy = require('../../policies/FilialePolicy');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:filiale');

/**
 * Controller per la gestione delle filiali
 */
class FilialeController {
  /**
   * Ottiene la lista delle filiali con supporto per filtri e paginazione
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getFiliali(req, res, next) {
    try {
      // Estrai parametri di query
      const {
        page = 1,
        limit = 10,
        sort_by = 'code', 
        sort_dir = 'ASC',
        search,
        comune,
        provincia,
        regione,
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
          { comune: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Applica filtro per comune
      if (comune) {
        where.comune = { [Op.iLike]: `%${comune}%` };
      }

      // Applica filtro per provincia
      if (provincia) {
        where.provincia = { [Op.iLike]: `%${provincia}%` };
      }

      // Applica filtro per regione
      if (regione) {
        where.regione = { [Op.iLike]: `%${regione}%` };
      }

      // Applica filtro per stato attivo/inattivo
      if (active !== undefined) {
        where.active = active === 'true';
      }

      // Se l'utente è un Area Manager, limita la vista alle filiali della sua area
      if (req.user.hasRole('Area Manager')) {
        const managedFiliali = req.user.settings?.managed_filiali || [];
        if (managedFiliali.length > 0) {
          where.id = { [Op.in]: managedFiliali };
        }
      }
      
      // Se l'utente è un Responsabile Filiale, limita la vista alla sua filiale
      if (req.user.hasRole('Responsabile Filiale') && req.user.filiale_id) {
        where.id = req.user.filiale_id;
      }

      // Esegui la query con tutti i filtri
      const { count, rows: filiali } = await Filiale.findAndCountAll({
        where,
        order: [[sort_by, sort_dir]],
        limit: parseInt(limit),
        offset
      });

      // Per ogni filiale, trova il responsabile (utente con ruolo Responsabile Filiale)
      const filialiIDs = filiali.map(filiale => filiale.id);
      
      // Query separata per trovare i responsabili
      const responsabiliMap = {};
      if (filialiIDs.length > 0) {
        try {
          // Utilizziamo una query raw più controllata per trovare i responsabili
          const result = await sequelize.query(`
            SELECT u.id, u.name, u.email, u.filiale_id
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.filiale_id IN (:filialiIDs)
            AND r.name = 'Responsabile Filiale'
            AND u.active = true
            AND u.tenant_id = :tenantId
          `, {
            replacements: { 
              filialiIDs,
              tenantId: req.tenantId
            },
            type: sequelize.QueryTypes.SELECT
          });
          
          // Debug
          logger.debug(`Responsabili trovati: ${JSON.stringify(result)}`);
          
          // Creiamo la mappa direttamente dai risultati
          //const responsabiliList = Array.isArray(result) ? result : [];
          if (Array.isArray(result)) {
            result.forEach(resp => {
              if (resp && resp.filiale_id) {
                responsabiliMap[resp.filiale_id] = {
                  id: resp.id,
                  name: resp.name,
                  email: resp.email
                };
              }
            });
          }
        } catch (error) {
          logger.error({ err: error }, 'Errore durante il recupero dei responsabili');
        }
      }

      // Filtra i dati delle filiali in base alle policy e aggiungi il responsabile
      const filteredFiliali = await Promise.all(
        filiali.map(async (filiale) => {
          if (await FilialePolicy.canRead(req.user, filiale)) {
            const filialeJSON = filiale.toJSON();
            
            // Aggiungi il responsabile se presente
            if (responsabiliMap[filiale.id]) {
              filialeJSON.responsabile = {
                id: responsabiliMap[filiale.id].id,
                name: responsabiliMap[filiale.id].name,
                email: responsabiliMap[filiale.id].email
              };
            }
            
            return filialeJSON;
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

      // Calcola informazioni sulla paginazione
      const totalPages = Math.ceil(count / limit);

      res.json({
        status: 'success',
        data: {
          filiali: filteredFiliali,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages
          }
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero delle filiali');
      next(error);
    }
  }

  /**
   * Ottiene una filiale specifica per ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getFilialeById(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera la filiale
      const filiale = await Filiale.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!filiale) {
        return next(AppError.notFound('Filiale non trovata'));
      }

      // Verifica autorizzazione
      const canRead = await FilialePolicy.canRead(req.user, filiale);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questa filiale'));
      }

      // Converte l'oggetto filiale in JSON per la manipolazione
      const filialeJSON = filiale.toJSON();

      // Trova il responsabile (utente con ruolo Responsabile Filiale)
      let responsabile = null;
      try {
        const responsabili = await sequelize.query(`
          SELECT u.id, u.name, u.email
          FROM users u
          JOIN user_roles ur ON u.id = ur.user_id
          JOIN roles r ON ur.role_id = r.id
          WHERE u.filiale_id = :filialeId
          AND r.name = 'Responsabile Filiale'
          AND u.active = true
          AND u.tenant_id = :tenantId
          LIMIT 1
        `, {
          replacements: { 
            filialeId: id,
            tenantId: req.tenantId
          },
          type: sequelize.QueryTypes.SELECT
        });
        
        // Prendi il primo risultato se esiste
        if (Array.isArray(responsabili) && responsabili.length > 0) {
          responsabile = responsabili[0];
        }
      } catch (error) {
        logger.error({ err: error }, 'Errore durante il recupero del responsabile');
      }

      // Aggiungi il responsabile se trovato
      if (responsabile) {
        filialeJSON.responsabile = {
          id: responsabile.id,
          name: responsabile.name,
          email: responsabile.email
        };
      }

      res.json({
        status: 'success',
        data: {
          filiale: filialeJSON
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero di una filiale specifica');
      next(error);
    }
  }

  /**
   * Crea una nuova filiale
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async createFiliale(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      // Estrai i dati dalla richiesta
      const filialeData = { ...req.body };

      // Verifica autorizzazione
      const canCreate = await FilialePolicy.canCreate(req.user, filialeData);
      if (!canCreate) {
        return next(AppError.authorization('Non autorizzato a creare filiali'));
      }

      // Verifica se esiste già una filiale con lo stesso codice per questo tenant
      const existingFiliale = await Filiale.findOne({
        where: {
          code: filialeData.code,
          tenant_id: req.tenantId
        }
      });

      if (existingFiliale) {
        return next(AppError.conflict(`Esiste già una filiale con il codice ${filialeData.code}`));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Crea la nuova filiale
        const filiale = await Filiale.create(
          {
            ...filialeData,
            tenant_id: req.tenantId
          },
          {
            transaction,
            userId: req.user.id
          }
        );

        // Commit della transazione
        await transaction.commit();

        logger.info(`Nuova filiale creata: ${filiale.code} (${filiale.id})`);

        // Restituisci la filiale creata
        res.status(201).json({
          status: 'success',
          message: 'Filiale creata con successo',
          data: {
            filiale: filiale.toJSON()
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la creazione di una filiale');
      next(error);
    }
  }

  /**
   * Aggiorna una filiale esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async updateFiliale(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { id } = req.params;
      const updateData = { ...req.body };

      // Recupera la filiale da aggiornare
      const filiale = await Filiale.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!filiale) {
        return next(AppError.notFound('Filiale non trovata'));
      }

      // Verifica autorizzazione
      const canUpdate = await FilialePolicy.canUpdate(req.user, filiale, updateData);
      if (!canUpdate) {
        return next(AppError.authorization('Non autorizzato a modificare questa filiale'));
      }

      // Verifica se il nuovo codice è già in uso (se viene modificato)
      if (updateData.code && updateData.code !== filiale.code) {
        const existingFiliale = await Filiale.findOne({
          where: {
            code: updateData.code,
            tenant_id: req.tenantId,
            id: { [Op.ne]: id }
          }
        });

        if (existingFiliale) {
          return next(AppError.conflict(`Esiste già una filiale con il codice ${updateData.code}`));
        }
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        logger.info(updateData, "Dati che mando in aggiornamento");
        logger.info(typeof updateData, "Tipo di updateData");
        // Aggiorna la filiale
        await filiale.update(updateData, {
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Filiale aggiornata: ${filiale.code} (${filiale.id})`);

        // Recupera la filiale aggiornata
        const updatedFiliale = await Filiale.findByPk(id);
        const filialeJSON = updatedFiliale.toJSON();

        // Trova il responsabile (utente con ruolo Responsabile Filiale)
        let responsabile = null;
        try {
          const responsabili = await sequelize.query(`
            SELECT u.id, u.name, u.email
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.filiale_id = :filialeId
            AND r.name = 'Responsabile Filiale'
            AND u.active = true
            AND u.tenant_id = :tenantId
            LIMIT 1
          `, {
            replacements: { 
              filialeId: id,
              tenantId: req.tenantId
            },
            type: sequelize.QueryTypes.SELECT
          });
          
          // Prendi il primo risultato se esiste
          if (Array.isArray(responsabili) && responsabili.length > 0) {
            responsabile = responsabili[0];
          }
        } catch (error) {
          logger.error({ err: error }, 'Errore durante il recupero del responsabile');
        }

        // Aggiungi il responsabile se trovato
        if (responsabile) {
          filialeJSON.responsabile = {
            id: responsabile.id,
            name: responsabile.name,
            email: responsabile.email
          };
        }

        // Restituisci la filiale aggiornata
        res.json({
          status: 'success',
          message: 'Filiale aggiornata con successo',
          data: {
            filiale: filialeJSON
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'aggiornamento di una filiale');
      next(error);
    }
  }

  /**
   * Elimina una filiale
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async deleteFiliale(req, res, next) {
    try {
      const { id } = req.params;

      // Recupera la filiale da eliminare
      const filiale = await Filiale.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!filiale) {
        return next(AppError.notFound('Filiale non trovata'));
      }

      // Verifica autorizzazione
      const canDelete = await FilialePolicy.canDelete(req.user, filiale);
      if (!canDelete) {
        return next(AppError.authorization('Non autorizzato a eliminare questa filiale'));
      }

      // Verifica se esistono dipendenze (es. edifici, asset, utenti associati)
      // Qui implementi la logica di verifica delle dipendenze
      const hasEdifici = await sequelize.models.Edificio.count({
        where: { filiale_id: id }
      });

      if (hasEdifici > 0) {
        return next(AppError.conflict('Impossibile eliminare la filiale: esistono edifici associati'));
      }

      const hasAssets = await sequelize.models.Asset.count({
        where: { filiale_id: id }
      });

      if (hasAssets > 0) {
        return next(AppError.conflict('Impossibile eliminare la filiale: esistono asset associati'));
      }

      const hasUsers = await sequelize.models.User.count({
        where: { filiale_id: id }
      });

      if (hasUsers > 0) {
        return next(AppError.conflict('Impossibile eliminare la filiale: esistono utenti associati'));
      }

      // Inizia una transazione
      const transaction = await sequelize.transaction();

      try {
        // Elimina la filiale (soft delete, grazie a paranoid: true nel modello)
        await filiale.destroy({
          transaction,
          userId: req.user.id
        });

        // Commit della transazione
        await transaction.commit();

        logger.info(`Filiale eliminata: ${filiale.code} (${filiale.id})`);

        // Restituisci risposta
        res.json({
          status: 'success',
          message: 'Filiale eliminata con successo'
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante l\'eliminazione di una filiale');
      next(error);
    }
  }

  /**
   * Ottiene la history delle modifiche di una filiale
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async getFilialeHistory(req, res, next) {
    try {
      const { id } = req.params;

      // Verifica che la filiale esista
      const filiale = await Filiale.findOne({
        where: {
          id,
          tenant_id: req.tenantId
        }
      });

      if (!filiale) {
        return next(AppError.notFound('Filiale non trovata'));
      }

      // Verifica autorizzazione
      const canRead = await FilialePolicy.canRead(req.user, filiale);
      if (!canRead) {
        return next(AppError.authorization('Non autorizzato a visualizzare questa filiale'));
      }

      // Recupera la history della filiale
      const history = await sequelize.models.FilialeHistory.findAll({
        where: { filiale_id: id },
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
      logger.error({ err: error }, 'Errore durante il recupero della history di una filiale');
      next(error);
    }
  }
}

module.exports = new FilialeController();