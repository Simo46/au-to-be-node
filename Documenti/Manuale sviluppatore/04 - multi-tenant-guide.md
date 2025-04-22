# Guida al Multi-tenancy in au-to-be-node

Questa guida spiega come è implementato il sistema multi-tenant in au-to-be-node e come sviluppare correttamente nuove funzionalità che rispettino l'isolamento tra i tenant.

## Cos'è il Multi-tenancy

Il multi-tenancy (multi-cliente) è un'architettura in cui una singola istanza dell'applicazione serve più clienti (tenant), mantenendo i loro dati completamente separati. In au-to-be-node, questo permette di servire diverse concessionarie o gruppi di concessionarie da un'unica installazione del software.

## Architettura Multi-tenant

### Approccio Implementato

au-to-be-node implementa un **multi-tenancy basato su discriminatore** (noto anche come "Row-Level Security"):
- Singolo database
- Singolo schema
- Colonna `tenant_id` in ogni tabella per discriminare i dati

### Vantaggi di questo approccio

- **Semplicità**: Un unico database e schema da gestire
- **Efficienza**: Minore overhead di risorse rispetto a database separati
- **Flessibilità**: Facilità nel condividere dati di lookup/configurazione
- **Manutenzione**: Aggiornamenti e backup semplificati

## Componenti Chiave del Multi-tenancy

### 1. Tabella `tenants`

La tabella centrale che definisce i tenant:

```javascript
// In tenant.js
Tenant.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true
  }
});
```

### 2. Middleware di Tenant

Il middleware `tenantMiddleware.js` è il componente centrale che gestisce l'identificazione e la validazione del tenant per ogni richiesta:

```javascript
// tenantMiddleware.js (versione semplificata)
const tenantMiddleware = async (req, res, next) => {
  try {
    // Ottieni l'host dalla richiesta
    const host = req.get('host');
    
    // Per test e sviluppo, accetta un header X-Tenant-ID
    const tenantIdFromHeader = req.get('X-Tenant-ID');
    
    if (tenantIdFromHeader) {
      const tenant = await models.Tenant.findByPk(tenantIdFromHeader);
      
      if (tenant && tenant.active) {
        req.tenantId = tenant.id;
        req.tenant = tenant;
        return next();
      }
    }
    
    // Estrai il sottodominio
    const subdomain = host.split('.')[0];
    
    // Cerca il tenant nel database
    const tenant = await models.Tenant.findOne({ 
      where: { 
        domain: subdomain,
        active: true
      } 
    });
    
    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        message: 'The requested tenant does not exist or is inactive'
      });
    }
    
    // Aggiungi il tenant all'oggetto request
    req.tenantId = tenant.id;
    req.tenant = tenant;
    
    // Aggiungi opzioni Sequelize all'oggetto request
    req.sequelizeOptions = { 
      tenantId: tenant.id 
    };
    
    return next();
  } catch (error) {
    logger.error({ err: error }, 'Error identifying tenant');
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred while identifying the tenant'
    });
  }
};
```

Questo middleware:

1. **Identifica il tenant** in più modi:
   - Dall'header `X-Tenant-ID` (utile per sviluppo e test)
   - Dal sottodominio nella richiesta HTTP (es. `tenant1.app.com`)

2. **Verifica che il tenant sia attivo**

3. **Arricchisce l'oggetto request** con:
   - `req.tenantId`: ID del tenant corrente
   - `req.tenant`: Oggetto tenant completo
   - `req.sequelizeOptions`: Opzioni pre-configurate per query Sequelize

4. **Gestisce errori** in modo consistente:
   - 404 se il tenant non esiste o non è attivo
   - 500 per altri errori

### 3. Hooks Sequelize per Tenant

Gli hooks in `sequelize-hooks.js` assicurano che ogni record creato abbia il tenant_id corretto:

