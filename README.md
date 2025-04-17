# au-to-be-node

Backend Node.js/Express.js per un sistema di Asset Management per Concessionarie e Officine.

## Struttura delle cartelle
```txt
au-to-be-node/
├── .docker/            # Configurazioni Docker
│   ├── node/           # Configurazioni Node.js
│   ├── postgres/       # Configurazioni PostgreSQL
│   └── ...
├── src/                # Codice sorgente Express.js
├── Documenti/          # Documentazione del progetto
├── .env                # Variabili d'ambiente
├── .env.example        # Esempio di variabili d'ambiente
├── .gitignore          # File da ignorare in Git
└── docker-compose.yaml # Configurazione Docker Compose
```

## Requisiti
- Docker
- Docker Compose
- Git

## Primo avvio dopo aver scaricato il repo
```sh
# Crea un file .env (puoi copiare il contenuto da .env.example)
cp .env.example .env

# Avvia i container
docker compose up -d

# Verifica che l'API sia in esecuzione
curl http://localhost:3000/api/health
```

## Comandi utili
```sh
# Avviare i container
docker compose up -d

# Fermare i container
docker compose down

# Visualizzare i log dell'API
docker compose logs -f api

# Accesso alla shell del container dell'API
docker compose exec api sh

# Installare nuove dipendenze
docker compose exec api npm install <package-name>

# Eseguire i test
docker compose exec api npm test

# Controllare la qualità del codice
docker compose exec api npm run lint
```

## API Endpoints

L'API sarà disponibile all'indirizzo `http://localhost:3000/api`.

## Sviluppo con Git Flow

Questo progetto utilizza Git Flow come workflow. Ecco i comandi principali:

```sh
# Inizializzare Git Flow
git flow init -d

# Creare una nuova feature
git flow feature start nome-feature

# Completare una feature
git flow feature finish nome-feature

# Creare una release
git flow release start v1.0.0
git flow release finish v1.0.0
```