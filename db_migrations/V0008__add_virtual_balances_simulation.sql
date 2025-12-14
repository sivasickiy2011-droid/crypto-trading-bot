-- Виртуальные балансы пользователей для симуляции
CREATE TABLE IF NOT EXISTS virtual_balances (
    user_id INTEGER PRIMARY KEY,
    balance DECIMAL(18, 2) DEFAULT 10000.00,
    initial_balance DECIMAL(18, 2) DEFAULT 10000.00,
    total_pnl DECIMAL(18, 2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем дополнительные поля в virtual_trades
ALTER TABLE virtual_trades ADD COLUMN IF NOT EXISTS bot_id INTEGER;
ALTER TABLE virtual_trades ADD COLUMN IF NOT EXISTS signal_id INTEGER;
ALTER TABLE virtual_trades ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT true;

-- Вставляем начальный баланс для пользователя 2
INSERT INTO virtual_balances (user_id, balance, initial_balance) 
VALUES (2, 10000.00, 10000.00) 
ON CONFLICT (user_id) DO NOTHING;