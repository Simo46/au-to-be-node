'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attrezzature', {
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
      
      // Campi specifici per attrezzature
      altro_fornitore_id: {
        type: Sequelize.UUID,
        references: {
          model: 'fornitori',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      super_tool: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      categoria_id: {
        type: Sequelize.UUID,
        references: {
          model: 'categorie_attrezzature',
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
      
      // Processo di prestito per ora ignorato
      /* richiedo_prestito: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      attrezzo_in_prestito: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      prestito_rifiutato: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      data_prestito_rifiutato: {
        type: Sequelize.DATE,
        allowNull: true
      },
      spostamento_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      data_invio: {
        type: Sequelize.DATE,
        allowNull: true
      },
      data_spostamento: {
        type: Sequelize.DATE,
        allowNull: true
      },
      prestito_ricevuto: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      data_ricezione_prestito: {
        type: Sequelize.DATE,
        allowNull: true
      },
      richiedi_attrezzo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      data_richiesta_attrezzo: {
        type: Sequelize.DATE,
        allowNull: true
      },
      restituisci_prestito: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      data_restituzione_prestito: {
        type: Sequelize.DATE,
        allowNull: true
      },
      richiedente_id: {
        type: Sequelize.UUID,
        references: {
          model: 'filiali',
          key: 'id'
        },
        allowNull: true
      },
      prestito_terminato: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      data_termine_prestito: {
        type: Sequelize.DATE,
        allowNull: true
      },
      file_ddt_resp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_ddt_visualizz: {
        type: Sequelize.STRING,
        allowNull: true
      }, */
      
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
    await queryInterface.addIndex('attrezzature', ['asset_id']);
    await queryInterface.addIndex('attrezzature', ['tenant_id']);
    await queryInterface.addIndex('attrezzature', ['categoria_id']);
    await queryInterface.addIndex('attrezzature', ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attrezzature');
  }
};