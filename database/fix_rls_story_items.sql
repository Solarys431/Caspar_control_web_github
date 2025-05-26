-- Script per diagnosticare e correggere problemi RLS con elementi STORY
-- Eseguire questo script per identificare e risolvere problemi di permessi

-- =====================================================
-- SEZIONE 1: DIAGNOSTICA PROBLEMI RLS
-- =====================================================

-- 1.1 Verifica policy esistenti per rundown_items
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'rundown_items'
ORDER BY policyname;

-- 1.2 Verifica utenti e rundown di test
SELECT 
    r.id as rundown_id,
    r.name as rundown_name,
    r.owner_id,
    COUNT(ri.id) as items_count,
    COUNT(CASE WHEN ri.type = 'STORY' THEN 1 END) as story_count
FROM rundowns r
LEFT JOIN rundown_items ri ON r.id = ri.rundown_id
GROUP BY r.id, r.name, r.owner_id
ORDER BY r.created_at DESC
LIMIT 5;

-- 1.3 Verifica collaboratori per rundown specifico
SELECT 
    rc.rundown_id,
    rc.user_id,
    rc.role,
    r.name as rundown_name,
    r.owner_id
FROM rundown_collaborators rc
JOIN rundowns r ON rc.rundown_id = r.id
WHERE rc.rundown_id = 'f08bd164-e222-4b75-98e5-9273c55dcc3e';

-- =====================================================
-- SEZIONE 2: TEST PERMESSI SPECIFICI
-- =====================================================

-- 2.1 Funzione per testare permessi inserimento senza effettivamente inserire
CREATE OR REPLACE FUNCTION test_story_insert_permissions(
    p_rundown_id UUID,
    p_user_id UUID
) RETURNS TABLE (
    can_insert BOOLEAN,
    error_message TEXT,
    user_role TEXT
) AS $$
DECLARE
    v_is_owner BOOLEAN := FALSE;
    v_collaborator_role TEXT := NULL;
    v_effective_role TEXT := 'no_access';
    v_can_insert BOOLEAN := FALSE;
    v_error_msg TEXT := NULL;
BEGIN
    -- Verifica se l'utente è proprietario
    SELECT (owner_id = p_user_id) INTO v_is_owner
    FROM rundowns 
    WHERE id = p_rundown_id;
    
    IF v_is_owner THEN
        v_effective_role := 'owner';
        v_can_insert := TRUE;
    ELSE
        -- Verifica se è collaboratore
        SELECT role INTO v_collaborator_role
        FROM rundown_collaborators
        WHERE rundown_id = p_rundown_id AND user_id = p_user_id;
        
        IF v_collaborator_role IS NOT NULL THEN
            v_effective_role := v_collaborator_role;
            v_can_insert := v_collaborator_role IN ('editor', 'playout_operator');
        END IF;
    END IF;
    
    IF NOT v_can_insert THEN
        v_error_msg := 'Utente non ha permessi di modifica. Ruolo: ' || v_effective_role;
    END IF;
    
    RETURN QUERY SELECT v_can_insert, v_error_msg, v_effective_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 Test permessi per utente specifico
SELECT * FROM test_story_insert_permissions(
    'f08bd164-e222-4b75-98e5-9273c55dcc3e'::UUID,
    '5d9357c9-57b2-46ad-9dd2-81be872ca3ed'::UUID
);

-- =====================================================
-- SEZIONE 3: CORREZIONI POLICY RLS
-- =====================================================

-- 3.1 Backup delle policy esistenti (per rollback se necessario)
CREATE TABLE IF NOT EXISTS policy_backup AS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    now() as backup_date
FROM pg_policies 
WHERE tablename IN ('rundowns', 'rundown_items', 'rundown_collaborators');

-- 3.2 Rimuovi policy problematiche se esistono
DROP POLICY IF EXISTS "Users can insert rundown items if they can edit" ON rundown_items;

