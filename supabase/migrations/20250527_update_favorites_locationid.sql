-- First, drop the foreign key constraint
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_location_id_fkey;

-- Change the column type to TEXT (since our location IDs are strings)
ALTER TABLE favorites ALTER COLUMN location_id TYPE TEXT USING location_id::TEXT;

-- Drop and recreate indexes to match new column type
DROP INDEX IF EXISTS idx_favorites_location_id;
CREATE INDEX idx_favorites_location_id ON favorites(location_id);

-- Create a function to validate location_id format if needed
CREATE OR REPLACE FUNCTION validate_location_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Add any validation logic here if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate location_id before insert/update
DROP TRIGGER IF EXISTS validate_location_id_trigger ON favorites;
CREATE TRIGGER validate_location_id_trigger
  BEFORE INSERT OR UPDATE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION validate_location_id();
