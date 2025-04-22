'use strict';

/**
 * Questo file contiene tutti i modelli per le tabelle di history
 * che tracciano le modifiche alle entità principali
 */

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Funzione factory per creare modelli di history con configurazione comune
  const createHistoryModel = (modelName, tableName, foreignKey, relationName) => {
    class HistoryModel extends Model {
      static associate(models) {
        // Relazione con il modello principale
        HistoryModel.belongsTo(models[relationName], {
          foreignKey,
          as: relationName.toLowerCase()
        });
        
        // Relazione con tenant
        HistoryModel.belongsTo(models.Tenant, {
          foreignKey: 'tenant_id',
          as: 'tenant'
        });
        
        // Relazione con l'utente che ha fatto la modifica
        HistoryModel.belongsTo(models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }
    }
    
    HistoryModel.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      [foreignKey]: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: tableName.slice(0, -8), // Rimuovi "_history" per ottenere il nome della tabella principale
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
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['create', 'update', 'delete']]
        }
      },
      old_values: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      new_values: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    }, {
      sequelize,
      modelName,
      tableName,
      underscored: true,
      timestamps: true,
      updatedAt: false, // Non necessario per le tabelle history
      indexes: [
        {
          fields: [foreignKey, 'created_at']
        }
      ]
    });
    
    return HistoryModel;
  };
  
  // Crea i modelli di history per tutte le entità principali
  const AssetHistory = createHistoryModel('AssetHistory', 'assets_history', 'asset_id', 'Asset');
  const FilialeHistory = createHistoryModel('FilialeHistory', 'filiali_history', 'filiale_id', 'Filiale');
  const EdificioHistory = createHistoryModel('EdificioHistory', 'edifici_history', 'edificio_id', 'Edificio');
  const PianoHistory = createHistoryModel('PianoHistory', 'piani_history', 'piano_id', 'Piano');
  const localeHistory = createHistoryModel('localeHistory', 'locali_history', 'locale_id', 'locale');
  
  return {
    AssetHistory,
    FilialeHistory,
    EdificioHistory,
    PianoHistory,
    localeHistory
  };
};