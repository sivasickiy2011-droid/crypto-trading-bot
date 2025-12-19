-- Создание таблицы для сигналов стратегий
CREATE TABLE IF NOT EXISTS strategy_signals (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    signal_type VARCHAR(10) NOT NULL, -- 'BUY' или 'SELL'
    price DECIMAL(20, 8) NOT NULL,
    ema9 DECIMAL(20, 8),
    ema21 DECIMAL(20, 8),
    rsi DECIMAL(10, 2),
    signal_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_strategy_signals_user_id ON strategy_signals(user_id);
CREATE INDEX idx_strategy_signals_symbol ON strategy_signals(symbol);
CREATE INDEX idx_strategy_signals_created_at ON strategy_signals(created_at DESC);
CREATE INDEX idx_strategy_signals_type ON strategy_signals(signal_type);
