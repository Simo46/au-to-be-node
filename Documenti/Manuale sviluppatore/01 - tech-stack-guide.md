# Stack Tecnologico di au-to-be-node - Guida Rapida

Questa guida descrive lo stack tecnologico di au-to-be-node, le scelte architetturali e le principali librerie utilizzate nel progetto.

## Architettura Generale

Il progetto segue un'architettura pulita con separazione chiara delle responsabilità:

- **API Layer**: Gestisce richieste e risposte HTTP (controllers, routes)
- **Service Layer**: Contiene la logica di business
- **Data Layer**: Gestisce l'accesso ai dati (models, repository)
- **Infrastructure**: Configurazioni di sistema (database, redis, logger)

## Tecnologie Core

### Framework: Express 5

Utilizziamo Express 5, la versione più recente che include:
- Supporto nativo per Promise (gestione automatica delle Promise rifiutate)
- API RESTful con routing avanzato
- Middleware per varie funzionalità

Esempio tipico di un endpoint:
```javascript
app.get('/api/resource', async (req, res) => {
  // Con Express 5, gli errori nelle Promise vengono gestiti automaticamente
  const data = await service.getData();
  res.json(data);
});
```

### ORM: Sequelize

Per l'interazione con PostgreSQL utilizziamo Sequelize 6:
- Mappatura oggetto-relazionale
- Supporto per relazioni complesse
- Query builder con supporto per operazioni avanzate
- Migrazioni e seed

La configurazione è in `config/database.js` con test automatico della connessione all'avvio.

### Gestione Cache: Redis

Redis è configurato per:
- Caching delle risposte API
- Gestione delle sessioni (implementazione futura)

Il client Redis è configurato in `config/redis.js` con funzioni helper per:
- Connessione e gestione degli errori
- Middleware per caching automatico
- Funzione per cancellazione cache selettiva

## Logging e Monitoring

### Sistema di Logging: Pino

Abbiamo implementato Pino per il logging strutturato:
- Formato JSON per una facile integrazione con strumenti di log management
- Performance elevata
- Livelli di log configurabili
- Formattazione leggibile in sviluppo con pino-pretty

Il logger è configurato in `utils/logger.js` con due funzioni principali:
- `createLogger`: Per log applicativi generali
- `createHttpLogger`: Middleware Express per logging delle richieste HTTP

Esempio di utilizzo:
```javascript
const { createLogger } = require('../utils/logger');
const logger = createLogger('module-name');

logger.info('Operazione completata', { data: result });
logger.error({ err }, 'Errore durante l'operazione');
```

## Gestione Errori

La gestione centralizzata degli errori è implementata in `middleware/errorHandler.js`:
- Classe `AppError` per errori operativi tipizzati
- Formattazione coerente delle risposte di errore
- Differenziazione tra ambiente di sviluppo e produzione
- Gestori specifici per errori comuni (Sequelize, JWT)
- Logging automatico degli errori con livello appropriato

Tipi di errori predefiniti:
- Validation, Authentication, Authorization
- NotFound, Conflict, Business
- Database, ExternalService, Unknown

Esempio di utilizzo:
```javascript
const { AppError } = require('../middleware/errorHandler');

// In un controller o service
if (!user) {
  throw AppError.notFound('Utente non trovato');
}
```

## Sicurezza

Implementiamo diverse misure di sicurezza:
- `helmet` per header HTTP sicuri
- CORS configurabile
- Sanitizzazione input
- Rate limiting (implementazione futura)

## Ambiente di Sviluppo

Il progetto è completamente containerizzato con Docker:
- Node.js 22 con Express
- PostgreSQL 17
- Redis

Il file `docker-compose.yaml` definisce tutti i servizi necessari.

## Struttura delle Cartelle

```
src/
├── api/            # API Layer
│   ├── controllers/
│   └── routes/
├── config/         # Configurazioni
├── middleware/     # Middleware Express
├── models/         # Modelli Sequelize
├── services/       # Logica di business
└── utils/          # Utilities
```

## Convenzioni di Codice

- Utilizzo estensivo di async/await per codice asincrono
- Logging strutturato con metadati contestuali
- Gestione errori centralizzata
- Documentazione inline dei metodi e componenti principali