-- 3.3 Crea policy corretta per inserimento elementi
CREATE POLICY "Users can insert rundown items if they can edit" ON rundown_items
FOR INSERT 
WITH CHECK (
    -- L'utente deve essere proprietario del rundown
    rundown_id IN (
        SELECT id FROM rundowns WHERE owner_id = auth.uid()
    )
    OR
    -- Oppure deve essere collaboratore con ruolo appropriato
    rundown_id IN (
        SELECT rundown_id FROM rundown_collaborators 
        WHERE user_id = auth.uid() 
        AND role IN ('editor', 'playout_operator')
    )
);

-- 3.4 Verifica che la policy sia stata creata correttamente
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'rundown_items' 
AND policyname = 'Users can insert rundown items if they can edit';

-- =====================================================
-- SEZIONE 4: TEST POST-CORREZIONE
-- =====================================================

-- 4.1 Test inserimento simulato per verificare policy
-- NOTA: Questo test deve essere eseguito con un utente autenticato

-- 4.2 Funzione per aggiungere utente come collaboratore (per test)
CREATE OR REPLACE FUNCTION add_test_collaborator(
    p_rundown_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'editor'
) RETURNS BOOLEAN AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    -- Verifica che il rundown esista
    SELECT owner_id INTO v_owner_id
    FROM rundowns 
    WHERE id = p_rundown_id;
    
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Rundown non trovato: %', p_rundown_id;
    END IF;
    
    -- Inserisci collaboratore se non esiste già
    INSERT INTO rundown_collaborators (rundown_id, user_id, role)
    VALUES (p_rundown_id, p_user_id, p_role)
    ON CONFLICT (rundown_id, user_id) 
    DO UPDATE SET role = EXCLUDED.role;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 Aggiungi utente come editor per test (sostituire con ID utente reale)
-- SELECT add_test_collaborator(
--     'f08bd164-e222-4b75-98e5-9273c55dcc3e'::UUID,
--     'ID_UTENTE_CORRENTE'::UUID,
--     'editor'
-- );

-- =====================================================
-- SEZIONE 5: VERIFICA FINALE
-- =====================================================

-- 5.1 Verifica stato finale permessi
SELECT 
    r.id as rundown_id,
    r.name,
    r.owner_id,
    rc.user_id as collaborator_id,
    rc.role as collaborator_role,
    CASE 
        WHEN r.owner_id = rc.user_id THEN 'owner'
        WHEN rc.role IS NOT NULL THEN rc.role
        ELSE 'no_access'
    END as effective_role
FROM rundowns r
LEFT JOIN rundown_collaborators rc ON r.id = rc.rundown_id
WHERE r.id = 'f08bd164-e222-4b75-98e5-9273c55dcc3e'
ORDER BY rc.role;

-- 5.2 Verifica policy finali
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'INSERT' THEN with_check
        ELSE qual
    END as policy_condition
FROM pg_policies 
WHERE tablename = 'rundown_items'
ORDER BY cmd, policyname;

-- =====================================================
-- SEZIONE 6: CLEANUP (opzionale)
-- =====================================================

-- 6.1 Rimuovi funzioni di test se non più necessarie
-- DROP FUNCTION IF EXISTS test_story_insert_permissions(UUID, UUID);
-- DROP FUNCTION IF EXISTS add_test_collaborator(UUID, UUID, TEXT);

-- 6.2 Rimuovi tabella backup se tutto funziona
-- DROP TABLE IF EXISTS policy_backup;

-- =====================================================
-- ISTRUZIONI PER L'USO:
-- =====================================================

/*
1. Eseguire le sezioni 1-2 per diagnosticare il problema
2. Eseguire la sezione 3 per applicare le correzioni
3. Eseguire la sezione 4 per testare le correzioni
4. Se necessario, aggiungere l'utente corrente come collaboratore:
   
   SELECT add_test_collaborator(
       'f08bd164-e222-4b75-98e5-9273c55dcc3e'::UUID,
       'TUO_USER_ID'::UUID,
       'editor'
   );

5. Eseguire la sezione 5 per verificare che tutto funzioni
6. Opzionalmente, eseguire la sezione 6 per cleanup
*/
