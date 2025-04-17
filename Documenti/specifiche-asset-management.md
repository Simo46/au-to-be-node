# Specifiche Tecniche: Sistema di Asset Management per Concessionarie e Officine

## 1. Panoramica del Sistema
Sistema di gestione degli asset per una rete di concessionarie e officine distribuite sul territorio italiano (circa 100 sedi). Il sistema deve permettere il tracciamento, la manutenzione e la gestione completa di attrezzature, strumenti di misura e impianti tecnologici, con la possibilità di estendere in futuro il tracciamento a nuove tipologie di asset.

## 2. Gestione Asset

### 2.1 Tipologie di Asset
- **Attrezzature**: strumenti tecnici di base
- **Strumenti di misura**: dispositivi di misurazione specializzati
- **Impianti tecnologici**: sistemi tecnici complessi con attributi specifici come "TipoAlimentazione"
- **Architettura estensibile** tramite ereditarietà PostgreSQL (tabelle padre-figlio) per future tipologie di asset
- Stato degli asset tracciato (In uso/In manutenzione/Dismesso)

### 2.2 Localizzazione Asset
- **Gerarchia Localizzativa**: Filiale > Edificio > Piano > Locale
- **Obbligatorietà**: Associazione minima obbligatoria a livello di Filiale
- **Implementazione**: Foreign key tra asset e rispettive entità di localizzazione (non richiesta geolocalizzazione GIS)

## 3. Funzionalità Core

### 3.0 Dashboard e Reportistica
- **Dashboard personalizzabile** con widget per visualizzare statistiche chiave
- Grafici interattivi per monitorare trend e performance
- Indicatori di stato per asset, manutenzioni e scadenze
- **Modulo di reportistica avanzata**:
  - Creazione di report personalizzati
  - Pianificazione di report ricorrenti
  - Export in diversi formati (PDF, Excel, CSV)
  - Possibilità di salvare template di report per utilizzi futuri

### 3.1 Calendario Scadenze
- Gestione scadenze manutenzioni programmate basate su:
  - `DataUltimaManutenzio`
  - `FrequenzaManutenzion`
  - `DataProssManutenzio`
- Gestione scadenze documentali relative agli asset
- Tracciamento stato manutenzione con `StatoDotazioneTecnic`
- Sistema di notifiche e promemoria con:
  - Notifiche in-app
  - Notifiche email con template personalizzabili
- Visualizzazione personalizzata in base ai permessi utente:
  - Utenti base: visualizzazione scadenze della propria filiale ed eventuali scadenze personali
  - Utenti con privilegi estesi: visualizzazione scadenze di tutte le filiali di propria competenza

### 3.2 Sistema di Prestito Asset
- Processo di richiesta prestito tra filiali con flusso completo:
  - Richiesta da parte della filiale richiedente
  - Approvazione/rifiuto da parte della filiale proprietaria
  - Tracciamento spedizione con allegati (DDT)
  - Conferma ricezione
  - Richiesta/offerta di restituzione
  - Completamento del prestito
- Tracciamento dello stato del prestito attraverso flag dedicati
- Storico completo di tutte le operazioni con timestamp
- Viste specifiche per monitorare:
  - Attrezzature ricevute in prestito
  - Attrezzature inviate in prestito ad altre filiali
- Gestione scadenza prestiti con data di restituzione programmata
- Sistema di promemoria automatici per la restituzione alla filiale di origine
- Notifiche in-app e via email in ogni fase del processo

## 4. Gestione Utenti e Permessi

### 4.1 Sistema di Ruoli
- Ruoli predefiniti con diversi livelli di accesso
- Accesso limitato alla propria filiale (utenti base)
- Accesso a gruppi di filiali (utenti intermedi)
- Accesso globale a tutte le filiali (amministratori)

### 4.2 Permessi Granulari
- Configurazione permessi a livello di ruolo
- Configurazione permessi a livello di singolo utente
- Gestione permessi per operazioni (lettura, creazione, modifica, eliminazione)
- Gestione permessi a livello di singolo campo per ciascun tipo di asset

