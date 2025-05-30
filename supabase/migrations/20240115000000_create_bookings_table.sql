-- Create bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    guests INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
