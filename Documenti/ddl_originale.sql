/*LEGENDA dei COMMENTI piú utili
DESCR: il nome visualizzato a frontend dall'utente per quella colonna. Dare prioritá a questo valore (senza spazi) come nome della colonna (oppure sceglierne uno piú adatto), dato che il nome vero della colonna a volte é fuorviante.
ACTIVE: true/false indica se quella colonna é attiva cioé se é utilizzata. Nel caso sia false si puó tranquillamente ignorare
REFERENCEDOM: <valore> indica prima di tutto che é una reference quindi una foreign key di solito 1 a n e di solito trovi la tabella con questo "legame" come Map_<valore>
BASEDSP: false/true di solito in frontend é un flag e quindi qui indica il valore di default a frontend (anche se dovrebbe bastare il default del database)
GROUP: <valore> anche in questo caso é piú che altro un'indicazione frontend: rappresenta un raggruppamento di dati dello stesso tipo (ad esempio "Filiali Identificazione e Contatti" raggruppa i dati di contatto di una filiale)
*/
-- public."Class" definition

-- Drop table

-- DROP TABLE public."Class";

CREATE TABLE public."Class" (
	"Id" int8 DEFAULT _cm3_utils_new_card_id() NOT NULL, -- MODE: syshidden
	"IdClass" regclass NOT NULL, -- MODE: syshidden
	"Code" varchar(100) NULL, -- MODE: write|DESCR: Code|INDEX: 1|BASEDSP: true
	"Description" varchar(250) NULL, -- MODE: write|DESCR: Description|INDEX: 2|BASEDSP: true
	"Status" bpchar(1) NULL, -- MODE: reserved
	"User" varchar(100) NULL, -- MODE: reserved
	"BeginDate" timestamptz DEFAULT now() NOT NULL, -- MODE: reserved
	"Notes" text NULL, -- MODE: protected|DESCR: Notes|INDEX: 3
	"EndDate" timestamptz NULL, -- MODE: reserved
	"CurrentId" int8 NOT NULL, -- MODE: reserved
	"IdTenant" int8 NULL, -- MODE: syshidden
	CONSTRAINT "Class_pkey" PRIMARY KEY ("Id")
);
CREATE INDEX "_cm3_Class_Code" ON public."Class" USING btree ("Code");
CREATE INDEX "_cm3_Class_Description" ON public."Class" USING btree ("Description");
CREATE INDEX idx_idclass_id ON public."Class" USING btree ("IdClass", "Id");
COMMENT ON TABLE public."Class" IS 'MODE: protected|TYPE: class|DESCR: Class|SUPERCLASS: true';

-- Column comments

COMMENT ON COLUMN public."Class"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Class"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Class"."Code" IS 'MODE: write|DESCR: Code|INDEX: 1|BASEDSP: true';
COMMENT ON COLUMN public."Class"."Description" IS 'MODE: write|DESCR: Description|INDEX: 2|BASEDSP: true';
COMMENT ON COLUMN public."Class"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Class"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Class"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Class"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Class"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Class"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Class"."IdTenant" IS 'MODE: syshidden';


-- public."Assets" definition

-- Drop table

-- DROP TABLE public."Assets";

CREATE TABLE public."Assets" (
	"Test" int8 NULL, -- MODE: write|DESCR: Test|INDEX: 4|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: StanzaAsset
	CONSTRAINT "Assets_pkey" PRIMARY KEY ("Id")
)
INHERITS (public."Class");
COMMENT ON TABLE public."Assets" IS 'MODE: all|TYPE: class|DESCR: Assets|SUPERCLASS: true';

-- Column comments

COMMENT ON COLUMN public."Assets"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Assets"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Assets"."Code" IS 'MODE: write|DESCR: Codice|INDEX: 1|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Assets"."Description" IS 'MODE: write|DESCR: Descrizione|INDEX: 2|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Assets"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Assets"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Assets"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Assets"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Assets"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Assets"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Assets"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Assets"."Test" IS 'MODE: write|DESCR: Test|INDEX: 4|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: StanzaAsset';


-- public."Strumenti" definition

-- Drop table

-- DROP TABLE public."Strumenti";

CREATE TABLE public."Strumenti" (
	"Marca" varchar(255) NULL, -- MODE: write|DESCR: Marca|INDEX: 3|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"Modello" varchar(255) NULL, -- MODE: write|DESCR: Modello|INDEX: 6|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"Matricola" varchar(50) NULL, -- MODE: write|DESCR: Matricola|INDEX: 7|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"Fornitore" int8 NULL, -- MODE: write|DESCR: Fornitore|INDEX: 8|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FornitoreDotazione
	"DataUltimaManutenzio" date NULL, -- MODE: write|DESCR: Data Ultima Manutenzione|INDEX: 11|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"FrequenzaManutenzion" int4 NULL, -- MODE: write|DESCR: Frequenza Manutenzione|INDEX: 13|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"StatoInterventi" int8 NULL, -- MODE: write|DESCR: Stato Interventi|INDEX: 14|ACTIVE: true|LOOKUP: StatoInterventiDotazioni|BASEDSP: false|EDITORTYPE: PLAIN
	"CodiceTracker" varchar(50) NULL, -- MODE: write|DESCR: Codice Tracker|INDEX: 15|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN
	"StatoDotazioneTecnic" int8 NULL, -- MODE: write|DESCR: Stato|INDEX: 9|ACTIVE: true|LOOKUP: StatoDotazione|BASEDSP: false|EDITORTYPE: PLAIN
	"TipoDiPossesso" int8 NULL, -- MODE: write|DESCR: Tipologia di Possesso|INDEX: 10|ACTIVE: true|LOOKUP: TipoPossessoDotazione|BASEDSP: false|EDITORTYPE: PLAIN
	"DataProssManutenzio" date NULL, -- MODE: write|DESCR: Data Prossima Manutenzione|INDEX: 12|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"AppartieneaFiliale" int8 NULL, -- MODE: write|DESCR: Appartiene a Filiale|INDEX: 4|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialiLista
	CONSTRAINT "Strumenti_pkey" PRIMARY KEY ("Id"),
	CONSTRAINT "_cm3_Code_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Code" IS NOT NULL))),
	CONSTRAINT "_cm3_Marca_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Marca" IS NOT NULL))),
	CONSTRAINT "_cm3_Matricola_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Matricola" IS NOT NULL))),
	CONSTRAINT "_cm3_Modello_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Modello" IS NOT NULL)))
)
INHERITS (public."Assets");
COMMENT ON TABLE public."Strumenti" IS 'MODE: all|TYPE: class|DESCR: Dotazioni Tecniche|SUPERCLASS: true';

-- Column comments

COMMENT ON COLUMN public."Strumenti"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Strumenti"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Strumenti"."Code" IS 'MODE: write|DESCR: Codice|INDEX: 1|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."Description" IS 'MODE: hidden|DESCR: Descrizione|INDEX: 2|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Strumenti"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Strumenti"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Strumenti"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Strumenti"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Strumenti"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Strumenti"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Strumenti"."Test" IS 'MODE: write|DESCR: Test|INDEX: 5|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: StanzaAsset';
COMMENT ON COLUMN public."Strumenti"."Marca" IS 'MODE: write|DESCR: Marca|INDEX: 3|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."Modello" IS 'MODE: write|DESCR: Modello|INDEX: 6|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."Matricola" IS 'MODE: write|DESCR: Matricola|INDEX: 7|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."Fornitore" IS 'MODE: write|DESCR: Fornitore|INDEX: 8|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FornitoreDotazione';
COMMENT ON COLUMN public."Strumenti"."DataUltimaManutenzio" IS 'MODE: write|DESCR: Data Ultima Manutenzione|INDEX: 11|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."FrequenzaManutenzion" IS 'MODE: write|DESCR: Frequenza Manutenzione|INDEX: 13|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."StatoInterventi" IS 'MODE: write|DESCR: Stato Interventi|INDEX: 14|ACTIVE: true|LOOKUP: StatoInterventiDotazioni|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."CodiceTracker" IS 'MODE: write|DESCR: Codice Tracker|INDEX: 15|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."StatoDotazioneTecnic" IS 'MODE: write|DESCR: Stato|INDEX: 9|ACTIVE: true|LOOKUP: StatoDotazione|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."TipoDiPossesso" IS 'MODE: write|DESCR: Tipologia di Possesso|INDEX: 10|ACTIVE: true|LOOKUP: TipoPossessoDotazione|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."DataProssManutenzio" IS 'MODE: write|DESCR: Data Prossima Manutenzione|INDEX: 12|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Strumenti"."AppartieneaFiliale" IS 'MODE: write|DESCR: Appartiene a Filiale|INDEX: 4|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialiLista';


-- public."Attrezzature" definition

-- Drop table

-- DROP TABLE public."Attrezzature";

