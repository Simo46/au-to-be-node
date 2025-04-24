'use strict';

const { Op } = require('sequelize');
const { User, Role, sequelize } = require('../../models');
const jwtService = require('../../services/jwtService');
const { AppError } = require('../../middleware/errorHandler');
const { createLogger } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const logger = createLogger('controllers:auth');

/**
 * Controller per l'autenticazione
 */
class AuthController {
  /**
   * Registra un nuovo utente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async register(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { name, email, username, password, filiale_id } = req.body;

      // Verifica se l'utente esiste già
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email },
            { username }
          ]
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
          password, // Hash generato automaticamente tramite hook
          tenant_id: req.tenantId,
          filiale_id,
          active: true
        }, { 
          transaction,
          userId: req.user?.id // Per l'audit trail
        });

        // Assegna un ruolo base all'utente
        const baseRole = await Role.findOne({
          where: { name: 'Magazzino' }, // Ruolo con meno privilegi
          transaction
        });

        if (baseRole) {
          await user.addRole(baseRole, { transaction });
        } else {
          logger.warn('Ruolo base non trovato per il nuovo utente');
        }

        // Commit della transazione
        await transaction.commit();

        // Genera token
        const tokens = jwtService.generateTokens(user);

        // Aggiorna il remember_token nel database
        await user.update({ remember_token: tokens.refreshToken });

        logger.info(`Nuovo utente registrato: ${username}`);

        // Restituisci risposta
        res.status(201).json({
          status: 'success',
          message: 'Utente registrato con successo',
          data: {
            user: user.toJSON(),
            ...tokens
          }
        });
      } catch (error) {
        // Rollback in caso di errore
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la registrazione');
      next(error);
    }
  }

  /**
   * Effettua il login di un utente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async login(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { username, password } = req.body;

      // Cerca l'utente
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email: username } // Permette login con email o username
          ],
          tenant_id: req.tenantId,
          active: true
        },
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] } // Esclude gli attributi della tabella pivot
        }]
      });

      // Verifica se l'utente esiste
      if (!user) {
        logger.warn(`Tentativo di login fallito: utente ${username} non trovato`);
        return next(AppError.authentication('Credenziali non valide'));
      }

      // Verifica la password
      const isValidPassword = await user.validPassword(password);
      if (!isValidPassword) {
        logger.warn(`Tentativo di login fallito: password non valida per ${username}`);
        return next(AppError.authentication('Credenziali non valide'));
      }

      // Genera token
      const tokens = jwtService.generateTokens(user);

      // Aggiorna il remember_token nel database
      await user.update({ remember_token: tokens.refreshToken });

      logger.info(`Login effettuato con successo: ${username}`);

      // Restituisci risposta
      res.json({
        status: 'success',
        message: 'Login effettuato con successo',
        data: {
          user: user.toJSON(),
          ...tokens
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il login');
      next(error);
    }
  }

  /**
   * Effettua il logout di un utente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async logout(req, res, next) {
    try {
      // Ottieni l'ID utente dal token
      const userId = req.user.id;

      // Aggiorna il remember_token dell'utente
      await User.update(
        { remember_token: null },
        { where: { id: userId } }
      );

      logger.info(`Logout effettuato con successo: ${req.user.username}`);

      // Restituisci risposta
      res.json({
        status: 'success',
        message: 'Logout effettuato con successo'
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il logout');
      next(error);
    }
  }

  /**
   * Rinnova il token di accesso usando un refresh token
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async refreshToken(req, res, next) {
    try {
      // Validazione degli input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(AppError.validation('Errori di validazione', errors.array()));
      }

      const { refreshToken } = req.body;

      // Verifica il refresh token
      let decoded;
      try {
        decoded = jwtService.verifyRefreshToken(refreshToken);
      } catch (error) {
        logger.warn('Refresh token non valido o scaduto');
        return next(AppError.authentication('Refresh token non valido o scaduto'));
      }

      // Ottieni l'utente dal payload
      const user = await User.findOne({
        where: {
          id: decoded.sub,
          tenant_id: req.tenantId,
          active: true,
          remember_token: refreshToken
        },
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }]
      });

      // Verifica se l'utente esiste
      if (!user) {
        logger.warn(`Refresh token invalido: utente non trovato o token revocato`);
        return next(AppError.authentication('Refresh token non valido'));
      }

      // Genera nuovi token
      const tokens = jwtService.generateTokens(user);

      // Aggiorna il remember_token nel database
      await user.update({ remember_token: tokens.refreshToken });

      logger.info(`Token rinnovato per l'utente: ${user.username}`);

      // Restituisci risposta
      res.json({
        status: 'success',
        message: 'Token rinnovato con successo',
        data: tokens
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il refresh del token');
      next(error);
    }
  }

  /**
   * Verifica il token attuale e restituisce informazioni sull'utente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async me(req, res, next) {
    try {
      // Ottieni informazioni complete sull'utente
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }]
      });

      // Restituisci risposta
      res.json({
        status: 'success',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il recupero delle informazioni utente');
      next(error);
    }
  }
}

module.exports = new AuthController();