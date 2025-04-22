# Struttura del Database e Modelli Dati

Questa guida fornisce una panoramica della struttura del database e dei modelli dati in au-to-be-node, inclusa la gerarchia delle entità, le relazioni e i pattern implementati.

## Architettura Multi-Tenant

Il sistema è progettato con un'architettura multi-tenant che consente di separare completamente i dati di diversi clienti:

- **Tabella `tenants`**: Contiene la configurazione di base per ogni cliente
- **Campo `tenant_id`**: Presente in ogni tabella di dati per isolare i record tra tenant

## Entità di Business Principali

### Gerarchia delle Location

Il sistema implementa una gerarchia di location con relazione 1:N tra i livelli:

```
Filiale → Edificio → Piano → Locale
```

- **Filiale**: Sede/filiale (es. concessionaria)
- **Edificio**: Struttura fisica all'interno di una filiale
- **Piano**: Livello di un edificio
- **Locale**: Stanza/ambiente all'interno di un piano

Ogni entità nella gerarchia ha una relazione diretta con tutte le entità superiori (es. un Locale ha riferimento a Piano, Edificio e Filiale).

### Gerarchia degli Asset

Il sistema utilizza un pattern di ereditarietà per gli asset con una tabella base e tabelle specializzate:

```
Asset (base)
  ├── Attrezzatura
  ├── StrumentoDiMisura
  └── ImpiantoTecnologico
```

- **Asset**: Contiene i campi comuni a tutti i tipi di asset
- **Tabelle specifiche**: Contengono campi specializzati per ogni tipo di asset
- **Campo `asset_type`**: Discrimina il tipo di asset nella tabella base

## Schema Relazionale

### Tabelle Principali

| Tabella | Descrizione | Chiavi Esterne Principali |
|---------|-------------|---------------------------|
| `tenants` | Clienti del sistema | - |
| `users` | Utenti del sistema | `tenant_id` |
| `roles` | Ruoli utente | - |
| `user_roles` | Associazione utenti-ruoli | `user_id`, `role_id` |
| `abilities` | Permessi specifici | `role_id` |
| `filiali` | Sedi/filiali | `tenant_id` |
| `edifici` | Edifici nelle filiali | `tenant_id`, `filiale_id` |
| `piani` | Piani degli edifici | `tenant_id`, `filiale_id`, `edificio_id` |
| `locali` | Locali nei piani | `tenant_id`, `filiale_id`, `edificio_id`, `piano_id` |
| `assets` | Tabella base degli asset | `tenant_id`, `filiale_id`, `edificio_id`, `piano_id`, `locale_id` |
| `attrezzature` | Specializzazione attrezzature | `tenant_id`, `asset_id` |
| `strumenti_di_misura` | Specializzazione strumenti | `tenant_id`, `asset_id` |
| `impianti_tecnologici` | Specializzazione impianti | `tenant_id`, `asset_id` |

### Tabelle di Lookup/Configurazione

| Tabella | Descrizione |
|---------|-------------|
| `stati_dotazione` | Stati possibili degli asset (In uso/In manutenzione/Dismesso) |
| `tipi_possesso` | Modalità di possesso degli asset (Proprietà/Leasing/etc.) |
| `stati_interventi` | Stati possibili degli interventi di manutenzione |
| `tipi_alimentazione` | Tipi di alimentazione per impianti tecnologici |
| `categorie_attrezzature` | Categorizzazione delle attrezzature |
| `categorie_strumenti_misura` | Categorizzazione degli strumenti di misura |
| `categorie_impianti_tecnologici` | Categorizzazione degli impianti |
| `fornitori` | Anagrafica fornitori |

### Tabelle di History

| Tabella | Tabella Principale Collegata |
|---------|------------------------------|
| `assets_history` | `assets` |
| `filiali_history` | `filiali` |
| `edifici_history` | `edifici` |
| `piani_history` | `piani` |
| `locali_history` | `locali` |

## Modelli Sequelize

### Pattern Implementati

#### 1. Ereditarietà con Hooks

Il pattern di ereditarietà degli asset è implementato attraverso hooks Sequelize:

```javascript
// Hook in attrezzatura.js
beforeCreate: async (instance, options) => {
  if (options.asset) {
    options.asset.asset_type = 'attrezzatura';
  } else if (instance.asset_id) {
    const asset = await sequelize.models.Asset.findByPk(instance.asset_id);
    if (asset && asset.asset_type !== 'attrezzatura') {
      asset.asset_type = 'attrezzatura';
      await asset.save({ transaction: options.transaction });
    }
  }
}
```

Questo garantisce che il tipo di asset sia sempre correttamente impostato.

#### 2. Soft Delete (Paranoid)

I modelli principali utilizzano il flag `paranoid: true` per implementare il soft delete:

```javascript
Asset.init({
  // ... fields
}, {
  sequelize,
  modelName: 'Asset',
  tableName: 'assets',
  underscored: true,
  paranoid: true  // Abilita soft delete
});
```

Questo fa sì che i record non vengano effettivamente eliminati dal database, ma venga semplicemente impostato il campo `deleted_at`.

#### 3. Modelli Raggruppati

Per maggiore modularità, abbiamo raggruppato modelli simili in file comuni:

- `lookup-models.js`: Contiene tutti i modelli per le tabelle di lookup
- `history-models.js`: Contiene tutti i modelli per le tabelle di history