CREATE TABLE public."Attrezzature" (
	"AltroFornitore" int8 NULL, -- MODE: write|DESCR: Altro Fornitore|GROUP: Attrezzature Dati Generali|INDEX: 8|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: Dotazione
	"SuperTool" bool NULL, -- MODE: write|DESCR: SuperTool|GROUP: Attrezzature Dati Generali|INDEX: 17|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"AppartieneaPiano" int8 NULL, -- MODE: write|DESCR: Appartiene a Piano|GROUP: Attrezzature Sezione|INDEX: 19|ACTIVE: true|FILTER: from Piani where Id in (/(select * FROM public.filter_cql_piani(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: PianiLista
	"AppartieneaEdificio" int8 NULL, -- MODE: write|DESCR: Appartiene a Edificio|GROUP: Attrezzature Sezione|INDEX: 20|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:AppartieneaFiliale.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: EdificiLista
	"AppartieneaLocale" int8 NULL, -- MODE: write|DESCR: Appartiene a Locale|GROUP: Attrezzature Sezione|INDEX: 21|ACTIVE: true|FILTER: from Stanze where Id in (/(select * FROM public.filter_cql_locali(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id},0{client:AppartieneaPiano.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: LocaliLista
	"Spostamento" int8 NULL, -- MODE: read|DESCR: Spostamento verso la Filiale Richiedente|GROUP: Attrezzature Richiesta di Prestito|INDEX: 26|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: Spostamento
	"DatadiSpostamento" date NULL, -- MODE: write|DESCR: Data di invio della richiesta di spostamento|GROUP: Attrezzature Richiesta di Prestito|INDEX: 28|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"RichiedoilPrestito" bool NULL, -- MODE: write|DESCR: Richiedo in Prestito|GROUP: Attrezzature Richiesta di Prestito|INDEX: 22|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"AttrezzoinPrestito" bool NULL, -- MODE: write|DESCR: Prestito Accettato|GROUP: Attrezzature Richiesta di Prestito|INDEX: 23|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DatadiInvio" date NULL, -- MODE: write|DESCR: Data di invio dell'Attrezzo|GROUP: Attrezzature Richiesta di Prestito|INDEX: 27|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PrestitoRicevuto" bool NULL, -- MODE: write|DESCR: Prestito Ricevuto|GROUP: Attrezzature Richiesta di Prestito|INDEX: 29|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataRicezionePresti" date NULL, -- MODE: write|DESCR: Data di ricezione|GROUP: Attrezzature Richiesta di Prestito|INDEX: 32|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"RichiediAttrezzo" bool NULL, -- MODE: write|DESCR: Richiesta restituzione prestito|GROUP: Attrezzature Restituzione Prestito|INDEX: 30|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataRichiestaAttr" date NULL, -- MODE: write|DESCR: Data di richiesta dell'attrezzo|GROUP: Attrezzature Restituzione Prestito|INDEX: 31|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"RestituisciPrestito" bool NULL, -- MODE: write|DESCR: Restituisci l'attrezzo in prestito|GROUP: Attrezzature Restituzione Prestito|INDEX: 33|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataRestituzionePres" date NULL, -- MODE: write|DESCR: Data di restituzione del prestito|GROUP: Attrezzature Restituzione Prestito|INDEX: 34|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Richiedente" int8 NULL, -- MODE: read|DESCR: Filiale richiedente|GROUP: Attrezzature Richiesta di Prestito|INDEX: 35|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: Richiedente
	"Spostamento_Filiali" int8 NULL, -- MODE: read|DESCR: Spostamento|INDEX: 36|ACTIVE: false|LOOKUP: Filiali|BASEDSP: false|EDITORTYPE: PLAIN
	"PrestitoTerminato" bool NULL, -- MODE: write|DESCR: Prestito Terminato|GROUP: Attrezzature Restituzione Prestito|INDEX: 37|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataTerminePrestito" date NULL, -- MODE: write|DESCR: Data Termine Prestito|GROUP: Attrezzature Restituzione Prestito|INDEX: 38|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Categoria" int8 NULL, -- MODE: write|DESCR: Categoria|GROUP: Attrezzature Categoria di Appartenenza|INDEX: 39|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: CategorieAttrezzatur
	"PrestitoRifiutato" bool NULL, -- MODE: write|DESCR: Prestito Rifiutato|GROUP: Attrezzature Richiesta di Prestito|INDEX: 24|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataPresRifiutato" date NULL, -- MODE: write|DESCR: Data del Prestito Rifiutato|GROUP: Attrezzature Richiesta di Prestito|INDEX: 25|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Descrizione" varchar(250) NULL, -- MODE: write|DESCR: Descrizione|GROUP: Attrezzature Dati Generali|INDEX: 4|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"FileDDTResp" int8 NULL, -- MODE: write|DESCR: Allega il documento di trasporto|GROUP: Attrezzature Richiesta di Prestito|INDEX: 40|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel
	"FileDDTVisualizz" int8 NULL, -- MODE: write|DESCR: Allega il documento di trasporto|GROUP: Attrezzature Restituzione Prestito|INDEX: 41|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel
	"Scatola" varchar(50) NULL, -- MODE: write|DESCR: Scatola|GROUP: Attrezzature Dati Generali|INDEX: 42|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Scaffale" varchar(50) NULL, -- MODE: write|DESCR: Scaffale|GROUP: Attrezzature Dati Generali|INDEX: 43|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DatadiAcquisto" date NULL, -- MODE: write|DESCR: Data di Acquisto|GROUP: Attrezzature Dati Generali|INDEX: 44|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	CONSTRAINT "Attrezzature_pkey" PRIMARY KEY ("Id"),
	CONSTRAINT "_cm3_AppartieneaFiliale_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("AppartieneaFiliale" IS NOT NULL))),
	CONSTRAINT "_cm3_IdClass_check" CHECK ((("IdClass")::oid = ('"Attrezzature"'::regclass)::oid))
)
INHERITS (public."Strumenti");
CREATE INDEX "_cm3_Attrezzature_Code" ON public."Attrezzature" USING btree ("Code") WHERE ("Status" = 'A'::bpchar);
CREATE INDEX "_cm3_Attrezzature_Description" ON public."Attrezzature" USING btree ("Description") WHERE ("Status" = 'A'::bpchar);
COMMENT ON TABLE public."Attrezzature" IS 'MODE: all|TYPE: class|DESCR: Attrezzature|SUPERCLASS: false';

-- Column comments

COMMENT ON COLUMN public."Attrezzature"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Attrezzature"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Attrezzature"."Code" IS 'MODE: write|DESCR: Codice|GROUP: Attrezzature Dati Generali|INDEX: 2|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Description" IS 'MODE: read|DESCR: Descrizione2|GROUP: Attrezzature Dati Generali|INDEX: 3|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Attrezzature"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Attrezzature"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Attrezzature"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Attrezzature"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Attrezzature"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Attrezzature"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Attrezzature"."Test" IS 'MODE: write|DESCR: Test|INDEX: 6|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: StanzaAsset';
COMMENT ON COLUMN public."Attrezzature"."Marca" IS 'MODE: write|DESCR: Marca|GROUP: Attrezzature Dati Generali|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Modello" IS 'MODE: write|DESCR: Modello|GROUP: Attrezzature Dati Generali|INDEX: 9|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Matricola" IS 'MODE: write|DESCR: Matricola|GROUP: Attrezzature Dati Generali|INDEX: 10|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Fornitore" IS 'MODE: write|DESCR: Fornitore|GROUP: Attrezzature Dati Generali|INDEX: 7|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FornitoreDotazione';
COMMENT ON COLUMN public."Attrezzature"."DataUltimaManutenzio" IS 'MODE: write|DESCR: Data Ultima Manutenzione|GROUP: Attrezzature Dati Generali|INDEX: 13|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."FrequenzaManutenzion" IS 'MODE: write|DESCR: Frequenza Manutenzione|GROUP: Attrezzature Dati Generali|INDEX: 15|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."StatoInterventi" IS 'MODE: write|DESCR: Stato Interventi|GROUP: Attrezzature Dati Generali|INDEX: 16|ACTIVE: true|LOOKUP: StatoInterventiDotazioni|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."CodiceTracker" IS 'MODE: write|DESCR: Codice Tracker|INDEX: 18|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."StatoDotazioneTecnic" IS 'MODE: write|DESCR: Stato|GROUP: Attrezzature Dati Generali|INDEX: 11|ACTIVE: true|LOOKUP: StatoDotazione|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."TipoDiPossesso" IS 'MODE: write|DESCR: Tipologia di Possesso|GROUP: Attrezzature Dati Generali|INDEX: 12|ACTIVE: true|LOOKUP: TipoPossessoDotazione|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."DataProssManutenzio" IS 'MODE: write|DESCR: Data Prossima Manutenzione|GROUP: Attrezzature Dati Generali|INDEX: 14|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."AppartieneaFiliale" IS 'MODE: write|DESCR: Appartiene a Filiale|GROUP: Attrezzature Location|INDEX: 1|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialiLista';
COMMENT ON COLUMN public."Attrezzature"."AltroFornitore" IS 'MODE: write|DESCR: Altro Fornitore|GROUP: Attrezzature Dati Generali|INDEX: 8|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: Dotazione';
COMMENT ON COLUMN public."Attrezzature"."SuperTool" IS 'MODE: write|DESCR: SuperTool|GROUP: Attrezzature Dati Generali|INDEX: 17|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."AppartieneaPiano" IS 'MODE: write|DESCR: Appartiene a Piano|GROUP: Attrezzature Sezione|INDEX: 19|ACTIVE: true|FILTER: from Piani where Id in (/(select * FROM public.filter_cql_piani(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: PianiLista';
COMMENT ON COLUMN public."Attrezzature"."AppartieneaEdificio" IS 'MODE: write|DESCR: Appartiene a Edificio|GROUP: Attrezzature Sezione|INDEX: 20|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:AppartieneaFiliale.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: EdificiLista';
COMMENT ON COLUMN public."Attrezzature"."AppartieneaLocale" IS 'MODE: write|DESCR: Appartiene a Locale|GROUP: Attrezzature Sezione|INDEX: 21|ACTIVE: true|FILTER: from Stanze where Id in (/(select * FROM public.filter_cql_locali(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id},0{client:AppartieneaPiano.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: LocaliLista';
COMMENT ON COLUMN public."Attrezzature"."Spostamento" IS 'MODE: read|DESCR: Spostamento verso la Filiale Richiedente|GROUP: Attrezzature Richiesta di Prestito|INDEX: 26|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: Spostamento';
COMMENT ON COLUMN public."Attrezzature"."DatadiSpostamento" IS 'MODE: write|DESCR: Data di invio della richiesta di spostamento|GROUP: Attrezzature Richiesta di Prestito|INDEX: 28|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."RichiedoilPrestito" IS 'MODE: write|DESCR: Richiedo in Prestito|GROUP: Attrezzature Richiesta di Prestito|INDEX: 22|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."AttrezzoinPrestito" IS 'MODE: write|DESCR: Prestito Accettato|GROUP: Attrezzature Richiesta di Prestito|INDEX: 23|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."DatadiInvio" IS 'MODE: write|DESCR: Data di invio dell''Attrezzo|GROUP: Attrezzature Richiesta di Prestito|INDEX: 27|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."PrestitoRicevuto" IS 'MODE: write|DESCR: Prestito Ricevuto|GROUP: Attrezzature Richiesta di Prestito|INDEX: 29|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."DataRicezionePresti" IS 'MODE: write|DESCR: Data di ricezione|GROUP: Attrezzature Richiesta di Prestito|INDEX: 32|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."RichiediAttrezzo" IS 'MODE: write|DESCR: Richiesta restituzione prestito|GROUP: Attrezzature Restituzione Prestito|INDEX: 30|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."DataRichiestaAttr" IS 'MODE: write|DESCR: Data di richiesta dell''attrezzo|GROUP: Attrezzature Restituzione Prestito|INDEX: 31|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."RestituisciPrestito" IS 'MODE: write|DESCR: Restituisci l''attrezzo in prestito|GROUP: Attrezzature Restituzione Prestito|INDEX: 33|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."DataRestituzionePres" IS 'MODE: write|DESCR: Data di restituzione del prestito|GROUP: Attrezzature Restituzione Prestito|INDEX: 34|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Richiedente" IS 'MODE: read|DESCR: Filiale richiedente|GROUP: Attrezzature Richiesta di Prestito|INDEX: 35|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: Richiedente';
COMMENT ON COLUMN public."Attrezzature"."Spostamento_Filiali" IS 'MODE: read|DESCR: Spostamento|INDEX: 36|ACTIVE: false|LOOKUP: Filiali|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."PrestitoTerminato" IS 'MODE: write|DESCR: Prestito Terminato|GROUP: Attrezzature Restituzione Prestito|INDEX: 37|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."DataTerminePrestito" IS 'MODE: write|DESCR: Data Termine Prestito|GROUP: Attrezzature Restituzione Prestito|INDEX: 38|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Categoria" IS 'MODE: write|DESCR: Categoria|GROUP: Attrezzature Categoria di Appartenenza|INDEX: 39|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: CategorieAttrezzatur';
COMMENT ON COLUMN public."Attrezzature"."PrestitoRifiutato" IS 'MODE: write|DESCR: Prestito Rifiutato|GROUP: Attrezzature Richiesta di Prestito|INDEX: 24|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."DataPresRifiutato" IS 'MODE: write|DESCR: Data del Prestito Rifiutato|GROUP: Attrezzature Richiesta di Prestito|INDEX: 25|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Descrizione" IS 'MODE: write|DESCR: Descrizione|GROUP: Attrezzature Dati Generali|INDEX: 4|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."FileDDTResp" IS 'MODE: write|DESCR: Allega il documento di trasporto|GROUP: Attrezzature Richiesta di Prestito|INDEX: 40|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel';
COMMENT ON COLUMN public."Attrezzature"."FileDDTVisualizz" IS 'MODE: write|DESCR: Allega il documento di trasporto|GROUP: Attrezzature Restituzione Prestito|INDEX: 41|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel';
COMMENT ON COLUMN public."Attrezzature"."Scatola" IS 'MODE: write|DESCR: Scatola|GROUP: Attrezzature Dati Generali|INDEX: 42|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."Scaffale" IS 'MODE: write|DESCR: Scaffale|GROUP: Attrezzature Dati Generali|INDEX: 43|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Attrezzature"."DatadiAcquisto" IS 'MODE: write|DESCR: Data di Acquisto|GROUP: Attrezzature Dati Generali|INDEX: 44|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';


-- public."ImpiantiTecnologici" definition

-- Drop table

-- DROP TABLE public."ImpiantiTecnologici";

CREATE TABLE public."ImpiantiTecnologici" (
	"TipoAlimentazione" int8 NULL, -- MODE: write|DESCR: Tipologia di Alimentazione|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 13|ACTIVE: true|LOOKUP: TipologiaAlimentazioneImpiantoTecnologico|BASEDSP: false|EDITORTYPE: PLAIN
	"AppartieneaPiano" int8 NULL, -- MODE: write|DESCR: Appartiene a Piano|GROUP: ImpiantiTecnologici Sezione|INDEX: 19|ACTIVE: true|FILTER: from Piani where Id in (/(select * FROM public.filter_cql_piani(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: PianiLista
	"AppartieneaEdificio" int8 NULL, -- MODE: write|DESCR: Appartiene a Edificio|GROUP: ImpiantiTecnologici Sezione|INDEX: 20|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:AppartieneaFiliale.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: EdificiLista
	"AppartieneaLocale" int8 NULL, -- MODE: write|DESCR: Appartiene a Locale|GROUP: ImpiantiTecnologici Sezione|INDEX: 21|ACTIVE: true|FILTER: from Stanze where Id in (/(select * FROM public.filter_cql_locali(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id},0{client:AppartieneaPiano.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: LocaliLista
	"Categoria" int8 NULL, -- MODE: write|DESCR: Categoria|GROUP: ImpiantiTecnologici Categoria di Appartenenza|INDEX: 22|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: CategorieImpTecn
	"Descrizione" varchar(250) NULL, -- MODE: write|DESCR: Descrizione|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"RichiedoilPrestito" bool NULL, -- MODE: write|DESCR: Richiedo il Prestito|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 23|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"AttrezzoinPrestito" bool NULL, -- MODE: write|DESCR: Prestito Accettato|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 24|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PrestitoRifiutato" bool NULL, -- MODE: write|DESCR: Prestito Rifiutato|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 25|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataPresRifiutato" date NULL, -- MODE: write|DESCR: Data del Prestito Rifiutato|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 26|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Spostamento" int8 NULL, -- MODE: read|DESCR: Spostamento verso la Filiale Richiedente|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 27|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: Spostamento
	"DatadiInvio" date NULL, -- MODE: write|DESCR: Data di invio dell'Attrezzo|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 28|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DatadiSpostamento" date NULL, -- MODE: write|DESCR: Data di invio della richiesta di spostamento|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 29|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PrestitoRicevuto" bool NULL, -- MODE: write|DESCR: Prestito Ricevuto|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 30|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"RichiediAttrezzo" bool NULL, -- MODE: write|DESCR: Richiesta restituzione prestito|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 31|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataRichiestaAttr" date NULL, -- MODE: write|DESCR: Data di richiesta dell'attrezzo|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 32|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataRicezionePresti" date NULL, -- MODE: write|DESCR: Data di ricezione|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 33|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"RestituisciPrestito" bool NULL, -- MODE: write|DESCR: Restituisci l'attrezzo in prestito|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 34|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataRestituzionePres" date NULL, -- MODE: write|DESCR: Data di restituzione del prestito|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 35|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Richiedente" int8 NULL, -- MODE: read|DESCR: Filiale richiedente|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 36|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: RichiedenteImpianti
	"PrestitoTerminato" bool NULL, -- MODE: write|DESCR: Prestito Terminato|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 37|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DataTerminePrestito" date NULL, -- MODE: write|DESCR: Data Termine Prestito|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 38|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"FileDDTResp" int8 NULL, -- MODE: write|DESCR: Allega il documento di trasporto|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 39|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel
	"FileDDTVisualizz" int8 NULL, -- MODE: write|DESCR: Allega il documento di trasporto|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 40|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel
	"Scatola" varchar(250) NULL, -- MODE: write|DESCR: Scatola|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 41|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Scaffale" varchar(250) NULL, -- MODE: write|DESCR: Scaffale|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 42|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DatadiAcquisto" date NULL, -- MODE: write|DESCR: Data di Acquisto|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 43|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	CONSTRAINT "ImpiantiTecnologici_pkey" PRIMARY KEY ("Id"),
	CONSTRAINT "_cm3_IdClass_check" CHECK ((("IdClass")::oid = ('"ImpiantiTecnologici"'::regclass)::oid))
)
INHERITS (public."Strumenti");
CREATE INDEX "_cm3_ImpiantiTecnologici_Code" ON public."ImpiantiTecnologici" USING btree ("Code") WHERE ("Status" = 'A'::bpchar);
CREATE INDEX "_cm3_ImpiantiTecnologici_Description" ON public."ImpiantiTecnologici" USING btree ("Description") WHERE ("Status" = 'A'::bpchar);
COMMENT ON TABLE public."ImpiantiTecnologici" IS 'MODE: all|TYPE: class|DESCR: Impianti Tecnologici|SUPERCLASS: false';

-- Column comments

COMMENT ON COLUMN public."ImpiantiTecnologici"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."ImpiantiTecnologici"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Code" IS 'MODE: write|DESCR: Codice|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 2|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Description" IS 'MODE: read|DESCR: Descrizione 2|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 4|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."ImpiantiTecnologici"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."ImpiantiTecnologici"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."ImpiantiTecnologici"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."ImpiantiTecnologici"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."ImpiantiTecnologici"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Test" IS 'MODE: write|DESCR: Test|INDEX: 7|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: StanzaAsset';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Marca" IS 'MODE: write|DESCR: Marca|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 6|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Modello" IS 'MODE: write|DESCR: Modello|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 8|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Matricola" IS 'MODE: write|DESCR: Matricola|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 9|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Fornitore" IS 'MODE: write|DESCR: Fornitore|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 10|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FornitoreDotazione';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DataUltimaManutenzio" IS 'MODE: write|DESCR: Data Ultima Manutenzione|GROUP: ImpiantiTecnologici Manutenzione|INDEX: 14|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."FrequenzaManutenzion" IS 'MODE: write|DESCR: Frequenza Manutenzione|GROUP: ImpiantiTecnologici Manutenzione|INDEX: 16|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."StatoInterventi" IS 'MODE: write|DESCR: Stato Interventi|GROUP: ImpiantiTecnologici Manutenzione|INDEX: 17|ACTIVE: true|LOOKUP: StatoInterventiDotazioni|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."CodiceTracker" IS 'MODE: write|DESCR: Codice Tracker|INDEX: 18|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."StatoDotazioneTecnic" IS 'MODE: write|DESCR: Stato|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 11|ACTIVE: true|LOOKUP: StatoDotazione|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."TipoDiPossesso" IS 'MODE: write|DESCR: Tipologia di Possesso|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 12|ACTIVE: true|LOOKUP: TipoPossessoDotazione|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DataProssManutenzio" IS 'MODE: write|DESCR: Data Prossima Manutenzione|GROUP: ImpiantiTecnologici Manutenzione|INDEX: 15|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."AppartieneaFiliale" IS 'MODE: write|DESCR: Appartiene a Filiale|GROUP: ImpiantiTecnologici Location|INDEX: 1|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialiLista';
COMMENT ON COLUMN public."ImpiantiTecnologici"."TipoAlimentazione" IS 'MODE: write|DESCR: Tipologia di Alimentazione|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 13|ACTIVE: true|LOOKUP: TipologiaAlimentazioneImpiantoTecnologico|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."AppartieneaPiano" IS 'MODE: write|DESCR: Appartiene a Piano|GROUP: ImpiantiTecnologici Sezione|INDEX: 19|ACTIVE: true|FILTER: from Piani where Id in (/(select * FROM public.filter_cql_piani(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: PianiLista';
COMMENT ON COLUMN public."ImpiantiTecnologici"."AppartieneaEdificio" IS 'MODE: write|DESCR: Appartiene a Edificio|GROUP: ImpiantiTecnologici Sezione|INDEX: 20|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:AppartieneaFiliale.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: EdificiLista';
COMMENT ON COLUMN public."ImpiantiTecnologici"."AppartieneaLocale" IS 'MODE: write|DESCR: Appartiene a Locale|GROUP: ImpiantiTecnologici Sezione|INDEX: 21|ACTIVE: true|FILTER: from Stanze where Id in (/(select * FROM public.filter_cql_locali(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id},0{client:AppartieneaPiano.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: LocaliLista';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Categoria" IS 'MODE: write|DESCR: Categoria|GROUP: ImpiantiTecnologici Categoria di Appartenenza|INDEX: 22|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: CategorieImpTecn';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Descrizione" IS 'MODE: write|DESCR: Descrizione|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."RichiedoilPrestito" IS 'MODE: write|DESCR: Richiedo il Prestito|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 23|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."AttrezzoinPrestito" IS 'MODE: write|DESCR: Prestito Accettato|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 24|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."PrestitoRifiutato" IS 'MODE: write|DESCR: Prestito Rifiutato|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 25|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DataPresRifiutato" IS 'MODE: write|DESCR: Data del Prestito Rifiutato|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 26|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Spostamento" IS 'MODE: read|DESCR: Spostamento verso la Filiale Richiedente|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 27|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: Spostamento';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DatadiInvio" IS 'MODE: write|DESCR: Data di invio dell''Attrezzo|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 28|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DatadiSpostamento" IS 'MODE: write|DESCR: Data di invio della richiesta di spostamento|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 29|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."PrestitoRicevuto" IS 'MODE: write|DESCR: Prestito Ricevuto|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 30|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."RichiediAttrezzo" IS 'MODE: write|DESCR: Richiesta restituzione prestito|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 31|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DataRichiestaAttr" IS 'MODE: write|DESCR: Data di richiesta dell''attrezzo|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 32|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DataRicezionePresti" IS 'MODE: write|DESCR: Data di ricezione|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 33|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."RestituisciPrestito" IS 'MODE: write|DESCR: Restituisci l''attrezzo in prestito|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 34|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DataRestituzionePres" IS 'MODE: write|DESCR: Data di restituzione del prestito|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 35|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Richiedente" IS 'MODE: read|DESCR: Filiale richiedente|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 36|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: RichiedenteImpianti';
COMMENT ON COLUMN public."ImpiantiTecnologici"."PrestitoTerminato" IS 'MODE: write|DESCR: Prestito Terminato|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 37|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DataTerminePrestito" IS 'MODE: write|DESCR: Data Termine Prestito|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 38|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."FileDDTResp" IS 'MODE: write|DESCR: Allega il documento di trasporto|GROUP: ImpiantiTecnologici Richiesta di Prestito|INDEX: 39|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel';
COMMENT ON COLUMN public."ImpiantiTecnologici"."FileDDTVisualizz" IS 'MODE: write|DESCR: Allega il documento di trasporto|GROUP: ImpiantiTecnologici Restituzione Prestito|INDEX: 40|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Scatola" IS 'MODE: write|DESCR: Scatola|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 41|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."Scaffale" IS 'MODE: write|DESCR: Scaffale|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 42|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."ImpiantiTecnologici"."DatadiAcquisto" IS 'MODE: write|DESCR: Data di Acquisto|GROUP: ImpiantiTecnologici Dati Generali|INDEX: 43|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';


-- public."StrumentiDiMisura" definition

-- Drop table

-- DROP TABLE public."StrumentiDiMisura";

CREATE TABLE public."StrumentiDiMisura" (
	"AppartieneaPiano" int8 NULL, -- MODE: write|DESCR: Appartiene a Piano|GROUP: StrumentiDiMisura Sezione|INDEX: 18|ACTIVE: true|FILTER: from Piani where Id in (/(select * FROM public.filter_cql_piani(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: PianiLista
	"AppartieneaEdificio" int8 NULL, -- MODE: write|DESCR: Appartiene a Edificio|GROUP: StrumentiDiMisura Sezione|INDEX: 19|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:AppartieneaFiliale.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: EdificiLista
	"AppartieneaLocale" int8 NULL, -- MODE: write|DESCR: Appartiene a Locale|GROUP: StrumentiDiMisura Sezione|INDEX: 20|ACTIVE: true|FILTER: from Stanze where Id in (/(select * FROM public.filter_cql_locali(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id},0{client:AppartieneaPiano.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: LocaliLista
	"Categoria" int8 NULL, -- MODE: write|DESCR: Categoria|GROUP: StrumentiDiMisura Categoria di Appartenenza|INDEX: 21|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: CategorieStrDiMis
	"Scaffale" varchar(50) NULL, -- MODE: write|DESCR: Scaffale|GROUP: StrumentiDiMisura Dati Generali|INDEX: 22|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Scatola" varchar(50) NULL, -- MODE: write|DESCR: Scatola|GROUP: StrumentiDiMisura Dati Generali|INDEX: 23|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"DatadiAcquisto" date NULL, -- MODE: write|DESCR: Data di Acquisto|GROUP: StrumentiDiMisura Dati Generali|INDEX: 24|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Descrizione" varchar(250) NULL, -- MODE: write|DESCR: Descrizione|GROUP: StrumentiDiMisura Dati Generali|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	CONSTRAINT "StrumentiDiMisura_pkey" PRIMARY KEY ("Id"),
	CONSTRAINT "_cm3_IdClass_check" CHECK ((("IdClass")::oid = ('"StrumentiDiMisura"'::regclass)::oid))
)
INHERITS (public."Strumenti");
CREATE INDEX "_cm3_StrumentiDiMisura_Code" ON public."StrumentiDiMisura" USING btree ("Code") WHERE ("Status" = 'A'::bpchar);
CREATE INDEX "_cm3_StrumentiDiMisura_Description" ON public."StrumentiDiMisura" USING btree ("Description") WHERE ("Status" = 'A'::bpchar);
COMMENT ON TABLE public."StrumentiDiMisura" IS 'MODE: all|TYPE: class|DESCR: Strumenti di Misura|SUPERCLASS: false';

-- Column comments

COMMENT ON COLUMN public."StrumentiDiMisura"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."StrumentiDiMisura"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."StrumentiDiMisura"."Code" IS 'MODE: write|DESCR: Codice|GROUP: StrumentiDiMisura Dati Generali|INDEX: 2|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."Description" IS 'MODE: read|DESCR: Descrizione 2|GROUP: StrumentiDiMisura Dati Generali|INDEX: 4|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."StrumentiDiMisura"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."StrumentiDiMisura"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."StrumentiDiMisura"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."StrumentiDiMisura"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."StrumentiDiMisura"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."StrumentiDiMisura"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."StrumentiDiMisura"."Test" IS 'MODE: write|DESCR: Test|INDEX: 7|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: StanzaAsset';
COMMENT ON COLUMN public."StrumentiDiMisura"."Marca" IS 'MODE: write|DESCR: Marca|GROUP: StrumentiDiMisura Dati Generali|INDEX: 6|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."Modello" IS 'MODE: write|DESCR: Modello|GROUP: StrumentiDiMisura Dati Generali|INDEX: 8|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."Matricola" IS 'MODE: write|DESCR: Matricola|GROUP: StrumentiDiMisura Dati Generali|INDEX: 9|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."Fornitore" IS 'MODE: write|DESCR: Fornitore|GROUP: StrumentiDiMisura Dati Generali|INDEX: 10|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FornitoreDotazione';
COMMENT ON COLUMN public."StrumentiDiMisura"."DataUltimaManutenzio" IS 'MODE: write|DESCR: Data Ultima Manutenzione|GROUP: StrumentiDiMisura Dati Generali|INDEX: 13|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."FrequenzaManutenzion" IS 'MODE: write|DESCR: Frequenza Manutenzione|GROUP: StrumentiDiMisura Dati Generali|INDEX: 15|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."StatoInterventi" IS 'MODE: write|DESCR: Stato Interventi|GROUP: StrumentiDiMisura Dati Generali|INDEX: 16|ACTIVE: true|LOOKUP: StatoInterventiDotazioni|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."CodiceTracker" IS 'MODE: write|DESCR: Codice Tracker|INDEX: 17|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."StatoDotazioneTecnic" IS 'MODE: write|DESCR: Stato|GROUP: StrumentiDiMisura Dati Generali|INDEX: 11|ACTIVE: true|LOOKUP: StatoDotazione|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."TipoDiPossesso" IS 'MODE: write|DESCR: Tipologia di Possesso|GROUP: StrumentiDiMisura Dati Generali|INDEX: 12|ACTIVE: true|LOOKUP: TipoPossessoDotazione|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."DataProssManutenzio" IS 'MODE: write|DESCR: Data Prossima Manutenzione|GROUP: StrumentiDiMisura Dati Generali|INDEX: 14|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."AppartieneaFiliale" IS 'MODE: write|DESCR: Appartiene a Filiale|GROUP: StrumentiDiMisura Location|INDEX: 1|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialiLista';
COMMENT ON COLUMN public."StrumentiDiMisura"."AppartieneaPiano" IS 'MODE: write|DESCR: Appartiene a Piano|GROUP: StrumentiDiMisura Sezione|INDEX: 18|ACTIVE: true|FILTER: from Piani where Id in (/(select * FROM public.filter_cql_piani(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: PianiLista';
COMMENT ON COLUMN public."StrumentiDiMisura"."AppartieneaEdificio" IS 'MODE: write|DESCR: Appartiene a Edificio|GROUP: StrumentiDiMisura Sezione|INDEX: 19|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:AppartieneaFiliale.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: EdificiLista';
COMMENT ON COLUMN public."StrumentiDiMisura"."AppartieneaLocale" IS 'MODE: write|DESCR: Appartiene a Locale|GROUP: StrumentiDiMisura Sezione|INDEX: 20|ACTIVE: true|FILTER: from Stanze where Id in (/(select * FROM public.filter_cql_locali(0{client:AppartieneaFiliale.Id},0{client:AppartieneaEdificio.Id},0{client:AppartieneaPiano.Id}))/)|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: LocaliLista';
COMMENT ON COLUMN public."StrumentiDiMisura"."Categoria" IS 'MODE: write|DESCR: Categoria|GROUP: StrumentiDiMisura Categoria di Appartenenza|INDEX: 21|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: CategorieStrDiMis';
COMMENT ON COLUMN public."StrumentiDiMisura"."Scaffale" IS 'MODE: write|DESCR: Scaffale|GROUP: StrumentiDiMisura Dati Generali|INDEX: 22|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."Scatola" IS 'MODE: write|DESCR: Scatola|GROUP: StrumentiDiMisura Dati Generali|INDEX: 23|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."DatadiAcquisto" IS 'MODE: write|DESCR: Data di Acquisto|GROUP: StrumentiDiMisura Dati Generali|INDEX: 24|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."StrumentiDiMisura"."Descrizione" IS 'MODE: write|DESCR: Descrizione|GROUP: StrumentiDiMisura Dati Generali|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';


-- public."Locations" definition

-- Drop table

-- DROP TABLE public."Locations";

CREATE TABLE public."Locations" (
	CONSTRAINT "Locations_pkey" PRIMARY KEY ("Id")
)
INHERITS (public."Class");
COMMENT ON TABLE public."Locations" IS 'MODE: all|TYPE: class|DESCR: Locations|SUPERCLASS: true';

-- Column comments

COMMENT ON COLUMN public."Locations"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Locations"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Locations"."Code" IS 'MODE: write|DESCR: Codice|INDEX: 1|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Locations"."Description" IS 'MODE: write|DESCR: Descrizione|INDEX: 2|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Locations"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Locations"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Locations"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Locations"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Locations"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Locations"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Locations"."IdTenant" IS 'MODE: syshidden';


-- public."Locations" foreign keys

-- public."Filiali" definition

-- Drop table

-- DROP TABLE public."Filiali";

CREATE TABLE public."Filiali" (
	"Comune" varchar(255) NULL, -- MODE: write|DESCR: Comune|GROUP: Filiali Identificazione e Contatti|INDEX: 3|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"Provincia" varchar(255) NULL, -- MODE: write|DESCR: Provincia|GROUP: Filiali Identificazione e Contatti|INDEX: 4|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Regione" varchar(100) NULL, -- MODE: write|DESCR: Regione|GROUP: Filiali Identificazione e Contatti|INDEX: 5|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"CAP" varchar(50) NULL, -- MODE: write|DESCR: CAP|GROUP: Filiali Identificazione e Contatti|INDEX: 8|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Telefono" varchar(50) NULL, -- MODE: write|DESCR: Telefono|GROUP: Filiali Identificazione e Contatti|INDEX: 9|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"Email" varchar(255) NULL, -- MODE: write|DESCR: Email|GROUP: Filiali Identificazione e Contatti|INDEX: 10|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"NomeReferenteSede" varchar(255) NULL, -- MODE: write|DESCR: Nome Referente Sede|GROUP: Filiali Identificazione e Contatti|INDEX: 12|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"CognomeReferenteSede" varchar(255) NULL, -- MODE: write|DESCR: Cognome Referente Sede|GROUP: Filiali Identificazione e Contatti|INDEX: 13|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"MQSales" numeric(10, 2) NULL, -- MODE: write|DESCR: MQSales|GROUP: Filiali Struttura e Spazi|INDEX: 15|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQAfterSales" numeric(10, 2) NULL, -- MODE: write|DESCR: MQAfterSales|GROUP: Filiali Struttura e Spazi|INDEX: 16|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQBagno" numeric(10, 2) NULL, -- MODE: write|DESCR: Bagno|GROUP: Filiali Struttura e Spazi|INDEX: 17|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQAccettazione" numeric(10, 2) NULL, -- MODE: write|DESCR: Accettazione|GROUP: Filiali Struttura e Spazi|INDEX: 18|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQOfficina" numeric(10, 2) NULL, -- MODE: write|DESCR: Officina|GROUP: Filiali Struttura e Spazi|INDEX: 19|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQLocaleTecnico" numeric(10, 2) NULL, -- MODE: write|DESCR: Locale Tecnico|GROUP: Filiali Struttura e Spazi|INDEX: 20|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQMagazzino" numeric(10, 2) NULL, -- MODE: write|DESCR: Magazzino|GROUP: Filiali Struttura e Spazi|INDEX: 21|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQAreaConsegna" numeric(10, 2) NULL, -- MODE: write|DESCR: Area di Consegna|GROUP: Filiali Struttura e Spazi|INDEX: 22|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQPiazzaleEsterno" numeric(10, 2) NULL, -- MODE: write|DESCR: Piazzale Esterno|GROUP: Filiali Struttura e Spazi|INDEX: 23|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQUfficio1" numeric(10, 2) NULL, -- MODE: write|DESCR: Ufficio|GROUP: Filiali Struttura e Spazi|INDEX: 24|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"AnnoCostruzione" int4 NULL, -- MODE: write|DESCR: Anno di Costruzione|GROUP: Filiali Informazioni Aziendali|INDEX: 27|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Autolavaggio" bool NULL, -- MODE: write|DESCR: Autolavaggio|GROUP: Filiali Servizi Offerti|INDEX: 28|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Carrozzeria" bool NULL, -- MODE: write|DESCR: Carrozzeria|GROUP: Filiali Servizi Offerti|INDEX: 29|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"ImpiantoFotovoltaico" bool NULL, -- MODE: write|DESCR: Impianto Fotovoltaico|GROUP: Filiali Impianti Tecnologici|INDEX: 30|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"KWImpiantoFotovolt" numeric(10, 2) NULL, -- MODE: write|DESCR: KW Impianto Fotovoltaico|GROUP: Filiali Impianti Tecnologici|INDEX: 31|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"CabinaTrasformazione" bool NULL, -- MODE: write|DESCR: Cabina di Trasformazione|GROUP: Filiali Impianti Tecnologici|INDEX: 32|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"KWCabinaTrasformaz" numeric(10, 2) NULL, -- MODE: write|DESCR: KW Cabina di Trasformazione|GROUP: Filiali Impianti Tecnologici|INDEX: 33|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PresenzaLuciLed" bool NULL, -- MODE: write|DESCR: Presenza Luci Led|GROUP: Filiali Impianti Tecnologici|INDEX: 34|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PresScaricoNotturno" bool NULL, -- MODE: write|DESCR: Presenza Scarico Notturno|GROUP: Filiali Impianti Tecnologici|INDEX: 35|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PresWallboxOfficina" bool NULL, -- MODE: write|DESCR: Presente Wallbox in Officina|GROUP: Filiali Impianti Tecnologici|INDEX: 36|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"KWWallboxOfficina" numeric(10, 2) NULL, -- MODE: write|DESCR: KW Wallbox in Officina|GROUP: Filiali Impianti Tecnologici|INDEX: 37|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PresWallboxSalone" bool NULL, -- MODE: write|DESCR: Presente Wallbox in Salone|GROUP: Filiali Impianti Tecnologici|INDEX: 38|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"KWWallboxSalone" numeric(10, 2) NULL, -- MODE: write|DESCR: KW Wallbox in Salone|GROUP: Filiali Impianti Tecnologici|INDEX: 39|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PresColonninaEsterna" bool NULL, -- MODE: write|DESCR: Presente Colonnina Esterna|GROUP: Filiali Impianti Tecnologici|INDEX: 40|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"KWColonninaEsterna" numeric(10, 2) NULL, -- MODE: write|DESCR: KW Colonnina Esterna|GROUP: Filiali Impianti Tecnologici|INDEX: 41|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PresWallboxEsterna" bool NULL, -- MODE: write|DESCR: Presente Wallbox Esterna|GROUP: Filiali Impianti Tecnologici|INDEX: 42|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"KWWallboxEsterna" numeric(10, 2) NULL, -- MODE: write|DESCR: KW Wallbox Esterna|GROUP: Filiali Impianti Tecnologici|INDEX: 43|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PresCentraleTermica" bool NULL, -- MODE: write|DESCR: Presente Centrale Termica|GROUP: Filiali Impianti Tecnologici|INDEX: 44|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"KWCentraleTermica" numeric(10, 2) NULL, -- MODE: write|DESCR: KW Centrale Termica|GROUP: Filiali Impianti Tecnologici|INDEX: 45|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"PresClimatizzazione" bool NULL, -- MODE: write|DESCR: Presente Impianto di Climatizzazione|GROUP: Filiali Impianti Tecnologici|INDEX: 46|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"KWClimatizzazione" numeric(10, 2) NULL, -- MODE: write|DESCR: KW Impianto di Climatizzazione|GROUP: Filiali Impianti Tecnologici|INDEX: 47|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Brand" _int8 NULL, -- MODE: write|DESCR: Brand|GROUP: Filiali Informazioni Aziendali|INDEX: 11|ACTIVE: true|LOOKUP: Brand|BASEDSP: false|EDITORTYPE: PLAIN
	"TipologiaContrattual" int4 NULL, -- MODE: write|DESCR: Tipologia Contrattuale|GROUP: Filiali Informazioni Aziendali|INDEX: 25|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"EmailReferenteSede" varchar(50) NULL, -- MODE: write|DESCR: Email Referente Sede|GROUP: Filiali Identificazione e Contatti|INDEX: 14|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN
	"Planimetria" varchar(50) NULL, -- MODE: write|DESCR: Planimetria|GROUP: Filiali Struttura e Spazi|INDEX: 48|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Via" varchar(50) NULL, -- MODE: write|DESCR: Via|GROUP: Filiali Identificazione e Contatti|INDEX: 7|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"NumeroCivico" varchar(50) NULL, -- MODE: write|DESCR: NumeroCivico|GROUP: Filiali Identificazione e Contatti|INDEX: 6|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Fax" varchar(50) NULL, -- MODE: write|DESCR: Fax|GROUP: Filiali Identificazione e Contatti|INDEX: 49|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Interno" varchar(50) NULL, -- MODE: write|DESCR: Interno|GROUP: Filiali Identificazione e Contatti|INDEX: 50|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"ScadTipoContratto" date NULL, -- MODE: write|DESCR: Scadenza Tipo Contratto|GROUP: Filiali Informazioni Aziendali|INDEX: 26|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieLotto" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie Lotto|GROUP: Filiali Struttura e Spazi|INDEX: 51|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieCoperta" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie Coperta|GROUP: Filiali Struttura e Spazi|INDEX: 52|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieNetta" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie Netta uffici primo piano|GROUP: Filiali Struttura e Spazi|INDEX: 53|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieUtilizzata" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie utilizzata brand BMW|GROUP: Filiali Struttura e Spazi|INDEX: 54|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieUtilizMini" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie utilizzata brand MINI|GROUP: Filiali Struttura e Spazi|INDEX: 55|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperUtilMitsubishi" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie utilizzata brand MITSUBISHI|GROUP: Filiali Struttura e Spazi|INDEX: 56|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperNettaDepVet" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie netta deposito vetture interno|GROUP: Filiali Struttura e Spazi|INDEX: 57|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperNettTettEst" numeric(10, 2) NULL, -- MODE: write|DESCR: Superificie netta tettoia esterna|GROUP: Filiali Struttura e Spazi|INDEX: 58|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Retiantigrandine" bool NULL, -- MODE: write|DESCR: Reti antigrandine|GROUP: Filiali Struttura e Spazi|INDEX: 59|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"OffMezziPesanti" bool NULL, -- MODE: write|DESCR: Officina mezzi pesanti|GROUP: Filiali Servizi Offerti|INDEX: 60|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieNettaEspos" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie Netta Esposizione|GROUP: Filiali Struttura e Spazi|INDEX: 61|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieNettaMagaz" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie Netta Magazzino|GROUP: Filiali Struttura e Spazi|INDEX: 62|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieNettaOffic" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie Netta Officina|GROUP: Filiali Struttura e Spazi|INDEX: 63|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieNettaDepVe" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie Netta Deposito Vetture interno|GROUP: Filiali Struttura e Spazi|INDEX: 64|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"SuperficieNettaTeEst" numeric(10, 2) NULL, -- MODE: write|DESCR: Superficie Netta Tettoia esterna|GROUP: Filiali Struttura e Spazi|INDEX: 65|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"MQAreadiVendita" numeric(10, 2) NULL, -- MODE: write|DESCR: MQ Area di Vendita|GROUP: Filiali Informazioni Aziendali|INDEX: 66|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"ImportoAnnuo" numeric(10, 2) NULL, -- MODE: write|DESCR: Importo Annuo|GROUP: Filiali Informazioni Aziendali|INDEX: 67|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"ContrattodiLocazione" int8 NULL, -- MODE: write|DESCR: Contratto di Locazione|GROUP: Filiali Informazioni Aziendali|INDEX: 68|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel
	"Locatore" numeric(10, 2) NULL, -- MODE: write|DESCR: Locatore|GROUP: Filiali Informazioni Aziendali|INDEX: 69|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN
	"LicenzadiCommercio" bool NULL, -- MODE: write|DESCR: Licenza di Commercio|GROUP: Filiali Informazioni Aziendali|INDEX: 70|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Sezione" varchar(50) NULL, -- MODE: write|DESCR: Sezione|GROUP: Filiali Dati Catastali|INDEX: 71|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Foglio" varchar(50) NULL, -- MODE: write|DESCR: Foglio|GROUP: Filiali Dati Catastali|INDEX: 72|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Particella" varchar(50) NULL, -- MODE: write|DESCR: Particella|GROUP: Filiali Dati Catastali|INDEX: 73|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Subalterno" varchar(200) NULL, -- MODE: write|DESCR: Subalterno|GROUP: Filiali Dati Catastali|INDEX: 74|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	"Locat" varchar(250) NULL, -- MODE: write|DESCR: Locatore|GROUP: Filiali Informazioni Aziendali|INDEX: 75|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN
	CONSTRAINT "Filiali_pkey" PRIMARY KEY ("Id"),
	CONSTRAINT "_cm3_CAP_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("CAP" IS NOT NULL))),
	CONSTRAINT "_cm3_Code_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Code" IS NOT NULL))),
	CONSTRAINT "_cm3_CognomeReferenteSede_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("CognomeReferenteSede" IS NOT NULL))),
	CONSTRAINT "_cm3_Comune_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Comune" IS NOT NULL))),
	CONSTRAINT "_cm3_Description_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Description" IS NOT NULL))),
	CONSTRAINT "_cm3_IdClass_check" CHECK ((("IdClass")::oid = ('"Filiali"'::regclass)::oid)),
	CONSTRAINT "_cm3_NomeReferenteSede_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("NomeReferenteSede" IS NOT NULL))),
	CONSTRAINT "_cm3_Provincia_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Provincia" IS NOT NULL))),
	CONSTRAINT "_cm3_Regione_notnull" CHECK ((("Status" <> 'A'::bpchar) OR ("Regione" IS NOT NULL)))
)
INHERITS (public."Locations");
CREATE INDEX "_cm3_Filiali_Code" ON public."Filiali" USING btree ("Code") WHERE ("Status" = 'A'::bpchar);
CREATE INDEX "_cm3_Filiali_Description" ON public."Filiali" USING btree ("Description") WHERE ("Status" = 'A'::bpchar);
COMMENT ON TABLE public."Filiali" IS 'MODE: all|TYPE: class|DESCR: Filiali|SUPERCLASS: false';

-- Column comments

COMMENT ON COLUMN public."Filiali"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Filiali"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Filiali"."Code" IS 'MODE: write|DESCR: Codice|GROUP: Filiali Identificazione e Contatti|INDEX: 1|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Description" IS 'MODE: write|DESCR: Descrizione|GROUP: Filiali Identificazione e Contatti|INDEX: 2|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Filiali"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Filiali"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Filiali"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Filiali"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Filiali"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Filiali"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Filiali"."Comune" IS 'MODE: write|DESCR: Comune|GROUP: Filiali Identificazione e Contatti|INDEX: 3|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Provincia" IS 'MODE: write|DESCR: Provincia|GROUP: Filiali Identificazione e Contatti|INDEX: 4|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Regione" IS 'MODE: write|DESCR: Regione|GROUP: Filiali Identificazione e Contatti|INDEX: 5|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."CAP" IS 'MODE: write|DESCR: CAP|GROUP: Filiali Identificazione e Contatti|INDEX: 8|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Telefono" IS 'MODE: write|DESCR: Telefono|GROUP: Filiali Identificazione e Contatti|INDEX: 9|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Email" IS 'MODE: write|DESCR: Email|GROUP: Filiali Identificazione e Contatti|INDEX: 10|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."NomeReferenteSede" IS 'MODE: write|DESCR: Nome Referente Sede|GROUP: Filiali Identificazione e Contatti|INDEX: 12|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."CognomeReferenteSede" IS 'MODE: write|DESCR: Cognome Referente Sede|GROUP: Filiali Identificazione e Contatti|INDEX: 13|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQSales" IS 'MODE: write|DESCR: MQSales|GROUP: Filiali Struttura e Spazi|INDEX: 15|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQAfterSales" IS 'MODE: write|DESCR: MQAfterSales|GROUP: Filiali Struttura e Spazi|INDEX: 16|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQBagno" IS 'MODE: write|DESCR: Bagno|GROUP: Filiali Struttura e Spazi|INDEX: 17|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQAccettazione" IS 'MODE: write|DESCR: Accettazione|GROUP: Filiali Struttura e Spazi|INDEX: 18|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQOfficina" IS 'MODE: write|DESCR: Officina|GROUP: Filiali Struttura e Spazi|INDEX: 19|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQLocaleTecnico" IS 'MODE: write|DESCR: Locale Tecnico|GROUP: Filiali Struttura e Spazi|INDEX: 20|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQMagazzino" IS 'MODE: write|DESCR: Magazzino|GROUP: Filiali Struttura e Spazi|INDEX: 21|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQAreaConsegna" IS 'MODE: write|DESCR: Area di Consegna|GROUP: Filiali Struttura e Spazi|INDEX: 22|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQPiazzaleEsterno" IS 'MODE: write|DESCR: Piazzale Esterno|GROUP: Filiali Struttura e Spazi|INDEX: 23|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQUfficio1" IS 'MODE: write|DESCR: Ufficio|GROUP: Filiali Struttura e Spazi|INDEX: 24|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."AnnoCostruzione" IS 'MODE: write|DESCR: Anno di Costruzione|GROUP: Filiali Informazioni Aziendali|INDEX: 27|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Autolavaggio" IS 'MODE: write|DESCR: Autolavaggio|GROUP: Filiali Servizi Offerti|INDEX: 28|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Carrozzeria" IS 'MODE: write|DESCR: Carrozzeria|GROUP: Filiali Servizi Offerti|INDEX: 29|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."ImpiantoFotovoltaico" IS 'MODE: write|DESCR: Impianto Fotovoltaico|GROUP: Filiali Impianti Tecnologici|INDEX: 30|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."KWImpiantoFotovolt" IS 'MODE: write|DESCR: KW Impianto Fotovoltaico|GROUP: Filiali Impianti Tecnologici|INDEX: 31|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."CabinaTrasformazione" IS 'MODE: write|DESCR: Cabina di Trasformazione|GROUP: Filiali Impianti Tecnologici|INDEX: 32|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."KWCabinaTrasformaz" IS 'MODE: write|DESCR: KW Cabina di Trasformazione|GROUP: Filiali Impianti Tecnologici|INDEX: 33|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."PresenzaLuciLed" IS 'MODE: write|DESCR: Presenza Luci Led|GROUP: Filiali Impianti Tecnologici|INDEX: 34|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."PresScaricoNotturno" IS 'MODE: write|DESCR: Presenza Scarico Notturno|GROUP: Filiali Impianti Tecnologici|INDEX: 35|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."PresWallboxOfficina" IS 'MODE: write|DESCR: Presente Wallbox in Officina|GROUP: Filiali Impianti Tecnologici|INDEX: 36|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."KWWallboxOfficina" IS 'MODE: write|DESCR: KW Wallbox in Officina|GROUP: Filiali Impianti Tecnologici|INDEX: 37|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."PresWallboxSalone" IS 'MODE: write|DESCR: Presente Wallbox in Salone|GROUP: Filiali Impianti Tecnologici|INDEX: 38|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."KWWallboxSalone" IS 'MODE: write|DESCR: KW Wallbox in Salone|GROUP: Filiali Impianti Tecnologici|INDEX: 39|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."PresColonninaEsterna" IS 'MODE: write|DESCR: Presente Colonnina Esterna|GROUP: Filiali Impianti Tecnologici|INDEX: 40|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."KWColonninaEsterna" IS 'MODE: write|DESCR: KW Colonnina Esterna|GROUP: Filiali Impianti Tecnologici|INDEX: 41|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."PresWallboxEsterna" IS 'MODE: write|DESCR: Presente Wallbox Esterna|GROUP: Filiali Impianti Tecnologici|INDEX: 42|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."KWWallboxEsterna" IS 'MODE: write|DESCR: KW Wallbox Esterna|GROUP: Filiali Impianti Tecnologici|INDEX: 43|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."PresCentraleTermica" IS 'MODE: write|DESCR: Presente Centrale Termica|GROUP: Filiali Impianti Tecnologici|INDEX: 44|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."KWCentraleTermica" IS 'MODE: write|DESCR: KW Centrale Termica|GROUP: Filiali Impianti Tecnologici|INDEX: 45|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."PresClimatizzazione" IS 'MODE: write|DESCR: Presente Impianto di Climatizzazione|GROUP: Filiali Impianti Tecnologici|INDEX: 46|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."KWClimatizzazione" IS 'MODE: write|DESCR: KW Impianto di Climatizzazione|GROUP: Filiali Impianti Tecnologici|INDEX: 47|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Brand" IS 'MODE: write|DESCR: Brand|GROUP: Filiali Informazioni Aziendali|INDEX: 11|ACTIVE: true|LOOKUP: Brand|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."TipologiaContrattual" IS 'MODE: write|DESCR: Tipologia Contrattuale|GROUP: Filiali Informazioni Aziendali|INDEX: 25|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."EmailReferenteSede" IS 'MODE: write|DESCR: Email Referente Sede|GROUP: Filiali Identificazione e Contatti|INDEX: 14|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Planimetria" IS 'MODE: write|DESCR: Planimetria|GROUP: Filiali Struttura e Spazi|INDEX: 48|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Via" IS 'MODE: write|DESCR: Via|GROUP: Filiali Identificazione e Contatti|INDEX: 7|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."NumeroCivico" IS 'MODE: write|DESCR: NumeroCivico|GROUP: Filiali Identificazione e Contatti|INDEX: 6|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Fax" IS 'MODE: write|DESCR: Fax|GROUP: Filiali Identificazione e Contatti|INDEX: 49|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Interno" IS 'MODE: write|DESCR: Interno|GROUP: Filiali Identificazione e Contatti|INDEX: 50|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."ScadTipoContratto" IS 'MODE: write|DESCR: Scadenza Tipo Contratto|GROUP: Filiali Informazioni Aziendali|INDEX: 26|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieLotto" IS 'MODE: write|DESCR: Superficie Lotto|GROUP: Filiali Struttura e Spazi|INDEX: 51|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieCoperta" IS 'MODE: write|DESCR: Superficie Coperta|GROUP: Filiali Struttura e Spazi|INDEX: 52|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieNetta" IS 'MODE: write|DESCR: Superficie Netta uffici primo piano|GROUP: Filiali Struttura e Spazi|INDEX: 53|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieUtilizzata" IS 'MODE: write|DESCR: Superficie utilizzata brand BMW|GROUP: Filiali Struttura e Spazi|INDEX: 54|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieUtilizMini" IS 'MODE: write|DESCR: Superficie utilizzata brand MINI|GROUP: Filiali Struttura e Spazi|INDEX: 55|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperUtilMitsubishi" IS 'MODE: write|DESCR: Superficie utilizzata brand MITSUBISHI|GROUP: Filiali Struttura e Spazi|INDEX: 56|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperNettaDepVet" IS 'MODE: write|DESCR: Superficie netta deposito vetture interno|GROUP: Filiali Struttura e Spazi|INDEX: 57|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperNettTettEst" IS 'MODE: write|DESCR: Superificie netta tettoia esterna|GROUP: Filiali Struttura e Spazi|INDEX: 58|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Retiantigrandine" IS 'MODE: write|DESCR: Reti antigrandine|GROUP: Filiali Struttura e Spazi|INDEX: 59|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."OffMezziPesanti" IS 'MODE: write|DESCR: Officina mezzi pesanti|GROUP: Filiali Servizi Offerti|INDEX: 60|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieNettaEspos" IS 'MODE: write|DESCR: Superficie Netta Esposizione|GROUP: Filiali Struttura e Spazi|INDEX: 61|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieNettaMagaz" IS 'MODE: write|DESCR: Superficie Netta Magazzino|GROUP: Filiali Struttura e Spazi|INDEX: 62|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieNettaOffic" IS 'MODE: write|DESCR: Superficie Netta Officina|GROUP: Filiali Struttura e Spazi|INDEX: 63|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieNettaDepVe" IS 'MODE: write|DESCR: Superficie Netta Deposito Vetture interno|GROUP: Filiali Struttura e Spazi|INDEX: 64|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."SuperficieNettaTeEst" IS 'MODE: write|DESCR: Superficie Netta Tettoia esterna|GROUP: Filiali Struttura e Spazi|INDEX: 65|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."MQAreadiVendita" IS 'MODE: write|DESCR: MQ Area di Vendita|GROUP: Filiali Informazioni Aziendali|INDEX: 66|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."ImportoAnnuo" IS 'MODE: write|DESCR: Importo Annuo|GROUP: Filiali Informazioni Aziendali|INDEX: 67|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."ContrattodiLocazione" IS 'MODE: write|DESCR: Contratto di Locazione|GROUP: Filiali Informazioni Aziendali|INDEX: 68|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel';
COMMENT ON COLUMN public."Filiali"."Locatore" IS 'MODE: write|DESCR: Locatore|GROUP: Filiali Informazioni Aziendali|INDEX: 69|ACTIVE: false|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."LicenzadiCommercio" IS 'MODE: write|DESCR: Licenza di Commercio|GROUP: Filiali Informazioni Aziendali|INDEX: 70|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Sezione" IS 'MODE: write|DESCR: Sezione|GROUP: Filiali Dati Catastali|INDEX: 71|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Foglio" IS 'MODE: write|DESCR: Foglio|GROUP: Filiali Dati Catastali|INDEX: 72|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Particella" IS 'MODE: write|DESCR: Particella|GROUP: Filiali Dati Catastali|INDEX: 73|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Subalterno" IS 'MODE: write|DESCR: Subalterno|GROUP: Filiali Dati Catastali|INDEX: 74|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Filiali"."Locat" IS 'MODE: write|DESCR: Locatore|GROUP: Filiali Informazioni Aziendali|INDEX: 75|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';


-- public."Edifici" definition

-- Drop table

-- DROP TABLE public."Edifici";

CREATE TABLE public."Edifici" (
	"Planimetria" int8 NULL, -- MODE: write|DESCR: Planimetria|INDEX: 4|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel
	"FilialediAppart" int8 NULL, -- MODE: write|DESCR: Filiale di Appartenenza|GROUP: Edifici Location|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialeEdificio
	"AppartieneaFiliale" int8 NULL, -- MODE: write|DESCR: Appartiene a Filiale|GROUP: Edifici Location|INDEX: 6|ACTIVE: false|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:FilialediAppart.Id}))/)|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialePosizione
	CONSTRAINT "Edifici_pkey" PRIMARY KEY ("Id"),
	CONSTRAINT "_cm3_IdClass_check" CHECK ((("IdClass")::oid = ('"Edifici"'::regclass)::oid))
)
INHERITS (public."Locations");
CREATE INDEX "_cm3_Edifici_Code" ON public."Edifici" USING btree ("Code") WHERE ("Status" = 'A'::bpchar);
CREATE INDEX "_cm3_Edifici_Description" ON public."Edifici" USING btree ("Description") WHERE ("Status" = 'A'::bpchar);
CREATE UNIQUE INDEX "_cm3_Edifici_FilialediAppart" ON public."Edifici" USING btree ("FilialediAppart") WHERE ("Status" = 'A'::bpchar);
COMMENT ON TABLE public."Edifici" IS 'MODE: all|TYPE: class|DESCR: Edifici|SUPERCLASS: false';

-- Column comments

COMMENT ON COLUMN public."Edifici"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Edifici"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Edifici"."Code" IS 'MODE: write|DESCR: Codice|INDEX: 1|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Edifici"."Description" IS 'MODE: write|DESCR: Descrizione|INDEX: 2|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Edifici"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Edifici"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Edifici"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Edifici"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Edifici"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Edifici"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Edifici"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Edifici"."Planimetria" IS 'MODE: write|DESCR: Planimetria|INDEX: 4|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel';
COMMENT ON COLUMN public."Edifici"."FilialediAppart" IS 'MODE: write|DESCR: Filiale di Appartenenza|GROUP: Edifici Location|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialeEdificio';
COMMENT ON COLUMN public."Edifici"."AppartieneaFiliale" IS 'MODE: write|DESCR: Appartiene a Filiale|GROUP: Edifici Location|INDEX: 6|ACTIVE: false|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:FilialediAppart.Id}))/)|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialePosizione';


-- public."Piani" definition

-- Drop table

-- DROP TABLE public."Piani";

CREATE TABLE public."Piani" (
	"Planimetria" int8 NULL, -- MODE: write|DESCR: Planimetria|INDEX: 4|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel
	"FilialediAppart" int8 NULL, -- MODE: write|DESCR: Filiale di Appartenenza|GROUP: Piani Locations|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialediAppar
	"EdificiodiAppart" int8 NULL, -- MODE: write|DESCR: Edificio di Appartenenza|GROUP: Piani Sezione|INDEX: 6|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:FilialediAppart.Id}))/)|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: EdificioPiano
	CONSTRAINT "Piani_pkey" PRIMARY KEY ("Id"),
	CONSTRAINT "_cm3_IdClass_check" CHECK ((("IdClass")::oid = ('"Piani"'::regclass)::oid))
)
INHERITS (public."Locations");
CREATE INDEX "_cm3_Piani_Code" ON public."Piani" USING btree ("Code") WHERE ("Status" = 'A'::bpchar);
CREATE INDEX "_cm3_Piani_Description" ON public."Piani" USING btree ("Description") WHERE ("Status" = 'A'::bpchar);
COMMENT ON TABLE public."Piani" IS 'MODE: all|TYPE: class|DESCR: Piani|SUPERCLASS: false';

-- Column comments

COMMENT ON COLUMN public."Piani"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Piani"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Piani"."Code" IS 'MODE: write|DESCR: Codice|INDEX: 1|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Piani"."Description" IS 'MODE: write|DESCR: Descrizione|INDEX: 2|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Piani"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Piani"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Piani"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Piani"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Piani"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Piani"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Piani"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Piani"."Planimetria" IS 'MODE: write|DESCR: Planimetria|INDEX: 4|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN|FKTARGETCLASS: DmsModel';
COMMENT ON COLUMN public."Piani"."FilialediAppart" IS 'MODE: write|DESCR: Filiale di Appartenenza|GROUP: Piani Locations|INDEX: 5|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialediAppar';
COMMENT ON COLUMN public."Piani"."EdificiodiAppart" IS 'MODE: write|DESCR: Edificio di Appartenenza|GROUP: Piani Sezione|INDEX: 6|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:FilialediAppart.Id}))/)|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: EdificioPiano';


-- public."Stanze" definition

-- Drop table

-- DROP TABLE public."Stanze";

CREATE TABLE public."Stanze" (
	"FilialediAppart" int8 NULL, -- MODE: write|DESCR: Filiale di Appartenenza|GROUP: Stanze Location|INDEX: 4|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialediAppart
	"StanzadiAppart" int8 NULL, -- MODE: write|DESCR: Piano di Appartenenza|GROUP: Stanze Sezione|INDEX: 5|ACTIVE: true|FILTER: from Piani where Id in (/(select * FROM public.filter_cql_piani(0{client:FilialediAppart.Id},0{client:EdificiodiAppart.Id}))/)|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: PianoStanza
	"EdificiodiAppart" int8 NULL, -- MODE: write|DESCR: Edificio di Appartenenza|GROUP: Stanze Sezione|INDEX: 6|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:FilialediAppart.Id}))/)|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: LocaleAppartEdif
	CONSTRAINT "Stanze_pkey" PRIMARY KEY ("Id"),
	CONSTRAINT "_cm3_IdClass_check" CHECK ((("IdClass")::oid = ('"Stanze"'::regclass)::oid))
)
INHERITS (public."Locations");
CREATE INDEX "_cm3_Stanze_Code" ON public."Stanze" USING btree ("Code") WHERE ("Status" = 'A'::bpchar);
CREATE INDEX "_cm3_Stanze_Description" ON public."Stanze" USING btree ("Description") WHERE ("Status" = 'A'::bpchar);
COMMENT ON TABLE public."Stanze" IS 'MODE: all|TYPE: class|DESCR: Locali|SUPERCLASS: false';

