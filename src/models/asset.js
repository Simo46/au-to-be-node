'use strict';

const { Model } = require('sequelize');
const { createLogger } = require('../utils/logger');
const logger = createLogger('models:asset');

module.exports = (sequelize, DataTypes) => {
  class Asset extends Model {
    static associate(models) {
      // Relazione con tenant
      Asset.belongsTo(models.Tenant, { 
        foreignKey: 'tenant_id', 
        as: 'tenant' 
      });
      
      // Relazioni con location
      Asset.belongsTo(models.Filiale, { 
        foreignKey: 'filiale_id', 
        as: 'filiale' 
      });
      
      Asset.belongsTo(models.Edificio, { 
        foreignKey: 'edificio_id', 
        as: 'edificio' 
      });
      
      Asset.belongsTo(models.Piano, { 
        foreignKey: 'piano_id', 
        as: 'piano' 
      });
      
      Asset.belongsTo(models.locale, { 
        foreignKey: 'locale_id', 
        as: 'locale' 
      });
      
      // Relazioni con lookup tables
      Asset.belongsTo(models.StatoDotazione, {
        foreignKey: 'stato_dotazione_id',
        as: 'stato_dotazione'
      });
      
      Asset.belongsTo(models.TipoPossesso, {
        foreignKey: 'tipo_possesso_id',
        as: 'tipo_possesso'
      });
      
      Asset.belongsTo(models.Fornitore, {
        foreignKey: 'fornitore_id',
        as: 'fornitore'
      });
      
      Asset.belongsTo(models.StatoIntervento, {
        foreignKey: 'stato_interventi_id',
        as: 'stato_interventi'
      });
      
      // Relazioni con specializzazioni
      Asset.hasOne(models.Attrezzatura, {
        foreignKey: 'asset_id',
        as: 'attrezzatura'
      });
      
      Asset.hasOne(models.StrumentoDiMisura, {
        foreignKey: 'asset_id',
        as: 'strumento_di_misura'
      });
      
      Asset.hasOne(models.ImpiantoTecnologico, {
        foreignKey: 'asset_id',
        as: 'impianto_tecnologico'
      });
      
      // Relazione con history
      Asset.hasMany(models.AssetHistory, { 
        foreignKey: 'asset_id', 
        as: 'history' 
      });
    }
    
    // Metodo per ottenere l'oggetto specializzato in base al tipo
    async getSpecializedAsset() {
      try {
        switch (this.asset_type) {
          case 'attrezzatura':
            return await this.getAttrezzatura();
          case 'strumento_misura':
            return await this.getStrumento_di_misura();
          case 'impianto':
            return await this.getImpianto_tecnologico();
          default:
            return null;
        }
      } catch (error) {
        logger.error({ err: error }, `Failed to get specialized asset for ${this.id}`);
        throw error;
      }
    }
    
    // Definizione metodo per creare entry nella history
    async logChange(action, oldValues, newValues, userId, options = {}) {
      try {
        const historyEntry = await sequelize.models.AssetHistory.create({
          asset_id: this.id,
          tenant_id: this.tenant_id,
          user_id: userId,
          action,
          old_values: oldValues,
          new_values: newValues
        }, { 
          transaction: options.transaction 
        });
        
        logger.debug(`Created history entry ${historyEntry.id} for asset ${this.id}`);
        return historyEntry;
      } catch (error) {
        logger.error({ err: error }, `Failed to create history entry for asset ${this.id}`);
        throw error;
      }
    }
  }
  
  Asset.init({
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
    asset_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['attrezzatura', 'strumento_misura', 'impianto']]
      }
    },
    
    // Campi comuni a tutti gli asset
    marca: DataTypes.STRING,
    modello: DataTypes.STRING,
    matricola: DataTypes.STRING,
    stato_dotazione_id: {
      type: DataTypes.UUID,
      references: {
        model: 'stati_dotazione',
        key: 'id'
      }
    },
    tipo_possesso_id: {
      type: DataTypes.UUID,
      references: {
        model: 'tipi_possesso',
        key: 'id'
      }
    },
    fornitore_id: {
      type: DataTypes.UUID,
      references: {
        model: 'fornitori',
        key: 'id'
      }
    },
    
    // Manutenzione
    data_ultima_manutenzione: DataTypes.DATE,
    data_prossima_manutenzione: DataTypes.DATE,
    frequenza_manutenzione: DataTypes.INTEGER,
    stato_interventi_id: {
      type: DataTypes.UUID,
      references: {
        model: 'stati_interventi',
        key: 'id'
      }
    },
    
    // Localizzazione
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
      references: {
        model: 'edifici',
        key: 'id'
      }
    },
    piano_id: {
      type: DataTypes.UUID,
      references: {
        model: 'piani',
        key: 'id'
      }
    },
    locale_id: {
      type: DataTypes.UUID,
      references: {
        model: 'locali',
        key: 'id'
      }
    },
    
    // Dettagli logistici/inventariali
    scatola: DataTypes.STRING,
    scaffale: DataTypes.STRING,
    data_acquisto: DataTypes.DATE,
    
    notes: DataTypes.TEXT,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Asset',
    tableName: 'assets',
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
          logger.error({ err: error }, `Hook afterCreate failed for asset ${instance.id}`);
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
          logger.error({ err: error }, `Hook afterUpdate failed for asset ${instance.id}`);
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
          logger.error({ err: error }, `Hook afterDestroy failed for asset ${instance.id}`);
        }
      }
    },
    scopes: {
      // Scope per filtrare solo record attivi
      active: {
        where: {
          active: true
        }
      },
      // Scope per filtrare per tipo di asset
      attrezzature: {
        where: {
          asset_type: 'attrezzatura'
        }
      },
      strumentiMisura: {
        where: {
          asset_type: 'strumento_misura'
        }
      },
      impianti: {
        where: {
          asset_type: 'impianto'
        }
      }
    }
  });
  
  return Asset;
};