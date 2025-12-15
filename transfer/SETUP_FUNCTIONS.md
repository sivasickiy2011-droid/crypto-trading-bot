# Настройка функций на function.centerai.tech

## Шаг 1: Добавить CORS в nginx

```bash
ssh root@function.centerai.tech

# Редактируем конфиг nginx
nano /etc/nginx/sites-enabled/function.centerai.tech
# или
nano /etc/nginx/conf.d/function.centerai.tech.conf
```

Найди блок с `location /api/` и добавь CORS заголовки:

```nginx
location /api/ {
    # Существующие настройки proxy_pass (НЕ ТРОГАЙ!)
    
    # Добавь эти строки в конец блока location:
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, X-User-Id, X-Auth-Token' always;
    add_header 'Access-Control-Max-Age' '86400' always;
    
    # Обработка preflight запросов
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, X-User-Id, X-Auth-Token';
        add_header 'Access-Control-Max-Age' '86400';
        add_header 'Content-Length' '0';
        add_header 'Content-Type' 'text/plain';
        return 204;
    }
}
```

Перезапусти nginx:
```bash
nginx -t
systemctl reload nginx
```

Проверь CORS:
```bash
curl -I https://function.centerai.tech/api/bybit-market?action=tickers
# Должен быть заголовок: Access-Control-Allow-Origin: *
```

## Шаг 2: Перенести 3 функции с БД

### 2.1 Настроить DATABASE_URL в Python Gateway

```bash
nano /var/www/universal-backend/python-gateway/ecosystem.config.js
```

Добавь переменную окружения:
```javascript
env: {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/crypto_bot',
  // ... остальные переменные
}
```

Или если используешь другой способ запуска:
```bash
export DATABASE_URL='postgresql://user:password@localhost:5432/crypto_bot'
```

### 2.2 Создать таблицы в PostgreSQL

```bash
psql -U postgres -d crypto_bot
```

Выполни миграции:

```sql
-- Таблица для виртуальных сделок
CREATE TABLE IF NOT EXISTS virtual_trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    leverage INTEGER DEFAULT 1,
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    close_price DECIMAL(20, 8),
    pnl DECIMAL(20, 8),
    status VARCHAR(10) DEFAULT 'open',
    bot_id VARCHAR(50),
    signal_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_virtual_trades_user_id ON virtual_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_trades_status ON virtual_trades(status);

-- Таблица для API ключей (если нет)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, exchange)
);

-- Добавить колонку language в users (если таблица users уже есть)
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'ru';

-- Таблица для настроек пользователей
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    charts_enabled BOOLEAN DEFAULT TRUE,
    signals_mode VARCHAR(20) DEFAULT 'bots_only',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 Скопировать файлы функций

#### virtual-trades
```bash
cd /var/www/universal-backend/python-gateway/function
nano virtual_trades.py
```

Вставь содержимое `backend/virtual-trades/index.py` (без изменений)

#### language
```bash
nano language.py
```

Вставь содержимое `backend/language-switcher/index.py` (без изменений)

#### bybit-user-data
```bash
nano bybit_user_data.py
```

Вставь содержимое `backend/bybit-user-data/index.py` (без изменений)

#### user-settings
```bash
nano user_settings.py
```

Вставь содержимое `backend/user-settings/index.py` (будет создан далее)

### 2.4 Перезапустить Python Gateway

```bash
pm2 restart python-gateway
pm2 logs python-gateway
```

## Шаг 3: Проверить работу функций

```bash
# 1. virtual-trades
curl "https://function.centerai.tech/api/virtual-trades?status=all&limit=10" \
  -H "X-User-Id: 2"

# 2. language
curl "https://function.centerai.tech/api/language" \
  -H "X-User-Id: 2"

# 3. bybit-user-data (требует API ключи в БД)
curl "https://function.centerai.tech/api/bybit-user-data?action=balance" \
  -H "X-User-Id: 2"

# 4. user-settings
curl "https://function.centerai.tech/api/user-settings" \
  -H "X-User-Id: 2"
```

## Шаг 4: Обновить URL в Python Gateway маппинге

Если в Python Gateway есть маппинг функций к путям, добавь:

```python
'/virtual-trades': virtual_trades.handler,
'/language': language.handler,
'/bybit-user-data': bybit_user_data.handler,
'/user-settings': user_settings.handler,
```

## Итого будут работать:

✅ bybit-market (уже работает)  
✅ strategy-signals (уже работает)  
✅ pair-analyzer (уже работает)  
✅ auto-trader (уже работает)  
✅ virtual-trades (новая)  
✅ language (новая)  
✅ bybit-user-data (новая)  
✅ user-settings (новая)  

Всё с CORS заголовками и PostgreSQL интеграцией!
