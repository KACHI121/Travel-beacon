-- Create user_favorites table with RLS policies
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_location UNIQUE (user_id, location_id)
);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own favorites
CREATE POLICY "Allow users to view their favorites"
  ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to add their own favorites
CREATE POLICY "Allow users to create favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own favorites
CREATE POLICY "Allow users to delete favorites"
  ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_location_id ON favorites(location_id);

-- Notify changes for real-time updates
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
