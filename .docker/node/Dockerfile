FROM node:22-alpine

# Installa dipendenze essenziali
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# Imposta il working directory
WORKDIR /usr/src/app

# Non cambiamo utente, usiamo root

# Espone la porta 3000
EXPOSE 3000

# Comando predefinito
CMD ["sh", "-c", "tail -f /dev/null"]
