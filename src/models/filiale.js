'use strict';

const { Model } = require('sequelize');
const { createLogger } = require('../utils/logger');
const logger = createLogger('models:filiale');

module.exports = (sequelize, DataTypes) => {
  class Filiale extends Model {
    static associate(models) {
      // Relazione con tenant
      Filiale.belongsTo(models.Tenant, { 
        foreignKey: 'tenant_id', 
        as: 'tenant' 
      });
      
      // Relazioni con location
      Filiale.hasMany(models.Edificio, { 
        foreignKey: 'filiale_id', 
        as: 'edifici' 
      });
      
      // Relazione con asset
      Filiale.hasMany(models.Asset, { 
        foreignKey: 'filiale_id', 
        as: 'assets' 
      });
      
      // Relazione con history
      Filiale.hasMany(models.FilialeHistory, { 
        foreignKey: 'filiale_id', 
        as: 'history' 
      });
      
      // Relazione con gli utenti della filiale
      Filiale.hasMany(models.User, {
        foreignKey: 'filiale_id',
        as: 'utenti'
      });
      
      // Relazione con gli utenti della filiale
      // Non definiamo una relazione specifica per il responsabile qui
      // Lo gestiremo a livello di controller con query specifica
    }
    
    // Definizione metodo per creare entry nella history
    async logChange(action, oldValues, newValues, userId, options = {}) {
      try {
        const historyEntry = await sequelize.models.FilialeHistory.create({
          filiale_id: this.id,
          tenant_id: this.tenant_id,
          user_id: userId,
          action,
          old_values: oldValues,
          new_values: newValues
        }, { 
          transaction: options.transaction 
        });
        
        logger.debug(`Created history entry ${historyEntry.id} for filiale ${this.id}`);
        return historyEntry;
      } catch (error) {
        logger.error({ err: error }, `Failed to create history entry for filiale ${this.id}`);
        throw error;
      }
    }
  }
  
  Filiale.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id'
      }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    comune: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    provincia: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    regione: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    numero_civico: DataTypes.STRING,
    via: DataTypes.STRING,
    cap: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    telefono: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    fax: DataTypes.STRING,
    interno: DataTypes.STRING,
    
    // Referenti
    nome_referente_sede: DataTypes.STRING,
    cognome_referente_sede: DataTypes.STRING,
    email_referente_sede: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    
    // Struttura e spazi
    mq_sales: DataTypes.DECIMAL(10, 2),
    mq_after_sales: DataTypes.DECIMAL(10, 2),
    mq_bagno: DataTypes.DECIMAL(10, 2),
    mq_accettazione: DataTypes.DECIMAL(10, 2),
    mq_officina: DataTypes.DECIMAL(10, 2),
    mq_locale_tecnico: DataTypes.DECIMAL(10, 2),
    mq_magazzino: DataTypes.DECIMAL(10, 2),
    mq_area_consegna: DataTypes.DECIMAL(10, 2),
    mq_piazzale_esterno: DataTypes.DECIMAL(10, 2),
    mq_ufficio: DataTypes.DECIMAL(10, 2),
    mq_area_di_vendita: DataTypes.DECIMAL(10, 2),
    superficie_lotto: DataTypes.DECIMAL(10, 2),
    superficie_coperta: DataTypes.DECIMAL(10, 2),
    superficie_netta: DataTypes.DECIMAL(10, 2),
    superficie_utilizzata: DataTypes.DECIMAL(10, 2),
    superficie_utilizzata_mini: DataTypes.DECIMAL(10, 2),
    superficie_utilizzata_mitsubishi: DataTypes.DECIMAL(10, 2),
    superficie_netta_deposito_vetture: DataTypes.DECIMAL(10, 2),
    superficie_netta_tettoia_esterna: DataTypes.DECIMAL(10, 2),
    superficie_netta_esposizione: DataTypes.DECIMAL(10, 2),
    superficie_netta_magazzino: DataTypes.DECIMAL(10, 2),
    superficie_netta_officina: DataTypes.DECIMAL(10, 2),
    
    // Informazioni aziendali
    brand: DataTypes.JSONB,
    tipologia_contrattuale: DataTypes.INTEGER,
    scadenza_tipo_contratto: DataTypes.DATE,
    anno_costruzione: DataTypes.INTEGER,
    importo_annuo: DataTypes.DECIMAL(10, 2),
    locatore: DataTypes.STRING,
    licenza_di_commercio: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Servizi offerti
    autolavaggio: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    carrozzeria: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    officina_mezzi_pesanti: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reti_antigrandine: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Impianti tecnologici
    impianto_fotovoltaico: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kw_impianto_fotovoltaico: DataTypes.DECIMAL(10, 2),
    cabina_trasformazione: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kw_cabina_trasformazione: DataTypes.DECIMAL(10, 2),
    presenza_luci_led: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    presenza_scarico_notturno: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    presenza_wallbox_officina: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kw_wallbox_officina: DataTypes.DECIMAL(10, 2),
    presenza_wallbox_salone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kw_wallbox_salone: DataTypes.DECIMAL(10, 2),
    presenza_colonnina_esterna: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kw_colonnina_esterna: DataTypes.DECIMAL(10, 2),
    presenza_wallbox_esterna: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kw_wallbox_esterna: DataTypes.DECIMAL(10, 2),
    presenza_centrale_termica: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kw_centrale_termica: DataTypes.DECIMAL(10, 2),
    presenza_climatizzazione: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kw_climatizzazione: DataTypes.DECIMAL(10, 2),
    
    // Dati catastali
    sezione: DataTypes.STRING,
    foglio: DataTypes.STRING,
    particella: DataTypes.STRING,
    subalterno: DataTypes.STRING,
    
    // Documenti collegati
    planimetria: DataTypes.STRING,
    contratto_di_locazione: DataTypes.STRING,
    
    notes: DataTypes.TEXT,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Filiale',
    tableName: 'filiali',
    underscored: true,
    paranoid: true, // Abilita soft delete
    hooks: {
      // Hooks per la creazione automatica di entries nella history
      afterCreate: async (instance, options) => {
        try {
          if (!options.skipHistory) {
            await instance.logChange(
              'create', 
              null, 
              instance.toJSON(), 
              options.userId || null,
              options
            );
          }
        } catch (error) {
          logger.error({ err: error }, `Hook afterCreate failed for filiale ${instance.id}`);
        }
      },
      afterUpdate: async (instance, options) => {
        try {
          if (!options.skipHistory && instance.changed()) {
            const oldValues = {};
            const newValues = {};
            const changedFields = instance.changed();
            
            changedFields.forEach(field => {
              oldValues[field] = instance.previous(field);
              newValues[field] = instance.get(field);
            });
            
            await instance.logChange(
              'update', 
              oldValues, 
              newValues, 
              options.userId || null,
              options
            );
          }
        } catch (error) {
          logger.error({ err: error }, `Hook afterUpdate failed for filiale ${instance.id}`);
        }
      },
      afterDestroy: async (instance, options) => {
        try {
          if (!options.skipHistory) {
            await instance.logChange(
              'delete', 
              instance.toJSON(), 
              null, 
              options.userId || null,
              options
            );
          }
        } catch (error) {
          logger.error({ err: error }, `Hook afterDestroy failed for filiale ${instance.id}`);
        }
      }
    },
    scopes: {
      // Scope per filtrare solo record attivi
      active: {
        where: {
          active: true
        }
      }
    }
  });
  
  return Filiale;
};