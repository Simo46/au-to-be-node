# Sistema di Audit e Tracking - Guida per Sviluppatori

Questa guida descrive il sistema di audit e tracking implementato in au-to-be-node, fornendo dettagli su come è progettato e come utilizzarlo correttamente quando si sviluppano nuove funzionalità.

## Panoramica del sistema di audit

Il sistema di audit è progettato per tracciare completamente tutte le modifiche ai dati nel sistema, rispondendo alle seguenti domande:
- **Chi** ha fatto una modifica
- **Cosa** è stato modificato
- **Quando** è avvenuta la modifica
- **Quale** era il valore precedente

Il sistema funziona a più livelli per garantire che nessuna modifica vada persa, anche se effettuata direttamente nel database.

## Architettura del sistema di audit

Il sistema è composto da diversi componenti che lavorano insieme:

### 1. Campi di audit nelle tabelle

Tutte le tabelle principali del database includono i seguenti campi:
- `created_by`: UUID riferimento a `users.id` - Indica chi ha creato il record
- `updated_by`: UUID riferimento a `users.id` - Indica chi ha modificato per ultimo il record
- `created_at`: Timestamp di creazione (gestito da Sequelize)
- `updated_at`: Timestamp ultima modifica (gestito da Sequelize)
- `deleted_at`: Timestamp per soft delete (per le tabelle con paranoid:true)

### 2. Tabelle di history

Per le entità principali (assets, filiali, edifici, piani, locali), abbiamo tabelle dedicate che registrano lo storico delle modifiche:
- `assets_history`
- `filiali_history`
- `edifici_history`
- `piani_history`
- `locali_history`

Queste tabelle registrano:
- L'ID dell'entità modificata
- L'utente che ha fatto la modifica
- Il tipo di azione (create, update, delete)
- I valori precedenti e nuovi in formato JSON
- Timestamp della modifica

### 3. Hooks Sequelize

Gli hooks Sequelize sono configurati in `src/config/sequelize-hooks.js` e si attivano automaticamente durante le operazioni tramite l'ORM. Questi hooks:
- Impostano automaticamente `created_by` e `updated_by` basandosi sul contesto utente
- Gestiscono l'audit trail per operazioni in batch
- Funzionano in modo coerente sia per operazioni singole che per operazioni di massa

### 4. Trigger PostgreSQL

