-- Create table for storing user API keys (encrypted)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    exchange VARCHAR(50) NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exchange)
);

-- Add new user for you (you'll set password on first login)
-- Using a temporary password that will require reset
INSERT INTO users (username, password_hash) 
VALUES ('owner', '$2b$12$EmptyPasswordNeedsReset00000000000000000000000000000')
ON CONFLICT (username) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
