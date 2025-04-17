FROM node:22-alpine

# Installa dipendenze essenziali
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# Crea un utente non-root per sicurezza
RUN addgroup -g 1000 nodeapp && \
    adduser -G nodeapp -g nodeapp -s /bin/sh -D nodeapp

# Imposta il working directory
WORKDIR /usr/src/app

# Copia package.json e package-lock.json (se disponibili)
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il codice sorgente
COPY . .

# Imposta permessi directory
RUN chown -R nodeapp:nodeapp /usr/src/app

# Cambia utente
USER nodeapp

# Espone la porta 3000
EXPOSE 3000

# Comando per avviare l'applicazione
CMD ["npm", "run", "dev"]