### 4.3 Architettura Multi-tenant
- Supporto per più società/clienti completamente separati tra loro
- Ogni società gestisce le proprie filiali in modo isolato
- Possibilità di rivendere l'applicativo come servizio a nuovi clienti

## 5. Tracciamento Modifiche e Versionamento

### 5.1 Storico e Visualizzazione Dettagli
- Log completo di tutte le modifiche effettuate nel sistema
- Registrazione utente, data, ora e dettaglio della modifica
- Interfaccia di consultazione dello storico con filtri
- Sistema di tab per ogni entità del sistema (asset, filiali, edifici, piani, locali, ecc.) con:
  - Tab "Storico" con evidenziazione dei campi modificati
  - Tab "Email" per visualizzare comunicazioni relative all'entità
  - Tab "Notifiche" per visualizzare le notifiche generate dal sistema
  - Tab "Allegati" per accesso rapido ai documenti associati
  - Tab "Calendario" per visualizzare eventi e scadenze relative all'entità specifica
- Tasto "Stampa" in ogni sezione e per ogni elemento singolo, con possibilità di esportazione in PDF o CSV anche di viste filtrate

### 5.2 Gestione Documentale
- Possibilità di allegare documenti agli asset
- Categorizzazione dei documenti
- Gestione scadenze documentali
- Sistema di versionamento documenti con storico versioni

## 6. Import/Export Dati

### 6.1 Importazione Massiva
- Import da file Excel e CSV
- Validazione dati in fase di import
- Gestione errori e log di import
- Supporto per aggiornamento massivo di record esistenti tramite chiavi identificative
- Modalità di riconoscimento di record duplicati per evitare inserimenti multipli

### 6.2 Esportazione Dati
- Export in formati standard (Excel, CSV, PDF)
- Report personalizzabili

## 7. Requisiti Tecnici

### 7.1 Interfaccia Utente
- Design responsive per accesso da diversi dispositivi
- Interfaccia intuitiva organizzata per sezioni funzionali
- Menu di navigazione:
  - Adattivo in base ai permessi dell'utente
  - Personalizzabile dall'utente (ordinamento, preferiti, etc.)
- Visualizzazione tabellare personalizzabile:
  - Selezione delle colonne da visualizzare
  - Riordinamento delle colonne
  - Configurazioni predefinite a livello di sistema
  - Configurazioni personalizzabili a livello di gruppo
  - Configurazioni personalizzabili a livello di utente singolo

### 7.2 Performance
- Tempi di risposta rapidi anche con grandi volumi di dati
- Ottimizzazione per operazioni batch

### 7.3 Sicurezza
- Autenticazione con username e password
- Implementazione JWT per l'autenticazione
- Crittografia dati sensibili
- Log accessi al sistema
- Sistema di permessi con granularità a livello di:
  - Filiale (utenti limitati alla propria filiale)
  - Tipologia di asset
  - Operazione (lettura, scrittura, cancellazione)
  - Campo specifico di un record

## 8. Integrazione
- API per eventuale integrazione con sistemi esterni
- Export dati in formati standard per interoperabilità

## 9. Architettura Applicativa
- Web app containerizzata (Docker)
- Deployment su cluster Kubernetes in ambiente cloud
- Backend sviluppato in Node 22 (expressjs come framework) con architettura API-first
- Frontend sviluppato in Vuejs 3.5
- Comunicazione API RESTful tra backend e frontend/servizi esterni
- Database PostgreSQL 17 con:
  - Utilizzo di tabelle padre-figlio per implementare ereditarietà e migliorare la gestione delle diverse tipologie di asset
  - Struttura ottimizzata per la gestione dello storico
  - Schema basato sul modello fornito ma ottimizzato per le specifiche esigenze
  - Supporto per relazioni complesse tra entità (es: prestiti, gerarchia di localizzazioni)
- Sistema di cache Redis per ottimizzare le performance
- Volume dati stimato:
  - ~300 utenti totali (100 concorrenti)
  - ~100 filiali
  - ~20.000 asset totali
