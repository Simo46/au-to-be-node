'use strict';

const { Model } = require('sequelize');
const { createLogger } = require('../utils/logger');
const logger = createLogger('models:strumento-di-misura');

module.exports = (sequelize, DataTypes) => {
  class StrumentoDiMisura extends Model {
    static associate(models) {
      // Relazione con asset base
      StrumentoDiMisura.belongsTo(models.Asset, { 
        foreignKey: 'asset_id', 
        as: 'asset'
      });
      
      // Relazione con tenant
      StrumentoDiMisura.belongsTo(models.Tenant, { 
        foreignKey: 'tenant_id', 
        as: 'tenant' 
      });
      
      // Relazioni con lookup tables
      StrumentoDiMisura.belongsTo(models.CategoriaStrumentoMisura, {
        foreignKey: 'categoria_id',
        as: 'categoria'
      });
    }
  }
  
  StrumentoDiMisura.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    asset_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'assets',
        key: 'id'
      }
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id'
      }
    },
    
    // Campi specifici per strumenti di misura
    categoria_id: {
      type: DataTypes.UUID,
      references: {
        model: 'categorie_strumenti_misura',
        key: 'id'
      }
    },
    descrizione: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'StrumentoDiMisura',
    tableName: 'strumenti_di_misura',
    underscored: true,
    paranoid: true, // Abilita soft delete
    hooks: {
      // Hook before create per assicurarsi che l'asset corrispondente abbia asset_type corretto
      beforeCreate: async (instance, options) => {
        try {
          if (options.asset) {
            // Se l'asset è stato passato nelle options, aggiorna il suo asset_type
            options.asset.asset_type = 'strumento_misura';
          } else if (instance.asset_id) {
            // Altrimenti, cerca l'asset e aggiorna il suo asset_type
            const asset = await sequelize.models.Asset.findByPk(instance.asset_id);
            if (asset && asset.asset_type !== 'strumento_misura') {
              asset.asset_type = 'strumento_misura';
              await asset.save({ transaction: options.transaction });
            }
          }
        } catch (error) {
          logger.error({ err: error }, `Hook beforeCreate failed for strumento di misura with asset_id ${instance.asset_id}`);
          throw error;
        }
      }
    }
  });
  
  return StrumentoDiMisura;
};