'use strict';

const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { User } = require('../models');
const { createLogger } = require('../utils/logger');
const logger = createLogger('config:passport');

/**
 * Configurazione Passport.js con strategia JWT
 * @param {Object} app - Express application
 */
module.exports = (app) => {
  // Configurazione delle opzioni per la strategia JWT
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    algorithms: ['HS256'],
    ignoreExpiration: false
  };

  // Definizione della strategia JWT
  const jwtStrategy = new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      logger.debug(`Verifica token JWT per user ID: ${payload.sub}`);

      // Cerca l'utente nel database
      const user = await User.findByPk(payload.sub, {
        include: [{
          association: 'roles',
          include: ['abilities']
        }]
      });

      // Se l'utente non esiste o non è attivo, rifiuta l'autenticazione
      if (!user || !user.active) {
        logger.warn(`Autenticazione fallita: utente ${payload.sub} non trovato o non attivo`);
        return done(null, false, { message: 'Utente non trovato o non attivo' });
      }

      // Se il token è stato emesso prima dell'ultimo aggiornamento della password, rifiuta
      if (payload.iat && user.updated_at && payload.iat < Math.floor(new Date(user.updated_at).getTime() / 1000)) {
        logger.warn(`Autenticazione fallita: token emesso prima dell'ultimo aggiornamento utente`);
        return done(null, false, { message: 'Token non più valido, necessario nuovo login' });
      }

      // Autenticazione riuscita, passa l'utente
      logger.debug(`Autenticazione riuscita per l'utente ${user.username}`);
      return done(null, user);
    } catch (error) {
      logger.error({ err: error }, 'Errore durante la verifica del token');
      return done(error);
    }
  });

  // Inizializza Passport e usa la strategia JWT
  app.use(passport.initialize());
  passport.use('jwt', jwtStrategy);

  logger.info('Passport configurato con strategia JWT');
};