'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('filiali', {
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
      comune: {
        type: Sequelize.STRING,
        allowNull: false
      },
      provincia: {
        type: Sequelize.STRING,
        allowNull: false
      },
      regione: {
        type: Sequelize.STRING,
        allowNull: false
      },
      numero_civico: {
        type: Sequelize.STRING,
        allowNull: true
      },
      via: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cap: {
        type: Sequelize.STRING,
        allowNull: false
      },
      telefono: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fax: {
        type: Sequelize.STRING,
        allowNull: true
      },
      interno: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      // Referenti
      nome_referente_sede: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cognome_referente_sede: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_referente_sede: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      // Struttura e spazi
      mq_sales: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_after_sales: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_bagno: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_accettazione: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_officina: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_locale_tecnico: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_magazzino: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_area_consegna: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_piazzale_esterno: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_ufficio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      mq_area_di_vendita: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_lotto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_coperta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_netta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_utilizzata: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_utilizzata_mini: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_utilizzata_mitsubishi: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_netta_deposito_vetture: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_netta_tettoia_esterna: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_netta_esposizione: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_netta_magazzino: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      superficie_netta_officina: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      
      // Informazioni aziendali
      brand: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tipologia_contrattuale: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      scadenza_tipo_contratto: {
        type: Sequelize.DATE,
        allowNull: true
      },
      anno_costruzione: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      importo_annuo: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      locatore: {
        type: Sequelize.STRING,
        allowNull: true
      },
      licenza_di_commercio: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      // Servizi offerti
      autolavaggio: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      carrozzeria: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      officina_mezzi_pesanti: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reti_antigrandine: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      // Impianti tecnologici
      impianto_fotovoltaico: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kw_impianto_fotovoltaico: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      cabina_trasformazione: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kw_cabina_trasformazione: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      presenza_luci_led: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      presenza_scarico_notturno: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      presenza_wallbox_officina: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kw_wallbox_officina: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      presenza_wallbox_salone: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kw_wallbox_salone: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      presenza_colonnina_esterna: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kw_colonnina_esterna: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      presenza_wallbox_esterna: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kw_wallbox_esterna: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      presenza_centrale_termica: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kw_centrale_termica: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      presenza_climatizzazione: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kw_climatizzazione: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      
      // Dati catastali
      sezione: {
        type: Sequelize.STRING,
        allowNull: true
      },
      foglio: {
        type: Sequelize.STRING,
        allowNull: true
      },
      particella: {
        type: Sequelize.STRING,
        allowNull: true
      },
      subalterno: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      // Documenti collegati
      planimetria: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contratto_di_locazione: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex('filiali', ['code', 'tenant_id'], {
      unique: true
    });
    // Indice che include deleted_at per query con soft delete
    await queryInterface.addIndex('filiali', ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('filiali');
  }
};