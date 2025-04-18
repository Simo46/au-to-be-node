const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const { createLogger } = require('../utils/logger');

const logger = createLogger('models');
const db = { sequelize };

// Carica tutti i modelli dinamicamente dalla cartella models
const loadModels = () => {
  // Ottieni tutti i file nella cartella corrente
  const files = fs.readdirSync(__dirname)
    .filter(file => 
      file.indexOf('.') !== 0 && // Ignora i file nascosti
      file !== 'index.js' &&    // Ignora questo file
      file.slice(-3) === '.js'  // Solo file JS
    );

  // Importa ogni modello
  files.forEach(file => {
    const modelPath = path.join(__dirname, file);
    const model = require(modelPath)(sequelize);
    
    // Aggiungi il modello all'oggetto db
    db[model.name] = model;
    logger.debug(`Loaded model: ${model.name}`);
  });

  // Configura le associazioni tra modelli
  Object.values(db)
    .filter(model => typeof model.associate === 'function')
    .forEach(model => {
      model.associate(db);
      logger.debug(`Set up associations for model: ${model.name}`);
    });

  logger.info('All models loaded successfully');
  return db;
};

// Esporta i modelli e la funzione di caricamento
module.exports = {
  models: loadModels(),
  sequelize
};