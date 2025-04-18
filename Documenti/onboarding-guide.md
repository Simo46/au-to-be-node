# Guida di onboarding per au-to-be-node

## Panoramica del progetto

au-to-be-node è il backend per un sistema di Asset Management progettato per concessionarie e officine. Il sistema permette di gestire asset come attrezzature, strumenti di misura e impianti tecnologici, monitorarne la manutenzione e gestirne i prestiti tra filiali.

### Stack tecnologico

- **Backend**: Node.js 22 + Express 5
- **Database**: PostgreSQL 17
- **Cache**: Redis
- **ORM**: Sequelize 6
- **Logging**: Pino (logging strutturato in formato JSON)
- **Containerizzazione**: Docker e Docker Compose
- **Versionamento**: Git con Git Flow

## Setup iniziale

### Prerequisiti

- Git
- Docker e Docker Compose
- Node.js (consigliato per lo sviluppo locale, ma non necessario grazie a Docker)

### Clonare il repository

```bash
# Clona il repository
git clone git@github.com-personal:Simo46/au-to-be-node.git

# Entra nella cartella del progetto
cd au-to-be-node

# Checkout del branch develop
git checkout develop
```

### Configurazione dell'ambiente

1. **Crea il file .env**:
   ```bash
   cp .env.example .env
   ```

2. **Modifica le variabili d'ambiente** nel file `.env` secondo necessità.

### Avvio dell'ambiente di sviluppo

```bash
# Costruisci e avvia i container
docker compose up -d

# Verifica che i container siano in esecuzione
docker compose ps
```

### Accesso al container del backend

```bash
# Accedi al container dell'API
docker compose exec api sh
```

### Verifica del funzionamento

Per verificare che il server sia in funzione, visita:
```
http://localhost:3000/api/health
```

## Struttura del progetto

```
au-to-be-node/
├── .docker/               # Configurazioni Docker
│   ├── node/              # Configurazione Node.js
│   │   └── Dockerfile     # Dockerfile per Node.js
│   ├── postgres/          # Configurazione PostgreSQL
│   │   └── init/          # Script di inizializzazione DB
│   └── ...
├── Documenti/             # Documentazione del progetto
│   ├── ddl_originale.sql
│   ├── Piano di sviluppo.md
│   ├── Sistema di Permessi per Asset Management.md
│   ├── specifiche-asset-management.md
│   └── specifiche-dettagliate.md
├── src/                   # Codice sorgente Express.js
│   ├── app.js             # Configurazione Express
│   ├── server.js          # Entry point dell'applicazione
│   ├── api/               # API routes e controller
│   ├── config/            # Configurazioni applicazione
│   │   ├── database.js    # Configurazione Sequelize
│   │   ├── redis.js       # Configurazione Redis
│   │   └── init.js        # Inizializzazione servizi
│   ├── models/            # Modelli dati e ORM
│   ├── services/          # Business logic
│   ├── middleware/        # Middleware personalizzati
│   │   └── errorHandler.js # Gestione centralizzata errori
│   └── utils/             # Funzioni di utilità
│       └── logger.js      # Configurazione Pino logger
├── docker-compose.yaml    # Configurazione Docker Compose
├── .env                   # Variabili d'ambiente (non committato)
├── .env.example           # Template variabili d'ambiente
└── README.md              # Documentazione principale
```

## Workflow di sviluppo

Questo progetto segue il workflow Git Flow:

### Branch principali
- `main`: Codice di produzione
- `develop`: Branch di integrazione per lo sviluppo

### Branch temporanei
- `feature/*`: Nuove funzionalità
- `bugfix/*`: Correzioni di bug
- `release/*`: Preparazione per il rilascio
- `hotfix/*`: Correzioni urgenti in produzione

### Creare una nuova feature

```bash
# Inizia una nuova feature
git flow feature start nome-feature

# Dopo aver completato lo sviluppo
git flow feature finish nome-feature
```

## Comandi utili

### Docker

```bash
# Avviare tutti i container
docker compose up -d

# Visualizzare i log
docker compose logs -f api

# Fermare tutti i container
docker compose down

# Ricostruire i container dopo modifiche al Dockerfile
docker compose up -d --build
```

### Problemi di permessi

Se riscontri problemi di permessi nei file all'interno del container:

```bash
# Accedi al container come root
docker compose exec -u root api sh

# Cambia il proprietario dei file
chown -R 1000:1000 /usr/src/app
```

## Documentazione aggiuntiva

Per maggiori dettagli sul progetto:

- **Stack Tecnologico - Guida Rapida**: Informazioni sulle librerie e le tecnologie utilizzate
- **Piano di sviluppo.md**: Timeline e roadmap del progetto
- **Sistema di Permessi per Asset Management.md**: Dettagli sul sistema di permessi
- **specifiche-asset-management.md**: Specifiche tecniche generali
- **specifiche-dettagliate.md**: Specifiche tecniche dettagliate

## Database

Il database PostgreSQL è accessibile attraverso:
- Host: `postgres` (all'interno della rete Docker) o `localhost` (dall'esterno)
- Porta: `5432` (all'interno della rete Docker) o `5444` (mappata all'esterno)
- Database: `autobe`
- Utente: `autobeuser`
- Password: `secret` (o quella specificata in `.env`)

## Troubleshooting

### Container non si avvia
Verifica i log:

```bash
docker compose logs api
```

### Database non raggiungibile
Controlla le variabili d'ambiente nel file `.env` e assicurati che corrispondano alle impostazioni in `docker-compose.yaml`.

### Riferimenti alle porte
- Express.js: 3000
- PostgreSQL: 5444 (mappata esternamente) -> 5432 (internamente)
- Redis: 6389 (mappata esternamente) -> 6379 (internamente)