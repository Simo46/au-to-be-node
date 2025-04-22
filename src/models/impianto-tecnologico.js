'use strict';

const { Model } = require('sequelize');
const { createLogger } = require('../utils/logger');
const logger = createLogger('models:impianto-tecnologico');

module.exports = (sequelize, DataTypes) => {
  class ImpiantoTecnologico extends Model {
    static associate(models) {
      // Relazione con asset base
      ImpiantoTecnologico.belongsTo(models.Asset, { 
        foreignKey: 'asset_id', 
        as: 'asset'
      });
      
      // Relazione con tenant
      ImpiantoTecnologico.belongsTo(models.Tenant, { 
        foreignKey: 'tenant_id', 
        as: 'tenant' 
      });
      
      // Relazioni con lookup tables
      ImpiantoTecnologico.belongsTo(models.TipoAlimentazione, {
        foreignKey: 'tipo_alimentazione_id',
        as: 'tipo_alimentazione'
      });
      
      ImpiantoTecnologico.belongsTo(models.CategoriaImpiantoTecnologico, {
        foreignKey: 'categoria_id',
        as: 'categoria'
      });
    }
  }
  
  ImpiantoTecnologico.init({
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
    
    // Campi specifici per impianti tecnologici
    tipo_alimentazione_id: {
      type: DataTypes.UUID,
      references: {
        model: 'tipi_alimentazione',
        key: 'id'
      }
    },
    categoria_id: {
      type: DataTypes.UUID,
      references: {
        model: 'categorie_impianti_tecnologici',
        key: 'id'
      }
    },
    descrizione: DataTypes.STRING
    
    // Processo di prestito per ora ignorato
  }, {
    sequelize,
    modelName: 'ImpiantoTecnologico',
    tableName: 'impianti_tecnologici',
    underscored: true,
    paranoid: true, // Abilita soft delete
    hooks: {
      // Hook before create per assicurarsi che l'asset corrispondente abbia asset_type corretto
      beforeCreate: async (instance, options) => {
        try {
          if (options.asset) {
            // Se l'asset è stato passato nelle options, aggiorna il suo asset_type
            options.asset.asset_type = 'impianto';
          } else if (instance.asset_id) {
            // Altrimenti, cerca l'asset e aggiorna il suo asset_type
            const asset = await sequelize.models.Asset.findByPk(instance.asset_id);
            if (asset && asset.asset_type !== 'impianto') {
              asset.asset_type = 'impianto';
              await asset.save({ transaction: options.transaction });
            }
          }
        } catch (error) {
          logger.error({ err: error }, `Hook beforeCreate failed for impianto tecnologico with asset_id ${instance.asset_id}`);
          throw error;
        }
      }
    }
  });
  
  return ImpiantoTecnologico;
};