```javascript
// In sequelize-hooks.js
module.exports = function setupTenantHooks(sequelize) {
  // Hook globale beforeCreate
  sequelize.addHook('beforeCreate', async (instance, options) => {
    // Se è definito un tenant_id nelle options, lo usiamo per il record
    if (options.tenantId && !instance.tenant_id && instance.constructor.rawAttributes.tenant_id) {
      instance.tenant_id = options.tenantId;
    }
    
    // ... altri hooks ...
  });
  
  // ... altri hooks ...
};
```

## Implementare Correttamente il Multi-tenancy

### Controller e Routes

Quando sviluppi controller e routes, sfrutta gli oggetti già preparati dal middleware:

1. **Usa direttamente `req.tenantId` o `req.tenant`**:

```javascript
const getAllItems = async (req, res) => {
  try {
    // req.tenantId è già disponibile grazie al middleware
    const items = await Item.findAll({
      where: { 
        tenant_id: req.tenantId,
        // altre condizioni...
      }
    });
    
    res.json(items);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching items');
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

2. **Approfitta di `req.sequelizeOptions` per passare automaticamente il tenant**:

```javascript
const createItem = async (req, res) => {
  try {
    // req.sequelizeOptions contiene già { tenantId: ... }
    const newItem = await Item.create(
      {
        ...req.body,
        tenant_id: req.tenantId // Esplicito per sicurezza
      }, 
      {
        ...req.sequelizeOptions, // Passa tenantId agli hooks
        userId: req.user.id      // Per audit trail
      }
    );
    
    res.status(201).json(newItem);
  } catch (error) {
    logger.error({ err: error }, 'Error creating item');
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

Questo approccio rende il codice più resiliente e meno soggetto a errori, poiché il middleware ha già estratto e validato il tenant.

### Query e Ricerche

1. **Utilizza `req.tenantId` in tutte le query**:

```javascript
// Corretto e sicuro
const results = await Model.findAll({
  where: {
    tenant_id: req.tenantId,
    status: 'active'
  }
});
```

2. **Per query complesse, usa scope personalizzati basati sul tenant**:

```javascript
// Definisci uno scope dinamico nel modello
class Item extends Model {
  static associate(models) {
    // associations...
  }
  
  static withTenant(tenantId) {
    return this.scope({
      method: ['forTenant', tenantId]
    });
  }
}

Item.init({
  // fields...
}, {
  // options...
  scopes: {
    forTenant(tenantId) {
      return {
        where: { tenant_id: tenantId }
      };
    }
  }
});

// Nel controller
const getItems = async (req, res) => {
  const items = await Item.withTenant(req.tenantId).findAll({
    where: { status: 'active' }
  });
  
  res.json(items);
};
```

3. **Per include complessi, ricorda che il tenant si propaga**:

```javascript
const results = await Model.findAll({
  where: { tenant_id: req.tenantId },
  include: [
    {
      model: sequelize.models.RelatedModel,
      as: 'relatedItems',
      // Non serve specificare tenant_id se la relazione è configurata
      // correttamente e il modello principale è già filtrato per tenant
    }
  ]
});
```

### Transazioni e Operazioni in Batch

1. **Passa `req.sequelizeOptions` nelle transazioni**:

```javascript
const complexOperation = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    // Operazioni multiple mantenendo il contesto tenant
    const mainItem = await MainItem.create(
      {
        ...req.body.mainItem,
        tenant_id: req.tenantId
      }, 
      {
        ...req.sequelizeOptions,
        transaction: t,
        userId: req.user.id
      }
    );
    
    // Altre operazioni...
    
    await t.commit();
    res.status(201).json({ success: true });
  } catch (error) {
    await t.rollback();
    logger.error({ err: error }, 'Transaction failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

2. **Nelle operazioni di massa, mappa esplicitamente il tenant_id**:

```javascript
const bulkCreateItems = async (req, res) => {
  try {
    const items = req.body.items.map(item => ({
      ...item,
      tenant_id: req.tenantId
    }));
    
    const createdItems = await Item.bulkCreate(
      items, 
      {
        ...req.sequelizeOptions,
        userId: req.user.id,
        individualHooks: true
      }
    );
    
    res.status(201).json(createdItems);
  } catch (error) {
    logger.error({ err: error }, 'Bulk create failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

## Sicurezza e Best Practices

### Prevenzione degli Errori

Il sistema è progettato per minimizzare gli errori di isolamento tra tenant:

1. **Middleware centralizzato**: Tutte le richieste passano attraverso `tenantMiddleware.js`

2. **Hooks automatici**: Gli hooks Sequelize aggiungono automaticamente `tenant_id` durante la creazione di un record

3. **Oggetti richiesta arricchiti**: `req.tenantId`, `req.tenant`, e `req.sequelizeOptions` sono sempre disponibili

Tuttavia, è importante mantenere alcune best practices:

### Controlli Espliciti di Sicurezza

Per operazioni critiche o altamente sensibili, aggiungi controlli espliciti:

```javascript
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findOne({
      where: { 
        id: req.params.id,
        // Controllo esplicito per operazioni critiche
        tenant_id: req.tenantId
      }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    await item.destroy({
      ...req.sequelizeOptions,
      userId: req.user.id
    });
    
    res.status(204).end();
  } catch (error) {
    logger.error({ err: error }, 'Error deleting item');
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Test del Multi-tenancy

Quando scrivi test, verifica sempre l'isolamento multi-tenant:

```javascript
// Esempio di test per verificare l'isolamento dei tenant
describe('Multi-tenant isolation', () => {
  let tenant1, tenant2;
  
  before(async () => {
    // Setup: crea due tenant e relativi dati
    tenant1 = await Tenant.create({ name: 'Tenant1', code: 'T1', domain: 't1.example.com' });
    tenant2 = await Tenant.create({ name: 'Tenant2', code: 'T2', domain: 't2.example.com' });
    
    // Crea dati per ogni tenant
    await Item.create({ name: 'Item1', tenant_id: tenant1.id });
    await Item.create({ name: 'Item2', tenant_id: tenant2.id });
  });
  
  it('API should only return tenant1 data when tenant1 is specified', async () => {
    // Simula la richiesta con tenant1
    const req = { 
      tenantId: tenant1.id,
      sequelizeOptions: { tenantId: tenant1.id }
    };
    
    const res = { 
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await getAllItems(req, res);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Item1' })
      ])
    );
    
    expect(res.json).toHaveBeenCalledWith(
      expect.not.arrayContaining([
        expect.objectContaining({ name: 'Item2' })
      ])
    );
  });
});
```

## Risoluzione dei Problemi Comuni

### Errore 404 Tenant Not Found

Se ricevi un errore 404 "Tenant not found" durante lo sviluppo:

1. **Verifica l'URL**: Assicurati di utilizzare il sottodominio corretto
2. **Controlla gli header**: Per sviluppo locale, usa l'header `X-Tenant-ID`
3. **Verifica nel database**: Controlla che il tenant esista e sia attivo

### Dati Visualizzati di Altri Tenant

Se vedi dati che appartengono ad altri tenant:

1. **Verifica tutte le query**: Assicurati che ogni query includa `tenant_id: req.tenantId`
2. **Controlla i join**: Nelle query con join, verifica che tutte le tabelle siano filtrate
3. **Esamina i middleware**: Assicurati che tutte le route passino attraverso `tenantMiddleware.js`

## Conclusione

Il sistema multi-tenant in au-to-be-node è progettato per essere resiliente e prevenire errori comuni. Sfrutta gli strumenti forniti (come `req.tenantId` e `req.sequelizeOptions`) per mantenere un isolamento rigoroso tra i tenant.

Seguendo questa guida, potrai sviluppare funzionalità che rispettano la natura multi-tenant dell'applicazione, garantendo sicurezza e integrità dei dati per tutti i clienti.