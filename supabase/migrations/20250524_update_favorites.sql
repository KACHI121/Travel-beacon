-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS favorite_change_trigger ON favorites;
DROP FUNCTION IF EXISTS notify_favorite_change;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to view their favorites" ON favorites;
DROP POLICY IF EXISTS "Allow users to create favorites" ON favorites;
DROP POLICY IF EXISTS "Allow users to delete favorites" ON favorites;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_favorites_user_id;
DROP INDEX IF EXISTS idx_favorites_location_id;

-- Update timestamp column type
ALTER TABLE favorites ALTER COLUMN created_at TYPE TIMESTAMPTZ;
ALTER TABLE favorites ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE favorites ALTER COLUMN created_at SET NOT NULL;

-- Create new policies with updated names
CREATE POLICY "Allow users to view their favorites"
  ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete favorites"
  ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create new indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_location_id ON favorites(location_id);

-- Create new notify function and trigger
CREATE OR REPLACE FUNCTION notify_favorite_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'favorite_change',
    json_build_object(
      'type', TG_OP,
      'user_id', COALESCE(NEW.user_id, OLD.user_id),
      'location_id', COALESCE(NEW.location_id, OLD.location_id)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER favorite_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION notify_favorite_change();
