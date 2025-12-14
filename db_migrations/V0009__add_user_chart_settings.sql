-- Добавление настроек отображения графиков и сигналов для пользователей
ALTER TABLE t_p69937905_crypto_trading_bot.users 
ADD COLUMN charts_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN signals_mode VARCHAR(20) DEFAULT 'bots_only' CHECK (signals_mode IN ('disabled', 'bots_only', 'top10'));