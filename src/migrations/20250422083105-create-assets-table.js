'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      asset_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Per discriminare il tipo di asset (attrezzatura, strumento_misura, impianto)'
      },
      
      // Campi comuni a tutti gli asset
      marca: {
        type: Sequelize.STRING,
        allowNull: true
      },
      modello: {
        type: Sequelize.STRING,
        allowNull: true
      },
      matricola: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stato_dotazione_id: {
        type: Sequelize.UUID,
        references: {
          model: 'stati_dotazione',
          key: 'id'
        },
        allowNull: true
      },
      tipo_possesso_id: {
        type: Sequelize.UUID,
        references: {
          model: 'tipi_possesso',
          key: 'id'
        },
        allowNull: true
      },
      fornitore_id: {
        type: Sequelize.UUID,
        references: {
          model: 'fornitori',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      
      // Manutenzione
      data_ultima_manutenzione: {
        type: Sequelize.DATE,
        allowNull: true
      },
      data_prossima_manutenzione: {
        type: Sequelize.DATE,
        allowNull: true
      },
      frequenza_manutenzione: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'in giorni'
      },
      stato_interventi_id: {
        type: Sequelize.UUID,
        references: {
          model: 'stati_interventi',
          key: 'id'
        },
        allowNull: true
      },
      
      // Localizzazione
      filiale_id: {
        type: Sequelize.UUID,
        references: {
          model: 'filiali',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      edificio_id: {
        type: Sequelize.UUID,
        references: {
          model: 'edifici',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      piano_id: {
        type: Sequelize.UUID,
        references: {
          model: 'piani',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      locale_id: {
        type: Sequelize.UUID,
        references: {
          model: 'locali',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      
      // Dettagli logistici/inventariali
      scatola: {
        type: Sequelize.STRING,
        allowNull: true
      },
      scaffale: {
        type: Sequelize.STRING,
        allowNull: true
      },
      data_acquisto: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Crea un indice composto per code+tenant_id per garantire uniqueness per tenant
    await queryInterface.addIndex('assets', ['code', 'tenant_id'], {
      unique: true
    });
    
    // Indici per migliorare le performance delle ricerche per tipo
    await queryInterface.addIndex('assets', ['asset_type']);
    await queryInterface.addIndex('assets', ['filiale_id']);
    await queryInterface.addIndex('assets', ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assets');
  }
};