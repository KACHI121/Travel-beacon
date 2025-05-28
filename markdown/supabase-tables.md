-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- LOCATIONS TABLE
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    latitude FLOAT,
    longitude FLOAT,
    image TEXT,
    type TEXT
);

-- FAVORITES TABLE
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now()
);

-- REVIEWS TABLE
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    likes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

-- REVIEW_LIKES TABLE
CREATE TABLE review_likes (
    id SERIAL PRIMARY KEY,
    review_id INT REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now()
);
