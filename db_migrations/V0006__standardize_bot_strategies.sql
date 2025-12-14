-- Приведение стратегий к единому формату с бэктестом
UPDATE t_p69937905_crypto_trading_bot.bots 
SET strategy = 'EMA 9/21/55 (тренд + кросс)' 
WHERE strategy IN ('MA Crossover', 'ma-crossover');

UPDATE t_p69937905_crypto_trading_bot.bots 
SET strategy = 'RSI 14 + EMA50 (отбой от зон)' 
WHERE strategy IN ('RSI', 'rsi');

UPDATE t_p69937905_crypto_trading_bot.bots 
SET strategy = 'BB + EMA50 (отбой от границ)' 
WHERE strategy IN ('Bollinger Bands', 'bollinger');

UPDATE t_p69937905_crypto_trading_bot.bots 
SET strategy = 'MACD + EMA200 (дивергенция)' 
WHERE strategy IN ('MACD', 'macd');

-- Помечаем неподдерживаемые стратегии (например, Мартингейл) как неактивные
UPDATE t_p69937905_crypto_trading_bot.bots 
SET active = false 
WHERE strategy NOT IN (
  'EMA 9/21/55 (тренд + кросс)',
  'RSI 14 + EMA50 (отбой от зон)',
  'BB + EMA50 (отбой от границ)',
  'MACD + EMA200 (дивергенция)'
);
