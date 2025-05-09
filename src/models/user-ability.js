'use strict';

const { Model } = require('sequelize');
const { createLogger } = require('../utils/logger');
const logger = createLogger('models:user-ability');

module.exports = (sequelize, DataTypes) => {
  class UserAbility extends Model {
    static associate(models) {
      // Relazione con utente
      UserAbility.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      // Relazione con tenant
      UserAbility.belongsTo(models.Tenant, {
        foreignKey: 'tenant_id',
        as: 'tenant'
      });
      
      // Relazione con l'utente che ha creato il permesso
      UserAbility.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      
      // Relazione con l'utente che ha aggiornato il permesso
      UserAbility.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });
    }
    
    /**
     * Verifica se il permesso è scaduto
     * @returns {boolean} True se il permesso è scaduto
     */
    isExpired() {
      if (!this.expires_at) return false;
      return new Date(this.expires_at) < new Date();
    }
  }
  
  UserAbility.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['create', 'read', 'update', 'delete', 'manage']],
          msg: 'L\'azione deve essere una di: create, read, update, delete, manage'
        }
      }
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Il soggetto è obbligatorio'
        }
      }
    },
    conditions: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    fields: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    inverted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: {
          args: [1],
          msg: 'La priorità deve essere almeno 1'
        },
        max: {
          args: [100],
          msg: 'La priorità non può superare 100'
        }
      }
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'La data di scadenza deve essere una data valida'
        },
        isAfter: {
          args: [new Date().toISOString().split('T')[0]], // Data attuale
          msg: 'La data di scadenza deve essere futura'
        }
      }
    },
    created_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'UserAbility',
    tableName: 'user_abilities',
    underscored: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['tenant_id']
      },
      {
        fields: ['action', 'subject']
      },
      {
        fields: ['expires_at']
      }
    ]
  });
  
  return UserAbility;
};