-- Schema SQL per le tabelle rundown in Supabase
-- Segue gli stessi pattern delle tabelle scalette esistenti

-- Abilita l'estensione UUID se non già presente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella principale per i rundown
CREATE TABLE IF NOT EXISTS rundowns (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    owner_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Tabella per gli elementi del rundown
CREATE TABLE IF NOT EXISTS rundown_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rundown_id uuid REFERENCES rundowns(id) ON DELETE CASCADE NOT NULL,
    item_order integer NOT NULL,
    type text NOT NULL, -- 'MEDIA', 'TEMPLATE', 'STORY'
    name text, -- nome visualizzato/customName
    data jsonb NOT NULL, -- dettagli specifici dell'item
    version integer DEFAULT 1 NOT NULL, -- per locking ottimistico
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Tabella per i collaboratori del rundown
CREATE TABLE IF NOT EXISTS rundown_collaborators (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rundown_id uuid REFERENCES rundowns(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL, -- 'owner', 'editor', 'viewer', 'playout_operator'
    created_at timestamptz DEFAULT now(),
    UNIQUE(rundown_id, user_id)
);

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica trigger alle tabelle
CREATE TRIGGER update_rundowns_updated_at 
    BEFORE UPDATE ON rundowns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rundown_items_updated_at 
    BEFORE UPDATE ON rundown_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_rundown_items_rundown_id ON rundown_items(rundown_id);
CREATE INDEX IF NOT EXISTS idx_rundown_items_order ON rundown_items(rundown_id, item_order);
CREATE INDEX IF NOT EXISTS idx_rundown_collaborators_rundown_id ON rundown_collaborators(rundown_id);
CREATE INDEX IF NOT EXISTS idx_rundown_collaborators_user_id ON rundown_collaborators(user_id);

-- Abilita Row Level Security
ALTER TABLE rundowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE rundown_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rundown_collaborators ENABLE ROW LEVEL SECURITY;

-- Policy per rundowns: gli utenti possono vedere i rundown di cui sono proprietari o collaboratori
CREATE POLICY "Users can view their own rundowns" ON rundowns
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        id IN (
            SELECT rundown_id FROM rundown_collaborators 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create rundowns" ON rundowns
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their rundowns" ON rundowns
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their rundowns" ON rundowns
    FOR DELETE USING (owner_id = auth.uid());

-- Policy per rundown_items: accesso basato sui permessi del rundown
CREATE POLICY "Users can view rundown items they have access to" ON rundown_items
    FOR SELECT USING (
        rundown_id IN (
            SELECT id FROM rundowns WHERE owner_id = auth.uid()
            UNION
            SELECT rundown_id FROM rundown_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert rundown items if they can edit" ON rundown_items
    FOR INSERT WITH CHECK (
        rundown_id IN (
            SELECT id FROM rundowns WHERE owner_id = auth.uid()
            UNION
            SELECT rundown_id FROM rundown_collaborators 
            WHERE user_id = auth.uid() AND role IN ('editor', 'playout_operator')
        )
    );

CREATE POLICY "Users can update rundown items if they can edit" ON rundown_items
    FOR UPDATE USING (
        rundown_id IN (
            SELECT id FROM rundowns WHERE owner_id = auth.uid()
            UNION
            SELECT rundown_id FROM rundown_collaborators 
            WHERE user_id = auth.uid() AND role IN ('editor', 'playout_operator')
        )
    );

CREATE POLICY "Users can delete rundown items if they can edit" ON rundown_items
    FOR DELETE USING (
        rundown_id IN (
            SELECT id FROM rundowns WHERE owner_id = auth.uid()
            UNION
            SELECT rundown_id FROM rundown_collaborators 
            WHERE user_id = auth.uid() AND role IN ('editor', 'playout_operator')
        )
    );

-- Policy per rundown_collaborators: solo i proprietari possono gestire i collaboratori
CREATE POLICY "Users can view collaborators of their rundowns" ON rundown_collaborators
    FOR SELECT USING (
        rundown_id IN (SELECT id FROM rundowns WHERE owner_id = auth.uid()) OR
        user_id = auth.uid()
    );

CREATE POLICY "Owners can manage collaborators" ON rundown_collaborators
    FOR ALL USING (
        rundown_id IN (SELECT id FROM rundowns WHERE owner_id = auth.uid())
    );

-- Abilita realtime per le tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE rundowns;
ALTER PUBLICATION supabase_realtime ADD TABLE rundown_items;
ALTER PUBLICATION supabase_realtime ADD TABLE rundown_collaborators;
