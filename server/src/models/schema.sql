CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE urls(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    short_code VARCHAR(20) UNIQUE NOT NULL,
    custom_alias BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clicks(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
    country VARCHAR(100),
    device VARCHAR(50),
    referrer TEXT,
    clicked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_clicks_url_id ON clicks(url_id);