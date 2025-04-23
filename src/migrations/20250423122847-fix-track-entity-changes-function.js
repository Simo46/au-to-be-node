'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Aggiorna la funzione track_entity_changes con la versione corretta
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION public.track_entity_changes()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      DECLARE
        history_table_name TEXT;
        entity_id_column TEXT;
        current_user_id UUID;
        old_values JSONB;
        new_values JSONB;
        changed_fields TEXT[];
        differing_keys TEXT[];
        new_id UUID;
      BEGIN
        -- Genera nuovo ID per l'entry history
        new_id := gen_random_uuid();
        
        -- Inizializza il nome della tabella di history
        IF TG_TABLE_NAME = 'assets' THEN
          history_table_name := 'assets_history';
          entity_id_column := 'asset_id';
        ELSIF TG_TABLE_NAME = 'filiali' THEN
          history_table_name := 'filiali_history';
          entity_id_column := 'filiale_id';
        ELSIF TG_TABLE_NAME = 'edifici' THEN
          history_table_name := 'edifici_history';
          entity_id_column := 'edificio_id';
        ELSIF TG_TABLE_NAME = 'piani' THEN
          history_table_name := 'piani_history';
          entity_id_column := 'piano_id';
        ELSIF TG_TABLE_NAME = 'locali' THEN
          history_table_name := 'locali_history';
          entity_id_column := 'locale_id';
        ELSE
          -- Se non è una tabella tracciata, esci
          RETURN NEW;
        END IF;
        
        -- Prova a ottenere l'id utente dal contesto della sessione
        BEGIN
          current_user_id := current_setting('app.current_user_id', true)::uuid;
        EXCEPTION
          WHEN OTHERS THEN
            current_user_id := NULL;
        END;
        
        -- Se si tratta di un'operazione UPDATE
        IF (TG_OP = 'UPDATE') THEN
          -- Converti OLD e NEW in JSONB ed elimina i campi che non vogliamo tracciare
          old_values := to_jsonb(OLD);
          new_values := to_jsonb(NEW);
          
          -- Rimuovi i campi che non vogliamo tracciare nelle differenze
          old_values := old_values - 'created_at' - 'updated_at' - 'deleted_at' - 'created_by' - 'updated_by';
          new_values := new_values - 'created_at' - 'updated_at' - 'deleted_at' - 'created_by' - 'updated_by';
          
          -- Trova le chiavi che differiscono
          SELECT array_agg(k) INTO differing_keys
          FROM (
            SELECT jsonb_object_keys(old_values) AS k
            EXCEPT
            SELECT jsonb_object_keys(new_values) AS k
            UNION
            SELECT jsonb_object_keys(new_values) AS k
            EXCEPT
            SELECT jsonb_object_keys(old_values) AS k
            UNION
            SELECT jsonb_object_keys(old_values) AS k
            WHERE old_values->k IS DISTINCT FROM new_values->k
          ) sub;
          
          -- Se ci sono modifiche, inserisci nella tabella history
          IF differing_keys IS NOT NULL AND array_length(differing_keys, 1) > 0 THEN
            -- Filtra per tenere solo i campi modificati
            old_values := jsonb_object_agg(k, old_values->k) FROM unnest(differing_keys) AS k;
            new_values := jsonb_object_agg(k, new_values->k) FROM unnest(differing_keys) AS k;
            
            -- Inserisci nella tabella di history con cast espliciti
            EXECUTE format(
              'INSERT INTO %I (id, %I, tenant_id, user_id, action, old_values, new_values, created_at, updated_at) 
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::text, $6::jsonb, $7::jsonb, NOW(), NOW())',
              history_table_name,
              entity_id_column
            ) USING 
              COALESCE(new_id, gen_random_uuid()),  -- id (con fallback)
              NEW.id,              -- entity_id
              NEW.tenant_id,       -- tenant_id
              current_user_id,     -- user_id
              'update',            -- action
              old_values,          -- old_values
              new_values;          -- new_values
              
            -- Aggiorna il campo updated_by se non specificato esplicitamente
            IF NEW.updated_by IS NULL THEN
              NEW.updated_by := current_user_id;
            END IF;
            
            NEW.updated_at := NOW();
          END IF;
        
        -- Se si tratta di un'operazione DELETE
        ELSIF (TG_OP = 'DELETE') THEN
          -- Converti OLD in JSONB
          old_values := to_jsonb(OLD);
          
          -- Inserisci nella tabella di history con cast espliciti
          EXECUTE format(
            'INSERT INTO %I (id, %I, tenant_id, user_id, action, old_values, new_values, created_at, updated_at) 
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::text, $6::jsonb, $7::jsonb, NOW(), NOW())',
            history_table_name,
            entity_id_column
          ) USING 
            COALESCE(new_id, gen_random_uuid()),  -- id (con fallback)
            OLD.id,                -- entity_id
            OLD.tenant_id,         -- tenant_id
            current_user_id,       -- user_id
            'delete',              -- action
            old_values,            -- old_values
            NULL::jsonb;           -- new_values (NULL perché il record è stato eliminato)
        
        -- Se si tratta di un'operazione INSERT
        ELSIF (TG_OP = 'INSERT') THEN
          -- Converti NEW in JSONB
          new_values := to_jsonb(NEW);
          
          -- Inserisci nella tabella di history con cast espliciti
          EXECUTE format(
            'INSERT INTO %I (id, %I, tenant_id, user_id, action, old_values, new_values, created_at, updated_at) 
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::text, $6::jsonb, $7::jsonb, NOW(), NOW())',
            history_table_name,
            entity_id_column
          ) USING 
            COALESCE(new_id, gen_random_uuid()),  -- id (con fallback)
            NEW.id,                -- entity_id
            NEW.tenant_id,         -- tenant_id
            current_user_id,       -- user_id
            'create',              -- action
            NULL::jsonb,           -- old_values (NULL perché è una creazione)
            new_values;            -- new_values
            
          -- Imposta created_by se non è specificato
          IF NEW.created_by IS NULL THEN
            NEW.created_by := current_user_id;
          END IF;
          
          -- Imposta updated_by se non è specificato
          IF NEW.updated_by IS NULL THEN
            NEW.updated_by := current_user_id;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $function$;
    `);

    // Ricrea i trigger principali per tabelle che hanno history
    const tablesWithHistory = ['assets', 'filiali', 'edifici', 'piani', 'locali'];
    
    for (const table of tablesWithHistory) {
      // Modifica i trigger principali in AFTER INSERT per evitare violazioni di foreign key
      await queryInterface.sequelize.query(`
        -- Elimina i trigger esistenti
        DROP TRIGGER IF EXISTS ${table}_before_changes_trigger ON ${table};
        
        -- Ricrea il trigger per UPDATE (rimane BEFORE)
        CREATE TRIGGER ${table}_before_update_trigger
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION track_entity_changes();
        
        -- Crea il trigger per INSERT come AFTER
        CREATE TRIGGER ${table}_after_insert_trigger
        AFTER INSERT ON ${table}
        FOR EACH ROW EXECUTE FUNCTION track_entity_changes();
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Ripristina la versione originale della funzione e dei trigger se necessario
    // Questa è una versione semplificata del down che ripristina solo i trigger principali
    const tablesWithHistory = ['assets', 'filiali', 'edifici', 'piani', 'locali'];
    
    for (const table of tablesWithHistory) {
      await queryInterface.sequelize.query(`
        -- Elimina i trigger corretti
        DROP TRIGGER IF EXISTS ${table}_before_update_trigger ON ${table};
        DROP TRIGGER IF EXISTS ${table}_after_insert_trigger ON ${table};
        
        -- Ripristina il trigger BEFORE originale
        CREATE TRIGGER ${table}_before_changes_trigger
        BEFORE INSERT OR UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION track_entity_changes();
      `);
    }
  }
};