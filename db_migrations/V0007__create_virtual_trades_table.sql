-- Таблица для виртуальных торговых позиций (симулятор)
CREATE TABLE IF NOT EXISTS virtual_trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'Buy' или 'Sell'
    quantity DECIMAL(18, 8) NOT NULL,
    entry_price DECIMAL(18, 8) NOT NULL,
    leverage INTEGER DEFAULT 10,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    close_price DECIMAL(18, 8),
    pnl DECIMAL(18, 8),
    status VARCHAR(20) DEFAULT 'open' -- 'open' или 'closed'
);

CREATE INDEX idx_virtual_trades_user ON virtual_trades(user_id);
CREATE INDEX idx_virtual_trades_status ON virtual_trades(status);