#### 4. Metodi di Utilità nei Modelli

I modelli implementano metodi utili per operazioni comuni:

```javascript
// In asset.js
async getSpecializedAsset() {
  switch (this.asset_type) {
    case 'attrezzatura':
      return await this.getAttrezzatura();
    case 'strumento_misura':
      return await this.getStrumentoDiMisura();
    case 'impianto':
      return await this.getImpiantoTecnologico();
    default:
      return null;
  }
}
```

### Relazioni Chiave

```javascript
// Filiale → Edificio → Piano → Locale
Filiale.hasMany(models.Edificio, { foreignKey: 'filiale_id', as: 'edifici' });
Edificio.belongsTo(models.Filiale, { foreignKey: 'filiale_id', as: 'filiale' });
Edificio.hasMany(models.Piano, { foreignKey: 'edificio_id', as: 'piani' });
// ...e così via

// Asset → Specializzazione
Asset.hasOne(models.Attrezzatura, { foreignKey: 'asset_id', as: 'attrezzatura' });
Attrezzatura.belongsTo(models.Asset, { foreignKey: 'asset_id', as: 'asset' });
// ...e così via per le altre specializzazioni
```

## Scopes e Query Comuni

### Scopes Predefiniti

I modelli definiscono scopes utili per query comuni:

```javascript
// In asset.js
scopes: {
  // Scope per filtrare solo record attivi
  active: {
    where: {
      active: true
    }
  },
  // Scope per filtrare per tipo di asset
  attrezzature: {
    where: {
      asset_type: 'attrezzatura'
    }
  }
  // ...altri scopes
}
```

### Pattern per Query Multi-tenant

Quando si sviluppano query, seguire sempre questo pattern:

```javascript
// Esempio: ottenere assets per un tenant specifico
const assets = await Asset.findAll({
  where: { 
    tenant_id: req.tenant.id,
    // altre condizioni...
  },
  include: [
    { model: sequelize.models.Attrezzatura, as: 'attrezzatura' }
    // altri include...
  ]
});
```

## Vincoli e Validazioni

### Validazioni Sequelize

I modelli implementano validazioni sia sul database che a livello ORM:

```javascript
// Esempio di validazioni in filiale.js
comune: {
  type: DataTypes.STRING,
  allowNull: false,
  validate: {
    notEmpty: true
  }
},
email: {
  type: DataTypes.STRING,
  validate: {
    isEmail: true
  }
}
```

### Vincoli di Unicità

I vincoli di unicità sono implementati con indici compositi per supportare il multi-tenancy:

```javascript
// Nelle migrazioni
await queryInterface.addIndex('filiali', ['code', 'tenant_id'], {
  unique: true
});
```

## UUID come Chiavi Primarie

Tutte le tabelle utilizzano UUID come chiavi primarie anziché ID interi sequenziali. Ecco perché e come:

### Vantaggi

- **Sicurezza**: Non esponono informazioni sulla numerosità dei record
- **Distribuzione**: Facilitano operazioni distribuite senza conflitti
- **Immutabilità**: Non cambiano quando i record vengono spostati
- **Previsibilità**: Possono essere generati prima dell'inserimento

### Implementazione

```javascript
// Nelle definizioni dei modelli
id: {
  type: DataTypes.UUID,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true
}
```

## Estendere il Modello Dati

Quando devi estendere il modello dati, segui queste linee guida:

1. **Usa le migrazioni** per modificare lo schema:
   ```bash
   docker compose exec api npx sequelize-cli migration:generate --name add-new-entity
   ```

2. **Mantieni la coerenza** con le convenzioni esistenti:
   - Nomi delle tabelle al plurale e snake_case
   - Campi in snake_case
   - Aggiungi sempre `tenant_id` per il multi-tenancy
   - Aggiungi `created_by` e `updated_by` per l'audit trail
   - Aggiungi vincoli di unicità contestuali al tenant
   - Usa `paranoid: true` per soft delete ove appropriato

3. **Aggiorna le tabelle di history** se necessario:
   - Se l'entità è importante ed è soggetta ad audit completo
   - Aggiungi la relativa tabella `_history`
   - Aggiorna anche la funzione trigger

4. **Definisci chiaramente le relazioni** nei modelli Sequelize:
   - Specifica `as` e `foreignKey` esplicitamente
   - Implementa cascate appropriate (onDelete, onUpdate)

## Prestazioni e Ottimizzazione

### Indici

Indici importanti sono definiti nelle migrazioni:

- Chiavi esterne
- Campi di ricerca comuni
- Combinazioni di campi usati nelle query
- Indici specifici per supportare il soft delete (`deleted_at`)

### Eager Loading

Per ottimizzare le query, usa l'eager loading di Sequelize:

```javascript
const assetsWithAll = await Asset.findAll({
  include: [
    {
      model: sequelize.models.Filiale,
      as: 'filiale'
    },
    {
      model: sequelize.models.Attrezzatura,
      as: 'attrezzatura',
      include: [
        {
          model: sequelize.models.CategoriaAttrezzatura,
          as: 'categoria'
        }
      ]
    }
  ]
});
```

## Conclusione

Questa guida fornisce un'introduzione alla struttura del database e ai modelli dati in au-to-be-node. Seguendo queste convenzioni e pattern, potrai sviluppare nuove funzionalità che si integrano perfettamente con il sistema esistente, mantenendo la coerenza e l'integrità del modello dati.
