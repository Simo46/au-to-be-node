'use strict';

const jwt = require('jsonwebtoken');
const { createLogger } = require('../utils/logger');
const logger = createLogger('services:jwt');

/**
 * Servizio per la gestione dei token JWT
 */
class JwtService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.algorithm = 'HS256';
  }

  /**
   * Genera un token JWT per l'utente
   * @param {Object} user - Utente per cui generare il token
   * @param {Object} additionalClaims - Claim aggiuntivi da includere nel token
   * @returns {Object} - Token e refresh token generati
   */
  generateTokens(user, additionalClaims = {}) {
    try {
      // Payload base del token
      const payload = {
        sub: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        tenant_id: user.tenant_id,
        iat: Math.floor(Date.now() / 1000),
        ...additionalClaims
      };

      // Genera il token di accesso
      const token = jwt.sign(payload, this.secret, {
        expiresIn: this.expiresIn,
        algorithm: this.algorithm
      });

      // Genera il refresh token con una durata più lunga
      const refreshToken = jwt.sign(
        { 
          sub: user.id,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000)
        }, 
        this.secret, 
        {
          expiresIn: this.refreshExpiresIn,
          algorithm: this.algorithm
        }
      );

      logger.debug(`Token generato per l'utente ${user.username}`);

      return {
        token,
        refreshToken,
        expires: this.getTokenExpiration(this.expiresIn)
      };
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la generazione del token');
      throw error;
    }
  }

  /**
   * Verifica un token JWT
   * @param {string} token - Token da verificare
   * @returns {Object} - Payload decodificato
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret, { algorithms: [this.algorithm] });
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
      const decoded = jwt.verify(refreshToken, this.secret, { algorithms: [this.algorithm] });
      
      // Verifica che il token sia di tipo refresh
      if (decoded.type !== 'refresh') {
        throw new Error('Il token non è un refresh token');
      }
      
      return decoded;
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la verifica del refresh token');
      throw error;
    }
  }

  /**
   * Calcola la data di scadenza di un token
   * @param {string} expiresIn - Durata del token (es. '1d', '2h')
   * @returns {Date} - Data di scadenza
   */
  getTokenExpiration(expiresIn) {
    // Converti la stringa in secondi
    let seconds;
    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      
      switch (unit) {
        case 's': seconds = value; break;
        case 'm': seconds = value * 60; break;
        case 'h': seconds = value * 60 * 60; break;
        case 'd': seconds = value * 24 * 60 * 60; break;
        case 'w': seconds = value * 7 * 24 * 60 * 60; break;
        default: seconds = 0;
      }
    } else {
      seconds = parseInt(expiresIn);
    }
    
    // Calcola la data di scadenza
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + seconds);
    
    return expiration;
  }
}

module.exports = new JwtService();