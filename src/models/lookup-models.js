'use strict';

/**
 * Questo file contiene tutti i modelli per le tabelle di lookup
 * Come stati, categorie, tipi, ecc.
 */

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Modello per stati dotazione
  class StatoDotazione extends Model {
    static associate(models) {
      StatoDotazione.hasMany(models.Asset, {
        foreignKey: 'stato_dotazione_id',
        as: 'assets'
      });
    }
  }
  StatoDotazione.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'StatoDotazione',
    tableName: 'stati_dotazione',
    underscored: true,
    timestamps: true
  });

  // Modello per tipi possesso
  class TipoPossesso extends Model {
    static associate(models) {
      TipoPossesso.hasMany(models.Asset, {
        foreignKey: 'tipo_possesso_id',
        as: 'assets'
      });
    }
  }
  TipoPossesso.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'TipoPossesso',
    tableName: 'tipi_possesso',
    underscored: true,
    timestamps: true
  });

  // Modello per stati interventi
  class StatoIntervento extends Model {
    static associate(models) {
      StatoIntervento.hasMany(models.Asset, {
        foreignKey: 'stato_interventi_id',
        as: 'assets'
      });
    }
  }
  StatoIntervento.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'StatoIntervento',
    tableName: 'stati_interventi',
    underscored: true,
    timestamps: true
  });

  // Modello per tipi alimentazione
  class TipoAlimentazione extends Model {
    static associate(models) {
      TipoAlimentazione.hasMany(models.ImpiantoTecnologico, {
        foreignKey: 'tipo_alimentazione_id',
        as: 'impianti'
      });
    }
  }
  TipoAlimentazione.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'TipoAlimentazione',
    tableName: 'tipi_alimentazione',
    underscored: true,
    timestamps: true
  });

  // Modello base per categorie
  const categoriaInit = (model, tableName, foreignKey, relation) => {
    class Categoria extends Model {
      static associate(models) {
        if (models[relation]) {
          Categoria.hasMany(models[relation], {
            foreignKey,
            as: relation.toLowerCase() + 's'
          });
        }
        
        Categoria.belongsTo(models.Tenant, {
          foreignKey: 'tenant_id',
          as: 'tenant'
        });
      }
    }
    
    Categoria.init({
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
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      modelName: model,
      tableName,
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['code', 'tenant_id']
        }
      ]
    });
    
    return Categoria;
  };

  // Modelli per le diverse categorie
  const CategoriaAttrezzatura = categoriaInit('CategoriaAttrezzatura', 'categorie_attrezzature', 'categoria_id', 'Attrezzatura');
  const CategoriaStrumentoMisura = categoriaInit('CategoriaStrumentoMisura', 'categorie_strumenti_misura', 'categoria_id', 'StrumentoDiMisura');
  const CategoriaImpiantoTecnologico = categoriaInit('CategoriaImpiantoTecnologico', 'categorie_impianti_tecnologici', 'categoria_id', 'ImpiantoTecnologico');

  // Modello per fornitori
  class Fornitore extends Model {
    static associate(models) {
      Fornitore.belongsTo(models.Tenant, {
        foreignKey: 'tenant_id',
        as: 'tenant'
      });
      
      Fornitore.hasMany(models.Asset, {
        foreignKey: 'fornitore_id',
        as: 'assets'
      });
      
      Fornitore.hasMany(models.Attrezzatura, {
        foreignKey: 'altro_fornitore_id',
        as: 'attrezzature_come_altro_fornitore'
      });
    }
  }
  
  Fornitore.init({
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
    ragione_sociale: DataTypes.STRING,
    partita_iva: DataTypes.STRING,
    codice_fiscale: DataTypes.STRING,
    indirizzo: DataTypes.STRING,
    cap: DataTypes.STRING,
    citta: DataTypes.STRING,
    provincia: DataTypes.STRING,
    telefono: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    pec: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    sito_web: DataTypes.STRING,
    notes: DataTypes.TEXT,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Fornitore',
    tableName: 'fornitori',
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['code', 'tenant_id']
      }
    ]
  });

  return {
    StatoDotazione,
    TipoPossesso,
    StatoIntervento,
    TipoAlimentazione,
    CategoriaAttrezzatura,
    CategoriaStrumentoMisura,
    CategoriaImpiantoTecnologico,
    Fornitore
  };
};