-- Column comments

COMMENT ON COLUMN public."Stanze"."Id" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Stanze"."IdClass" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Stanze"."Code" IS 'MODE: write|DESCR: Codice|INDEX: 1|ACTIVE: true|BASEDSP: false|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Stanze"."Description" IS 'MODE: write|DESCR: Descrizione|INDEX: 2|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN';
COMMENT ON COLUMN public."Stanze"."Status" IS 'MODE: reserved';
COMMENT ON COLUMN public."Stanze"."User" IS 'MODE: reserved';
COMMENT ON COLUMN public."Stanze"."BeginDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Stanze"."Notes" IS 'MODE: protected|DESCR: Notes|INDEX: 3';
COMMENT ON COLUMN public."Stanze"."EndDate" IS 'MODE: reserved';
COMMENT ON COLUMN public."Stanze"."CurrentId" IS 'MODE: reserved';
COMMENT ON COLUMN public."Stanze"."IdTenant" IS 'MODE: syshidden';
COMMENT ON COLUMN public."Stanze"."FilialediAppart" IS 'MODE: write|DESCR: Filiale di Appartenenza|GROUP: Stanze Location|INDEX: 4|ACTIVE: true|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: FilialediAppart';
COMMENT ON COLUMN public."Stanze"."StanzadiAppart" IS 'MODE: write|DESCR: Piano di Appartenenza|GROUP: Stanze Sezione|INDEX: 5|ACTIVE: true|FILTER: from Piani where Id in (/(select * FROM public.filter_cql_piani(0{client:FilialediAppart.Id},0{client:EdificiodiAppart.Id}))/)|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: PianoStanza';
COMMENT ON COLUMN public."Stanze"."EdificiodiAppart" IS 'MODE: write|DESCR: Edificio di Appartenenza|GROUP: Stanze Sezione|INDEX: 6|ACTIVE: true|FILTER: from Edifici where Id in (/(select * FROM public.filter_cql_edifici(0{client:FilialediAppart.Id}))/)|BASEDSP: true|EDITORTYPE: PLAIN|REFERENCEDIR: inverse|REFERENCEDOM: LocaleAppartEdif';