-- Rename id column to user_id in users table
-- First, drop existing foreign key constraints
ALTER TABLE favorites DROP CONSTRAINT favorites_user_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT reviews_user_id_fkey;
ALTER TABLE review_likes DROP CONSTRAINT review_likes_user_id_fkey;

-- Rename the column
ALTER TABLE users RENAME COLUMN id TO user_id;

-- Recreate foreign key constraints
ALTER TABLE favorites
  ADD CONSTRAINT favorites_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE review_likes
  ADD CONSTRAINT review_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
