CREATE TABLE IF NOT EXISTS t_p69937905_crypto_trading_bot.bots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    bot_id VARCHAR(50) NOT NULL,
    pair VARCHAR(20) NOT NULL,
    market VARCHAR(10) NOT NULL,
    strategy VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    entry_signal TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bot_id)
);

CREATE INDEX IF NOT EXISTS idx_bots_user_id ON t_p69937905_crypto_trading_bot.bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_active ON t_p69937905_crypto_trading_bot.bots(active);