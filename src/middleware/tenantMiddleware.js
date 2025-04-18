const { models } = require('../models');
const { createLogger } = require('../utils/logger');
const logger = createLogger('tenant-middleware');

/**
 * Middleware per identificare il tenant attuale in base al dominio della richiesta
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // Ottieni l'host dalla richiesta
    const host = req.get('host');
    
    // Per test e sviluppo, accetta un header X-Tenant-ID
    const tenantIdFromHeader = req.get('X-Tenant-ID');
    
    if (tenantIdFromHeader) {
      logger.debug(`Using tenant ID from header: ${tenantIdFromHeader}`);
      const tenant = await models.Tenant.findByPk(tenantIdFromHeader);
      
      if (tenant && tenant.active) {
        req.tenantId = tenant.id;
        req.tenant = tenant;
        return next();
      }
    }
    
    // Estrai il sottodominio
    // In produzione, l'URL potrebbe essere tenant1.app.com
    const subdomain = host.split('.')[0];
    
    logger.debug(`Looking up tenant with domain: ${subdomain}`);
    
    // Cerca il tenant nel database
    const tenant = await models.Tenant.findOne({ 
      where: { 
        domain: subdomain,
        active: true
      } 
    });
    
    if (!tenant) {
      logger.warn(`Tenant not found for domain: ${subdomain}`);
      return res.status(404).json({ 
        error: 'Tenant not found',
        message: 'The requested tenant does not exist or is inactive'
      });
    }
    
    // Aggiungi il tenant all'oggetto request
    req.tenantId = tenant.id;
    req.tenant = tenant;
    
    logger.debug(`Tenant identified: ${tenant.name} (${tenant.id})`);
    
    // Aggiungi opzioni Sequelize all'oggetto request
    req.sequelizeOptions = { 
      tenantId: tenant.id 
    };
    
    return next();
  } catch (error) {
    logger.error({ err: error }, 'Error identifying tenant');
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred while identifying the tenant'
    });
  }
};

module.exports = tenantMiddleware;