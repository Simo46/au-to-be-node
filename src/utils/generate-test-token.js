'use strict';

require('dotenv').config();
const { User } = require('../models');
const jwtService = require('../services/jwtService');

async function generateTestToken() {
  try {
    // Cerca l'utente di test nel database
    const user = await User.findOne({
      where: { email: 'test@example.com' },
      include: ['roles']
    });

    if (!user) {
      console.error('Utente di test non trovato. Esegui prima il seeder.');
      process.exit(1);
    }

    // Genera un token per l'utente
    const tokenData = jwtService.generateTokens(user);
    
    console.log('=== Token JWT per l\'utente di test ===');
    console.log('Token:', tokenData.token);
    console.log('Refresh Token:', tokenData.refreshToken);
    console.log('Scadenza:', tokenData.expires);
    console.log('\nEsempio di utilizzo con curl:');
    console.log(`curl -X GET http://localhost:3000/api/auth-test/protected -H "Authorization: Bearer ${tokenData.token}"`);
    
    process.exit(0);
  } catch (error) {
    console.error('Errore durante la generazione del token:', error);
    process.exit(1);
  }
}

// Esegui la funzione
generateTestToken();