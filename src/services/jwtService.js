'use strict';
// Load environment variables
require('dotenv').config();

const jwt = require('jsonwebtoken');
const { createLogger } = require('../utils/logger');
const logger = createLogger('services:jwt');

/**
 * Servizio per la gestione dei token JWT
 */
class JwtService {
  constructor() {
    this.accessSecret = process.env.JWT_SECRET || 'your-access-secret-key';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.accessExpiresIn = process.env.JWT_EXPIRES_IN || '15m'; // breve durata
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // lunga durata
    this.algorithm = 'HS256';
    logger.info(`JWT_SECRET usato da jwtService: ${this.accessSecret}`);

  }

  /**
   * Genera access e refresh token
   * @param {Object} user - Utente per cui generare i token
   * @param {Object} additionalClaims - Claim aggiuntivi
   * @returns {Object} - accessToken, refreshToken e data di scadenza
   */
  generateTokens(user, additionalClaims = {}) {
    try {
      const now = Math.floor(Date.now() / 1000);

      // Payload per access token
      const accessPayload = {
        sub: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        tenant_id: user.tenant_id,
        iat: now,
        ...additionalClaims
      };

      const accessToken = jwt.sign(accessPayload, this.accessSecret, {
        expiresIn: this.accessExpiresIn,
        algorithm: this.algorithm
      });

      // Payload per refresh token
      const refreshPayload = {
        sub: user.id,
        type: 'refresh',
        iat: now
      };

      const refreshToken = jwt.sign(refreshPayload, this.refreshSecret, {
        expiresIn: this.refreshExpiresIn,
        algorithm: this.algorithm
      });

      logger.debug(`Token generati per l'utente ${user.username}`);

      return {
        accessToken,
        refreshToken,
        expires: this.getTokenExpiration(this.accessExpiresIn)
      };
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la generazione dei token');
      throw error;
    }
  }

  /**
   * Verifica un access token
   * @param {string} token - Access token da verificare
   * @returns {Object} - Payload decodificato
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.accessSecret, { algorithms: [this.algorithm] });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la verifica del token');
      throw error;
    }
  }

  /**
   * Verifica un refresh token
   * @param {string} refreshToken - Refresh token da verificare
   * @returns {Object} - Payload decodificato
   */
  verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret, { algorithms: [this.algorithm] });

      if (decoded.type !== 'refresh') {
        throw new Error('Il token non è un refresh token valido');
      }

      return decoded;
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la verifica del refresh token');
      throw error;
    }
  }

  /**
   * Calcola la data di scadenza di un token
   * @param {string} expiresIn - Durata del token (es. '15m', '1d')
   * @returns {Date} - Data di scadenza
   */
  getTokenExpiration(expiresIn) {
    let seconds;
    const match = expiresIn.match(/^(\d+)([smhdw])$/);

    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case 's': seconds = value; break;
        case 'm': seconds = value * 60; break;
        case 'h': seconds = value * 3600; break;
        case 'd': seconds = value * 86400; break;
        case 'w': seconds = value * 604800; break;
        default: seconds = 0;
      }
    } else {
      seconds = parseInt(expiresIn);
    }

    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + seconds);
    return expiration;
  }
}

module.exports = new JwtService();
