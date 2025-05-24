# SQL Queries for Supabase Tables

## `reviews` Table
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  location_id INT NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## `review_likes` Table
```sql
CREATE TABLE review_likes (
  id SERIAL PRIMARY KEY,
  review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## `locations` Table
```sql
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Updated `locations` Table
```sql
ALTER TABLE locations
ADD COLUMN latitude FLOAT NOT NULL,
ADD COLUMN longitude FLOAT NOT NULL,
ADD COLUMN image TEXT,
ADD COLUMN type TEXT CHECK (type IN ('lodge', 'restaurant'));
```

## `users` Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```