'use strict';

const { User, Role, Ability, Asset, Filiale } = require('../../../models');
const abilityService = require('../../../services/abilityService');
const { AppError } = require('../../../middleware/errorHandler');
const { createLogger } = require('../../../utils/logger');
const logger = createLogger('controllers:test:permission');

class PermissionTestController {
  /**
   * Verifica i permessi dell'utente corrente
   */
  async testUserPermissions(req, res, next) {
    try {
      // Ottieni l'utente dalla richiesta (impostato da authMiddleware)
      const user = req.user;
      
      if (!user) {
        return next(AppError.authentication('Utente non autenticato'));
      }
      
      // Ottieni l'ability per l'utente
      const ability = await abilityService.defineAbilityFor(user);
      
      // Costruisci un report dei permessi
      const permissionReport = {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          roles: user.roles.map(role => role.name)
        },
        permissions: {
          // Test permessi Asset
          assets: {
            read: ability.can('read', 'Asset'),
            create: ability.can('create', 'Asset'),
            update: ability.can('update', 'Asset'),
            delete: ability.can('delete', 'Asset')
          },
          // Test permessi Filiale
          filiali: {
            read: ability.can('read', 'Filiale'),
            create: ability.can('create', 'Filiale'),
            update: ability.can('update', 'Filiale'),
            delete: ability.can('delete', 'Filiale')
          },
          // Test permessi User
          users: {
            read: ability.can('read', 'User'),
            create: ability.can('create', 'User'),
            update: ability.can('update', 'User'),
            delete: ability.can('delete', 'User')
          }
        }
      };
      
      // Otteniamo anche informazioni specifiche sulle filiali accessibili
      if (ability.can('read', 'Filiale')) {
        const filiali = await Filiale.findAll({
          attributes: ['id', 'code', 'description']
        });
        
        // Filtra le filiali in base ai permessi
        const accessibleFiliali = filiali.filter(filiale => 
          ability.can('read', { ...filiale.toJSON(), __type: 'Filiale' })
        );
        
        permissionReport.accessibleFiliali = accessibleFiliali.map(f => ({
          id: f.id,
          code: f.code,
          description: f.description
        }));
      }
      
      res.status(200).json({
        status: 'success',
        data: permissionReport
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il test dei permessi');
      next(error);
    }
  }
  
  /**
   * Verifica i permessi specifici su una risorsa
   */
  async testResourcePermission(req, res, next) {
    try {
      const { resourceType, resourceId, action } = req.params;
      const user = req.user;
      
      if (!user) {
        return next(AppError.authentication('Utente non autenticato'));
      }
      
      if (!['Asset', 'Filiale', 'User'].includes(resourceType)) {
        return next(AppError.validation('Tipo di risorsa non valido'));
      }
      
      if (!['read', 'create', 'update', 'delete'].includes(action)) {
        return next(AppError.validation('Azione non valida'));
      }
      
      // Ottieni l'ability per l'utente
      const ability = await abilityService.defineAbilityFor(user);
      
      // Gestisci i diversi tipi di risorse
      let resource = null;
      let resourceModel = null;
      
      switch (resourceType) {
        case 'Asset':
          resourceModel = Asset;
          break;
        case 'Filiale':
          resourceModel = Filiale;
          break;
        case 'User':
          resourceModel = User;
          break;
      }
      
      // Se è specificato un ID, ottieni la risorsa specifica
      if (resourceId && resourceId !== 'any') {
        resource = await resourceModel.findByPk(resourceId);
        
        if (!resource) {
          return next(AppError.notFound(`${resourceType} non trovato`));
        }
        
        // Aggiungi il tipo alla risorsa per CASL
        resource = { ...resource.toJSON(), __type: resourceType };
      }
      
      // Verifica il permesso
      const hasPermission = resource 
        ? ability.can(action, resource)
        : ability.can(action, resourceType);
      
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            name: user.name,
            username: user.username
          },
          resource: resource || resourceType,
          action,
          hasPermission
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Errore durante il test dei permessi specifici');
      next(error);
    }
  }
}

module.exports = new PermissionTestController();