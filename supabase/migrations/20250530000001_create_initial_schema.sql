-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

-- Create the locations table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  type VARCHAR(50) CHECK (type IN ('lodge', 'hotel', 'restaurant', 'fast_food')),
  image VARCHAR(255) DEFAULT '/placeholder.svg',
  rating DECIMAL(3, 2) DEFAULT 0.00,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance DECIMAL(10, 2),
  amenities TEXT[],
  price_range VARCHAR(50),
  capacity INTEGER CHECK (capacity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_coordinates CHECK (
    latitude BETWEEN -90 AND 90 AND 
    longitude BETWEEN -180 AND 180
  )
);

-- Create the users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name VARCHAR(255),
  user_name VARCHAR(255),
  avatar_url VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  default_payment_method VARCHAR(50) DEFAULT 'credit_card' CHECK (default_payment_method IN ('credit_card', 'paypal', 'bank_transfer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create the bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  guests INTEGER NOT NULL CHECK (guests > 0),
  payment_method VARCHAR(50) DEFAULT 'credit_card' CHECK (payment_method IN ('credit_card', 'paypal', 'bank_transfer')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'refunded')),
  total_amount DECIMAL(10, 2) DEFAULT 0 CHECK (total_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_duplicate_bookings UNIQUE (user_id, location_id, start_date, end_date),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create the reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  likes INTEGER DEFAULT 0 CHECK (likes >= 0),
  is_liked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT one_review_per_booking UNIQUE (user_id, booking_id),
  CONSTRAINT one_review_per_location_per_user UNIQUE (user_id, location_id)
);

-- Create the favorites table
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_favorite UNIQUE (user_id, location_id)
);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON locations FOR SELECT USING (true);

CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (status != 'completed');
CREATE POLICY "Users can cancel own bookings" ON bookings FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for completed bookings" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.user_id = auth.uid() AND bookings.status = 'completed'));
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (created_at + INTERVAL '24 hours' > CURRENT_TIMESTAMP);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX locations_coordinates_idx ON locations (latitude, longitude);
CREATE INDEX bookings_date_range_idx ON bookings (location_id, start_date, end_date);
CREATE INDEX reviews_location_rating_idx ON reviews (location_id, rating);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_location_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE locations
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE location_id = COALESCE(NEW.location_id, OLD.location_id)
  )
  WHERE id = COALESCE(NEW.location_id, OLD.location_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_booking_availability(
  p_location_id INTEGER,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_guests INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  location_capacity INTEGER;
  existing_bookings INTEGER;
BEGIN
  SELECT capacity INTO location_capacity FROM locations WHERE id = p_location_id;
  SELECT COUNT(*) INTO existing_bookings
  FROM bookings
  WHERE location_id = p_location_id
    AND status IN ('confirmed', 'pending')
    AND ((start_date, end_date) OVERLAPS (p_start_date, p_end_date));
  RETURN existing_bookings = 0 AND p_guests <= location_capacity;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_booking_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_booking_availability(NEW.location_id, NEW.start_date, NEW.end_date, NEW.guests) THEN
    RAISE EXCEPTION 'Location is not available for the selected dates or guest count exceeds capacity';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_location_rating();

CREATE TRIGGER check_booking_availability_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_before_insert();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();