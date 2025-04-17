# Specifiche Dettagliate: Sistema di Asset Management

Questo documento integra le specifiche generali con dettagli tecnici e di processo basati sul file DDL fornito e sulle informazioni aggiuntive.

## 1. Modello Dati Dettagliato

### 1.1 Struttura Gerarchica delle Classi
- **Class**: Classe base per tutte le entità
- **Assets**: Classe base per tutti gli asset
  - **Strumenti**: Classe intermedia per tutti gli strumenti
    - **Attrezzature**: Asset specifico
    - **StrumentiDiMisura**: Asset specifico
    - **ImpiantiTecnologici**: Asset specifico
- **Locations**: Classe base per tutti i luoghi
  - **Filiali**: Luogo primario
  - **Edifici**: Appartiene a una Filiale
  - **Piani**: Appartiene a un Edificio
  - **Stanze (Locali)**: Appartiene a un Piano

### 1.2 Campi Principali per Asset
- **Campi Comuni**:
  - Code (Codice)
  - Description/Descrizione
  - Marca
  - Modello
  - Matricola
  - StatoDotazioneTecnic (In uso/In manutenzione/Dismesso)
  - DataUltimaManutenzio/DataProssManutenzio
  - AppartieneaFiliale (FK a Filiali)
  - AppartieneaEdificio (FK a Edifici)
  - AppartieneaPiano (FK a Piani)
  - AppartieneaLocale (FK a Stanze)

- **Campi per Gestione Prestiti**:
  - RichiedoilPrestito (boolean)
  - AttrezzoinPrestito (boolean)
  - PrestitoRifiutato (boolean)
  - DataPresRifiutato (date)
  - Spostamento (reference)
  - DatadiInvio (date)
  - DatadiSpostamento (date)
  - PrestitoRicevuto (boolean)
  - DataRicezionePresti (date)
  - RichiediAttrezzo (boolean)
  - DataRichiestaAttr (date)
  - RestituisciPrestito (boolean)
  - DataRestituzionePres (date)
  - Richiedente (reference)
  - PrestitoTerminato (boolean)
  - DataTerminePrestito (date)
  - FileDDTResp/FileDDTVisualizz (reference a documenti)

### 1.3 Campi Principali per Luoghi
- **Filiali**:
  - Informazioni Identificative: Codice, Descrizione, Comune, Provincia, Regione, Via, CAP
  - Informazioni di Contatto: Telefono, Email, NomeReferenteSede, CognomeReferenteSede
  - Struttura e Spazi: diversi campi MQ per tipologia di area
  - Informazioni Aziendali: Brand, TipologiaContrattual, AnnoCostruzione
  - Impianti Tecnologici: flag e potenze per vari impianti

- **Edifici, Piani, Stanze**:
  - Codice, Descrizione
  - Planimetria (riferimento documento)
  - Collegamenti alle entità parent (FilialediAppart, EdificiodiAppart, ecc.)

## 2. Flussi di Processo Dettagliati

### 2.1 Processo di Prestito Asset
1. **Richiesta di Prestito**:
   - Un Responsabile Filiale A (RFA) richiede un asset di Filiale B (RFB)
   - Il sistema registra `RichiedoilPrestito = true` e la `DatadiSpostamento`
   - Notifiche in-app e email vengono inviate a RFB

2. **Gestione della Richiesta**:
   - **Scenario Rifiuto**:
     - RFB imposta `PrestitoRifiutato = true` e la `DataPresRifiutato`
     - Notifiche in-app e email inviate a RFA
     - Asset torna disponibile per altre richieste

   - **Scenario Approvazione**:
     - RFB imposta `AttrezzoinPrestito = true` e la `DatadiInvio`
     - RFB può allegare DDT (`FileDDTResp`)
     - Notifiche in-app e email inviate a RFA
     - Asset non è più disponibile per altre richieste

3. **Ricezione dell'Asset**:
   - RFA imposta `PrestitoRicevuto = true` e la `DataRicezionePresti`

4. **Restituzione dell'Asset**:
   - **Iniziata da RFB**:
     - RFB imposta `RichiediAttrezzo = true` e la `DataRichiestaAttr`
     - Notifiche in-app e email inviate a RFA
   
   - **Iniziata da RFA**:
     - RFA imposta `RestituisciPrestito = true` e la `DataRestituzionePres`
     - RFA può allegare DDT (`FileDDTVisualizz`)
     - Notifiche in-app e email inviate a RFB

5. **Completamento del Prestito**:
   - RFB imposta `PrestitoTerminato = true` e la `DataTerminePrestito`
   - Asset torna disponibile per altre richieste

### 2.2 Gestione delle Manutenzioni
- Attualmente solo tracking delle date, non esiste un processo completo
- Il sistema registra `DataUltimaManutenzio` e `DataProssManutenzio`
- Lo stato dell'asset può essere impostato a "In manutenzione" tramite `StatoDotazioneTecnic`

## 3. Requisiti di Sistema Dettagliati

### 3.1 Volume Dati e Utenza
- **Utenti**: circa 300 totali, 100 concorrenti
- **Filiali**: circa 100
- **Asset**: circa 20.000 totali
- **Documenti**: volume non specificato, ma da considerare per dimensionamento storage

### 3.2 Requisiti di Prestazioni
- Tempi di risposta rapidi per operazioni CRUD di base
- Ottimizzazione per visualizzazione di elenchi filtrati
- Gestione efficiente delle notifiche

### 3.3 Interfaccia Utente
- Sviluppo basato su mockup (da realizzare)
- Interfaccia responsive
- Visualizzazioni personalizzabili per colonne e menu
- Gestione efficiente di tab multipli per ogni entità

## 4. Integrazione e Sicurezza

### 4.1 Gestione Documentale
- Allegati per asset (DDT e altri documenti)
- Supporto per documenti di vario tipo
- Versionamento dei documenti

### 4.2 Import/Export
- Formati supportati: XLSX, CSV, XLS, ODS
- Aggiornamento massivo di record esistenti
- Validazione dati in fase di import

### 4.3 Sicurezza
- Autenticazione username/password con JWT
- Controllo accessi granulare a livello di:
  - Filiale
  - Tipologia di asset
  - Operazioni (lettura, scrittura, cancellazione)
  - Singoli campi

## 5. Note Tecniche per l'Implementazione

### 5.1 Database
- PostgreSQL 17
- Utilizzo di tabelle padre-figlio per ereditarietà
- Struttura ottimizzata per storico modifiche
- Convenzioni di naming come da DDL fornito (ma modificabili)

### 5.2 Backend
- Nodejs 22+ (expressjs come framework)
- API RESTful
- JWT per autenticazione
- Implementazione multi-tenant

### 5.3 Frontend
- Vuejs 3.5+
- Componenti UI personalizzabili
- Dashboard con grafici
- Visualizzazione di tab multipli per ogni entità

### 5.4 Deployment
- Containerizzazione con Docker
- Deployment su Kubernetes
- Cache Redis
