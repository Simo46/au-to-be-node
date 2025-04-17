# Sistema di Permessi per Asset Management

## Panoramica dei Ruoli

Il sistema prevede i seguenti ruoli con permessi specifici:

1. **Amministratore di Sistema**
   * Accesso completo a tutte le funzionalità del sistema
   * Gestione utenti e ruoli
   * Configurazione globale del sistema

2. **Ufficio Tecnico**
   * Supervisione e amministrazione tecnica completa
   * Gestione globale degli asset e delle infrastrutture
   * Accesso a tutte le funzionalità operative

3. **Ufficio Post Vendita**
   * Gestione documentale
   * Supervisione asset e spostamenti
   * Accesso a reportistica globale

4. **Area Manager**
   * Gestione delle filiali nella propria area geografica
   * Supervisione degli asset nella propria area
   * Accesso a reportistica dell'area

5. **Responsabile Filiale**
   * Gestione operativa della propria filiale
   * Gestione asset e spostamenti della propria filiale
   * Reportistica limitata alla propria filiale

6. **Responsabile Officina e Service**
   * Gestione operativa delle attrezzature in officina
   * Gestione delle richieste di spostamento
   * Manutenzione degli asset

7. **Magazzino**
   * Gestione inventario attrezzature
   * Limitato alle operazioni di base sugli asset
   * Allegamento documenti di trasporto

## Dettaglio Permessi per Ruolo

### Permessi per Area Funzionale

| Ruolo | Gestione Filiali | Gestione Asset | Gestione Manutenzione | Gestione Documenti | Gestione Fornitori | Gestione Spostamenti | Reportistica |
|-------|------------------|----------------|----------------------|--------------------|--------------------|----------------------|--------------|
| Amministratore di Sistema | Completa | Completa | Completa | Completa | Completa | Completa | Completa |
| Ufficio Tecnico | Completa | Completa | Completa | Completa | Completa | Completa | Completa |
| Ufficio Post Vendita | Sola lettura (tutte) | Lettura/Modifica | Lettura/Modifica | Completa | Sola lettura | Completa | Completa |
| Area Manager | Sola lettura (area) | Lettura/Modifica (area) | Lettura/Modifica (area) | Sola lettura | Sola lettura | Sola lettura (area) | Area |
| Responsabile Filiale | Sola lettura (propria) | Completa (propria) | Completa (propria) | Lettura/Download | Lettura/Modifica | Completa (propria) | Filiale |
| Resp. Officina e Service | Sola lettura (propria) | Lettura/Modifica (propria) | Lettura/Modifica (propria) | Nessuno | Lettura/Modifica | Richiesta/Lettura | Officina |
| Magazzino | Nessuno | Gestione inventario | Nessuno | Allegare DDT | Nessuno | Nessuno | Inventario |

### Permessi Dettagliati

#### Responsabile Officina e Service
- **Gestione Asset**:
  - Inserimento/modifica attrezzi della propria filiale
  - Modifica scadenze manutenzione attrezzi della propria filiale
  - Visualizzazione attrezzi di altre filiali (per richieste di prestito)
- **Gestione Fornitori**:
  - Visualizzazione elenco fornitori
  - Inserimento/modifica fornitori
- **Gestione Spostamenti**:
  - Richiesta spostamento attrezzi da altre filiali
  - Visualizzazione stato spostamenti
  - Allegare documenti di trasporto (DDT)
- **Reportistica**:
  - Visualizzazione report relativi agli attrezzi della propria officina

#### Magazzino
- **Gestione Asset**:
  - Inserimento/modifica attrezzi della propria filiale (limitato all'inventario)
  - Allegare documenti di trasporto (DDT)
- **Reportistica**:
  - Visualizzazione report di inventario

#### Responsabile Filiale
- **Gestione Asset**:
  - Inserimento/modifica attrezzi della propria filiale
  - Modifica scadenze manutenzione attrezzi della propria filiale
  - Visualizzazione attrezzi di altre filiali
- **Gestione Fornitori**:
  - Visualizzazione elenco fornitori
  - Inserimento/modifica fornitori
- **Gestione Documenti**:
  - Download documenti
- **Gestione Spostamenti**:
  - Richiesta spostamento attrezzi
  - Visualizzazione stato spostamenti
  - Allegare documenti di trasporto (DDT)
- **Reportistica**:
  - Visualizzazione report relativi alla propria filiale

#### Area Manager
- **Gestione Filiali**:
  - Visualizzazione dettagli filiali della propria area
- **Gestione Asset**:
  - Inserimento/modifica attrezzi delle filiali della propria area
  - Modifica scadenze manutenzione delle filiali della propria area
  - Visualizzazione attrezzi di tutte le filiali della propria area
- **Gestione Spostamenti**:
  - Visualizzazione stato spostamenti della propria area
  - Modifica controllo attrezzi avuti in prestito
- **Reportistica**:
  - Visualizzazione report relativi all'area gestita

#### Ufficio Tecnico
- Accesso completo a tutte le funzionalità del sistema
- Amministrazione tecnica globale

#### Ufficio Post Vendita
- **Gestione Asset**:
  - Inserimento/modifica attrezzi di tutte le filiali
  - Modifica scadenze manutenzione di tutte le filiali
- **Gestione Documenti**:
  - Inserimento documenti
  - Download documenti
- **Gestione Spostamenti**:
  - Richiesta spostamento attrezzi
  - Visualizzazione stato spostamenti
  - Modifica controllo attrezzi avuti in prestito
  - Allegare documenti di trasporto (DDT)
- **Reportistica**:
  - Visualizzazione report globali

## Permessi per Operazioni Specifiche

| Operazione | Amministratore | Ufficio Tecnico | Ufficio Post Vendita | Area Manager | Resp. Filiale | Resp. Officina | Magazzino |
|------------|----------------|-----------------|----------------------|--------------|---------------|----------------|-----------|
| Inserimento filiali | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Modifica filiali | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Inserimento documenti | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Download documenti | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Lettura filiale di appartenenza | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lettura filiali del gruppo | ✓ | ✓ | ✓ | ✓ (area) | ✗ | ✗ | ✗ |
| Inserimento/modifica fornitori | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Visualizzazione elenco fornitori | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Inserimento contratto | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Modifica contratto | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Inserimento/modifica attrezzi | ✓ | ✓ | ✓ | ✓ (area) | ✓ (filiale) | ✓ (filiale) | ✓ (filiale) |
| Modifica scadenza attrezzi | ✓ | ✓ | ✓ | ✓ (area) | ✓ (filiale) | ✓ (filiale) | ✗ |
| Richiesta spostamento | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Visualizzazione attrezzi altre filiali | ✓ | ✓ | ✓ | ✓ (area) | ✓ | ✓ | ✗ |
| Visualizzazione situazione spostamenti | ✓ | ✓ | ✓ | ✓ (area) | ✓ | ✓ | ✗ |
| Modifica controllo attrezzi in prestito | ✓ | ✓ | ✓ | ✓ (area) | ✗ | ✗ | ✗ |
| Allegare DDT | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| Gestione utenti e ruoli | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Configurazione sistema | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |