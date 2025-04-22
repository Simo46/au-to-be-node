'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('strumenti_di_misura', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      asset_id: {
        type: Sequelize.UUID,
        references: {
          model: 'assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.UUID,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      
      // Campi specifici per strumenti di misura
      categoria_id: {
        type: Sequelize.UUID,
        references: {
          model: 'categorie_strumenti_misura',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      descrizione: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Descrizione aggiuntiva'
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Indici per migliorare le performance
    await queryInterface.addIndex('strumenti_di_misura', ['asset_id']);
    await queryInterface.addIndex('strumenti_di_misura', ['tenant_id']);
    await queryInterface.addIndex('strumenti_di_misura', ['categoria_id']);
    await queryInterface.addIndex('strumenti_di_misura', ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('strumenti_di_misura');
  }
};