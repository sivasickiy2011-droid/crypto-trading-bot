-- Create trades history table
CREATE TABLE IF NOT EXISTS trades_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    qty DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_data JSONB
);

-- Create index for faster queries
CREATE INDEX idx_trades_user_id ON trades_history(user_id);
CREATE INDEX idx_trades_created_at ON trades_history(created_at DESC);