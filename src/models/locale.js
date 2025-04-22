'use strict';

const { Model } = require('sequelize');
const { createLogger } = require('../utils/logger');
const logger = createLogger('models:locale');

module.exports = (sequelize, DataTypes) => {
  class locale extends Model {
    static associate(models) {
      // Relazione con tenant
      locale.belongsTo(models.Tenant, { 
        foreignKey: 'tenant_id', 
        as: 'tenant' 
      });
      
      // Relazione con filiale
      locale.belongsTo(models.Filiale, { 
        foreignKey: 'filiale_id', 
        as: 'filiale' 
      });
      
      // Relazione con edificio
      locale.belongsTo(models.Edificio, { 
        foreignKey: 'edificio_id', 
        as: 'edificio' 
      });
      
      // Relazione con piano
      locale.belongsTo(models.Piano, { 
        foreignKey: 'piano_id', 
        as: 'piano' 
      });
      
      // Relazione con asset
      locale.hasMany(models.Asset, { 
        foreignKey: 'locale_id', 
        as: 'assets' 
      });
      
      // Relazione con history
      locale.hasMany(models.localeHistory, { 
        foreignKey: 'locale_id', 
        as: 'history' 
      });
    }
    
    // Definizione metodo per creare entry nella history
    async logChange(action, oldValues, newValues, userId, options = {}) {
      try {
        const historyEntry = await sequelize.models.localeHistory.create({
          locale_id: this.id,
          tenant_id: this.tenant_id,
          user_id: userId,
          action,
          old_values: oldValues,
          new_values: newValues
        }, { 
          transaction: options.transaction 
        });
        
        logger.debug(`Created history entry ${historyEntry.id} for locale ${this.id}`);
        return historyEntry;
      } catch (error) {
        logger.error({ err: error }, `Failed to create history entry for locale ${this.id}`);
        throw error;
      }
    }
  }
  
  locale.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id'
      }
    },
    filiale_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'filiali',
        key: 'id'
      }
    },
    edificio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'edifici',
        key: 'id'
      }
    },
    piano_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'piani',
        key: 'id'
      }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    planimetria: DataTypes.STRING,
    notes: DataTypes.TEXT,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'locale',
    tableName: 'locali',
    underscored: true,
    paranoid: true, // Abilita soft delete
    hooks: {
      // Hooks per la creazione automatica di entries nella history
      afterCreate: async (instance, options) => {
        try {
          if (!options.skipHistory) {
            await instance.logChange(
              'create', 
              null, 
              instance.toJSON(), 
              options.userId || null,
              options
            );
          }
        } catch (error) {
          logger.error({ err: error }, `Hook afterCreate failed for locale ${instance.id}`);
        }
      },
      afterUpdate: async (instance, options) => {
        try {
          if (!options.skipHistory && instance.changed()) {
            const oldValues = {};
            const newValues = {};
            const changedFields = instance.changed();
            
            changedFields.forEach(field => {
              oldValues[field] = instance.previous(field);
              newValues[field] = instance.get(field);
            });
            
            await instance.logChange(
              'update', 
              oldValues, 
              newValues, 
              options.userId || null,
              options
            );
          }
        } catch (error) {
          logger.error({ err: error }, `Hook afterUpdate failed for locale ${instance.id}`);
        }
      },
      afterDestroy: async (instance, options) => {
        try {
          if (!options.skipHistory) {
            await instance.logChange(
              'delete', 
              instance.toJSON(), 
              null, 
              options.userId || null,
              options
            );
          }
        } catch (error) {
          logger.error({ err: error }, `Hook afterDestroy failed for locale ${instance.id}`);
        }
      }
    },
    scopes: {
      // Scope per filtrare solo record attivi
      active: {
        where: {
          active: true
        }
      }
    }
  });
  
  return locale;
};