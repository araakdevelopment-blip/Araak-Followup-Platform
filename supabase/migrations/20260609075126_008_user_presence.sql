/*
# Add user_presence table

Tracks which users are currently online via heartbeat.
A user is considered "online" if they've sent a heartbeat in the last 2 minutes.
*/

CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  page_path text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_presence_active ON user_presence(is_active, last_heartbeat);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presence_select_all" ON user_presence FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "presence_upsert_own" ON user_presence FOR INSERT
  TO authenticated WITH CHECK (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "presence_update_own" ON user_presence FOR UPDATE
  TO authenticated USING (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Function to upsert presence (called from client)
CREATE OR REPLACE FUNCTION upsert_user_presence(p_page_path text DEFAULT '/')
RETURNS void
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  profile_id uuid;
BEGIN
  SELECT id INTO profile_id FROM user_profiles WHERE user_id = auth.uid();
  IF profile_id IS NULL THEN RETURN; END IF;

  INSERT INTO user_presence (user_id, last_heartbeat, page_path, is_active)
  VALUES (profile_id, now(), p_page_path, true)
  ON CONFLICT (user_id) DO UPDATE
  SET last_heartbeat = now(), page_path = p_page_path, is_active = true;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION upsert_user_presence(text) FROM anon;