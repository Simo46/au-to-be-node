'use strict';

const { Model } = require('sequelize');
const { createLogger } = require('../utils/logger');
const logger = createLogger('models:attrezzatura');

module.exports = (sequelize, DataTypes) => {
  class Attrezzatura extends Model {
    static associate(models) {
      // Relazione con asset base
      Attrezzatura.belongsTo(models.Asset, { 
        foreignKey: 'asset_id', 
        as: 'asset'
      });
      
      // Relazione con tenant
      Attrezzatura.belongsTo(models.Tenant, { 
        foreignKey: 'tenant_id', 
        as: 'tenant' 
      });
      
      // Relazioni con lookup tables
      Attrezzatura.belongsTo(models.CategoriaAttrezzatura, {
        foreignKey: 'categoria_id',
        as: 'categoria'
      });
      
      Attrezzatura.belongsTo(models.Fornitore, {
        foreignKey: 'altro_fornitore_id',
        as: 'altro_fornitore'
      });
    }
  }
  
  Attrezzatura.init({
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
    
    // Campi specifici per attrezzature
    altro_fornitore_id: {
      type: DataTypes.UUID,
      references: {
        model: 'fornitori',
        key: 'id'
      }
    },
    super_tool: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    categoria_id: {
      type: DataTypes.UUID,
      references: {
        model: 'categorie_attrezzature',
        key: 'id'
      }
    },
    descrizione: DataTypes.STRING
    
    // Processo di prestito per ora ignorato
  }, {
    sequelize,
    modelName: 'Attrezzatura',
    tableName: 'attrezzature',
    underscored: true,
    paranoid: true, // Abilita soft delete
    hooks: {
      // Hook before create per assicurarsi che l'asset corrispondente abbia asset_type corretto
      beforeCreate: async (instance, options) => {
        try {
          if (options.asset) {
            // Se l'asset è stato passato nelle options, aggiorna il suo asset_type
            options.asset.asset_type = 'attrezzatura';
          } else if (instance.asset_id) {
            // Altrimenti, cerca l'asset e aggiorna il suo asset_type
            const asset = await sequelize.models.Asset.findByPk(instance.asset_id);
            if (asset && asset.asset_type !== 'attrezzatura') {
              asset.asset_type = 'attrezzatura';
              await asset.save({ transaction: options.transaction });
            }
          }
        } catch (error) {
          logger.error({ err: error }, `Hook beforeCreate failed for attrezzatura with asset_id ${instance.asset_id}`);
          throw error;
        }
      }
    }
  });
  
  return Attrezzatura;
};