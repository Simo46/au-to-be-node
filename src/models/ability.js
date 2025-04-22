'use strict';

const { Model } = require('sequelize');
const { createLogger } = require('../utils/logger');
const logger = createLogger('models:ability');

module.exports = (sequelize, DataTypes) => {
  class Ability extends Model {
    static associate(models) {
      // Relazione con i ruoli
      Ability.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
      });
    }
  }
  
  Ability.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'L\'azione è obbligatoria'
        },
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
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Ability',
    tableName: 'abilities',
    underscored: true,
    paranoid: true, // Soft delete
  });
  
  return Ability;
};