I trigger PostgreSQL (configurati in `src/migrations/20250422095837-add-audit-triggers.js`) forniscono un ulteriore livello di sicurezza:
- Catturano le modifiche effettuate direttamente sul database (bypassing l'ORM)
- Registrano automaticamente le modifiche nelle tabelle di history
- Funzionano anche quando gli hooks Sequelize non sono attivati

### 5. Contesto utente nel database

Il sistema utilizza una variabile di sessione PostgreSQL (`app.current_user_id`) per tracciare quale utente sta effettuando le modifiche. Questo è gestito attraverso:
- Middleware Express (`src/middleware/db-context.js`)
- Utility per script batch e cronjob (`src/utils/db-context.js`)

## Integrazione con il Sistema di Autenticazione

Il sistema di audit è strettamente integrato con il sistema di autenticazione per garantire la tracciabilità completa:

### 1. Propagazione dell'utente autenticato

Quando un utente è autenticato tramite JWT, il suo ID viene:
1. Estratto dal token JWT da Passport
2. Reso disponibile come `req.user` nei controller e middleware
3. Propagato al database attraverso `db-context.js` che imposta la variabile di sessione PostgreSQL

```javascript
// In middleware/db-context.js
if (req.user && req.user.id) {
  await sequelize.query("SELECT set_config('app.current_user_id', :userId, true)", {
    replacements: { userId: req.user.id }
  });
}
```

### 2. Registrazione nei controller

Nei controller, l'ID dell'utente viene passato alle operazioni Sequelize:

```javascript
// Esempio di creazione record con tracking utente
await Model.create(data, {
  userId: req.user.id  // Questo ID viene utilizzato negli hooks
});

// Esempio di aggiornamento
await instance.update(data, {
  userId: req.user.id
});
```

### 3. Operazioni in transazione

Per le operazioni in transazione, l'ID utente viene associato al contesto della transazione:

```javascript
const transaction = await sequelize.transaction();

try {
  // Imposta il contesto utente per questa transazione
  await dbContext.setUserId(req.user.id, { transaction });
  
  // Operazioni all'interno della transazione
  
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Come utilizzare il sistema durante lo sviluppo

### In controller e route

Quando sviluppi una nuova funzionalità che modifica i dati, assicurati di:

1. Passare l'ID dell'utente nelle operazioni Sequelize:

```javascript
// Esempio corretto in un controller
const createItem = async (req, res) => {
  try {
    const newItem = await Model.create(req.body, {
      userId: req.user.id  // Questo è fondamentale per il tracking
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Per gli aggiornamenti
const updateItem = async (req, res) => {
  try {
    const item = await Model.findByPk(req.params.id);
    await item.update(req.body, {
      userId: req.user.id  // Importante per il tracking
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

2. Per operazioni in transazione o query dirette, utilizzare l'utility `dbContext`:

```javascript
const { sequelize } = require('../models');
const dbContext = require('../utils/db-context');

const complexOperation = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    // Imposta il contesto utente per questa transazione
    await dbContext.setUserId(req.user.id, { transaction: t });
    
    // Esegui le operazioni nella transazione...
    
    await t.commit();
    res.json({ success: true });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};
```

### In script batch, seeder e cronjob

Per script che eseguono modifiche in batch o processi automatici:

```javascript
const dbContext = require('../utils/db-context');

// Per un utente specifico
const importData = async (userId, data) => {
  return await dbContext.withUserId(userId, async () => {
    // Operazioni di import...
    return await Model.bulkCreate(data, {
      userId: userId,  // Assicurati di passare anche qui l'userId
      individualHooks: true  // Importante per attivare gli hooks per ogni record
    });
  });
};

// Per operazioni di sistema automatiche
const scheduledTask = async () => {
  return await dbContext.withSystemUser(async () => {
    // Il contesto è impostato automaticamente all'utente di sistema
    return await Model.update(
      { status: 'expired' },
      { 
        where: { expiryDate: { [Op.lt]: new Date() } },
        userId: process.env.SYSTEM_USER_ID || '00000000-0000-0000-0000-000000000000'
      }
    );
  });
};
```

## Accesso ai dati di audit

### Visualizzazione history tramite API

Puoi implementare endpoint API per accedere alla history di un'entità:

```javascript
// Esempio di controller per recuperare la history
const getAssetHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const history = await AssetHistory.findAll({
      where: { asset_id: id },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'name'] }],
      order: [['created_at', 'DESC']]
    });
    
    // Controlla permessi di visualizzazione storia
    if (!await policy.canViewHistory(req.user, id)) {
      return next(AppError.authorization('Non autorizzato a visualizzare la storia di questo asset'));
    }
    
    res.json({
      status: 'success',
      data: { history }
    });
  } catch (error) {
    next(error);
  }
};
```

Nelle rotte, proteggi l'accesso con il middleware di autenticazione:

```javascript
router.get('/assets/:id/history',
  authenticate, 
  checkPermission('read', 'AssetHistory'),
  assetController.getAssetHistory
);
```

## Best practices per sviluppatori

1. **Usa sempre le transazioni** per operazioni che modificano dati correlati
2. **Passa sempre l'ID utente** nelle operazioni Sequelize con il parametro `userId`
3. **Usa l'utility `dbContext`** per script, import, e operazioni batch
4. **Imposta `individualHooks: true`** quando usi `bulkCreate` o `bulkUpdate`
5. **Non fidarti solo degli hooks ORM** per audit trail critici (i trigger DB sono la rete di sicurezza)
6. **Accedi alle tabelle history** per visualizzare chi ha fatto cosa:

```javascript
// Esempio: ottenere la history di un asset
const assetHistory = await sequelize.models.AssetHistory.findAll({
  where: { asset_id: assetId },
  include: [{ model: sequelize.models.User, as: 'user' }],
  order: [['created_at', 'DESC']]
});
```

## Controllo accessi per audit data

Il sistema di permessi controlla anche l'accesso ai dati di audit:

1. Gli utenti `Amministratore di Sistema` hanno accesso completo a tutti i dati di history
2. Gli utenti come `Ufficio Tecnico` e `Ufficio Post Vendita` possono vedere i dati di history di tutti gli asset
3. `Area Manager` possono vedere solo la history degli asset nella loro area
4. `Responsabile Filiale` e `Responsabile Officina` vedono solo la history degli asset della loro filiale

Questo controllo è implementato nelle policy:

```javascript
// Esempio di policy per history (schematico)
class AssetHistoryPolicy extends BasePolicy {
  async canRead(user, history) {
    if (user.hasRole('Amministratore di Sistema')) return true;
    if (user.hasRole('Ufficio Tecnico')) return true;
    
    // Ottieni l'asset associato alla history
    const asset = await Asset.findByPk(history.asset_id);
    
    // Verifica permessi in base alla filiale
    if (user.filiale_id && asset.filiale_id !== user.filiale_id) {
      return user.hasRole('Area Manager') && 
             // Verifica se la filiale è nell'area dell'Area Manager
             user.settings?.managed_filiali?.includes(asset.filiale_id);
    }
    
    return true;
  }
}
```

## Utente di sistema

Per operazioni automatiche o script batch, abbiamo un utente di sistema predefinito:

- **ID**: `00000000-0000-0000-0000-000000000000`
- **Username**: `system`
- **Email**: `system@example.com`

Quando sviluppi processi automatizzati, utilizza questo utente per le operazioni non direttamente iniziate da un utente reale:

```javascript
// Imposta l'utente di sistema per un'operazione
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

// Operazione con utente di sistema
await Model.update(
  { status: 'processed' },
  { 
    where: { /* condizioni */ },
    userId: SYSTEM_USER_ID
  }
);
```

## Limitazioni e considerazioni

- Le tabelle di configurazione o lookup (come `stati_dotazione`) non hanno tabelle history dedicate, ma comunque tracciano `created_by` e `updated_by`
- Le modifiche a schema o struttura del database non vengono tracciate 
- Le operazioni di query pura (senza modifiche) non vengono ovviamente tracciate
- I trigger PostgreSQL potrebbero non funzionare in tutti gli ambienti cloud (verifica la compatibilità)

## Debug e troubleshooting

Se noti che le modifiche non vengono tracciate correttamente:

1. Verifica di star passando il parametro `userId` nelle operazioni Sequelize
2. Controlla se il middleware `db-context.js` è attivo per la route
3. Verifica che i trigger PostgreSQL siano stati creati correttamente:
   ```sql
   -- Esegui nel database per verificare i trigger
   SELECT * FROM pg_trigger WHERE tgname LIKE '%_changes_trigger';
   ```
4. Controlla i log per errori nei trigger o negli hooks
5. Verifica che l'utente sia autenticato correttamente e che `req.user.id` sia disponibile

## Conclusione

Il sistema di audit e tracking è progettato per essere resiliente e completo, funzionando a più livelli per garantire che tutte le modifiche ai dati siano tracciate. Il suo stretto legame con il sistema di autenticazione assicura che ogni modifica sia attribuita all'utente che l'ha effettuata, garantendo tracciabilità e responsabilità completa.