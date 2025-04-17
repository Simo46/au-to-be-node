# Guida di onboarding per au-to-be-node

## Panoramica del progetto

au-to-be-node è il backend per un sistema di Asset Management progettato per concessionarie e officine. Il sistema permette di gestire asset come attrezzature, strumenti di misura e impianti tecnologici, monitorarne la manutenzione e gestirne i prestiti tra filiali.

### Stack tecnologico

- **Backend**: Node.js 22 + Express.js
- **Database**: PostgreSQL 17
- **Cache**: Redis
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
docker compose up -d --build

# Verifica che i container siano in esecuzione
docker compose ps
```

### Accesso al container del backend

```bash
# Accedi al container dell'API
docker compose exec api sh
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
│   ├── models/            # Modelli dati e ORM
│   ├── services/          # Business logic
│   ├── middleware/        # Middleware personalizzati
│   └── utils/             # Funzioni di utilità
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

### Sviluppo

All'interno del container `api`:

```bash
# Installare nuove dipendenze
npm install <nome-pacchetto>

# Avviare il server in modalità sviluppo
npm run dev

# Eseguire i test
npm test

# Lint del codice
npm run lint
```

## Documentazione aggiuntiva

Per maggiori dettagli, consulta i documenti nella cartella `Documenti/`:

- **Piano di sviluppo.md**: Timeline e roadmap del progetto
- **Sistema di Permessi per Asset Management.md**: Dettagli sul sistema di permessi
- **specifiche-asset-management.md**: Specifiche tecniche generali
- **specifiche-dettagliate.md**: Specifiche tecniche dettagliate

## API

L'API sarà disponibile all'indirizzo `http://localhost:3000/api`.

Per verificare che il server sia in funzione, visita:
```
http://localhost:3000/api/health
```

## Database

Il database PostgreSQL è accessibile attraverso:
- Host: `localhost`
- Porta: `5444` (o quella specificata in `.env`)
- Database: `autobe`
- Utente: `autobeuser` (o quello specificato in `.env`)
- Password: `secret` (o quella specificata in `.env`)

## Workflow per l'implementazione delle funzionalità

1. **Analisi delle specifiche**: Consulta i documenti nella cartella `Documenti/`
2. **Pianificazione**: Identifica le dipendenze e il percorso critico
3. **Sviluppo**: Segui l'architettura pulita (controller → service → model)
4. **Test**: Crea test unitari e di integrazione
5. **Documentazione**: Aggiorna la documentazione API

## Note per lo sviluppo

- **Architettura pulita**: Separa chiaramente le responsabilità tra controller, servizi e modelli
- **Consistenza nei nomi**: Segui le convenzioni di naming stabilite
- **Documentazione**: Documenta le nuove API man mano che vengono sviluppate
- **Error handling**: Implementa sempre una gestione degli errori appropriata

## Troubleshooting

### Problemi di permessi nei file
Se riscontri problemi di permessi nei file all'interno del container:

```bash
# Accedi al container come root
docker compose exec -u root api sh

# Cambia il proprietario dei file
chown -R 1000:1000 /usr/src/app
```

### Container non si avvia
Verifica i log:

```bash
docker compose logs api
```

### Database non raggiungibile
Controlla le variabili d'ambiente nel file `.env` e assicurati che corrispondano alle impostazioni in `docker-compose.yaml`.