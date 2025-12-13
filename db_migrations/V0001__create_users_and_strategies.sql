-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create strategy_configs table to save user strategies
CREATE TABLE IF NOT EXISTS strategy_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    strategy_name VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default user (username: admin, password: admin123)
-- Password hash generated with bcrypt
INSERT INTO users (username, password_hash) 
VALUES ('admin', '$2b$10$rZ5L9F8vXGHqKJxJ8yqNYu8V8ZqK9XZqKJxJ8yqNYu8V8ZqK9XZQO')
ON CONFLICT (username) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_strategy_configs_user_id ON strategy_configs(user_id);
