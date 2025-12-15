# 🚀 Быстрый старт: CORS + Функции на function.centerai.tech

## ⚠️ КРИТИЧНО: Сначала настрой CORS!

Без CORS фронтенд НЕ СМОЖЕТ общаться с твоим сервером.

### 1️⃣ Добавить CORS в nginx (5 минут)

```bash
ssh root@function.centerai.tech

# Открой конфиг nginx
nano /etc/nginx/sites-enabled/function.centerai.tech
```

Найди блок `location /api/` и добавь в конец блока:

```nginx
location /api/ {
    # ... твои существующие строки proxy_pass НЕ ТРОГАЙ ...
    
    # CORS заголовки - добавь в конец:
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, X-User-Id' always;
    
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, X-User-Id';
        add_header 'Content-Length' '0';
        return 204;
    }
}
```

Примени изменения:
```bash
nginx -t && systemctl reload nginx
```

Проверь что CORS работает:
```bash
curl -I https://function.centerai.tech/api/bybit-market?action=tickers
# Должна быть строка: Access-Control-Allow-Origin: *
```

✅ **Если видишь `Access-Control-Allow-Origin: *` - CORS работает!**

---

## 2️⃣ Настроить DATABASE_URL (2 минуты)

```bash
# Узнай данные своей PostgreSQL БД:
psql -U postgres -l

# Экспортируй DATABASE_URL для Python Gateway
export DATABASE_URL='postgresql://username:password@localhost:5432/crypto_bot'

# Или добавь в ecosystem.config.js для pm2:
nano /var/www/universal-backend/python-gateway/ecosystem.config.js
```

В `ecosystem.config.js` добавь:
```javascript
env: {
  DATABASE_URL: 'postgresql://username:password@localhost:5432/dbname',
  // ... остальные переменные
}
```

---

## 3️⃣ Создать таблицы (3 минуты)

```bash
psql -U postgres -d crypto_bot
```

Скопируй и выполни:

```sql
-- virtual_trades
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
    signal_id VARCHAR(50)
);

CREATE INDEX idx_virtual_trades_user ON virtual_trades(user_id);

-- user_api_keys (для bybit-user-data)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    UNIQUE(user_id, exchange)
);

-- Добавить language в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'ru';

-- Добавить settings в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS charts_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signals_mode VARCHAR(20) DEFAULT 'bots_only';
```

---

## 4️⃣ Скопировать Python функции (10 минут)

```bash
cd /var/www/universal-backend/python-gateway/function
```

### virtual-trades
```bash
nano virtual_trades.py
```
Скопируй содержимое из `backend/virtual-trades/index.py`

### language
```bash
nano language.py
```
Скопируй содержимое из `backend/language-switcher/index.py`

### bybit-user-data
```bash
nano bybit_user_data.py
```
Скопируй содержимое из `backend/bybit-user-data/index.py`

### user-settings
```bash
nano user_settings.py
```
Скопируй содержимое из `backend/user-settings/index.py`

**ВАЖНО:** В `user_settings.py` замени `t_p69937905_crypto_trading_bot.users` на просто `users` (строки 55 и 129)

---

## 5️⃣ Настроить роутинг в Python Gateway

Открой главный файл Python Gateway:
```bash
nano /var/www/universal-backend/python-gateway/main.py
# или
nano /var/www/universal-backend/python-gateway/app.py
```

Добавь импорты:
```python
import virtual_trades
import language
import bybit_user_data
import user_settings
```

Добавь роуты:
```python
routes = {
    '/virtual-trades': virtual_trades.handler,
    '/language': language.handler,
    '/bybit-user-data': bybit_user_data.handler,
    '/user-settings': user_settings.handler,
    # ... остальные роуты
}
```

---

## 6️⃣ Перезапустить и проверить

```bash
# Перезапусти Python Gateway
pm2 restart python-gateway

# Проверь логи
pm2 logs python-gateway --lines 50
```

Протестируй функции:

```bash
# 1. virtual-trades
curl "https://function.centerai.tech/api/virtual-trades?status=all" -H "X-User-Id: 2"

# 2. language
curl "https://function.centerai.tech/api/language" -H "X-User-Id: 2"

# 3. user-settings
curl "https://function.centerai.tech/api/user-settings" -H "X-User-Id: 2"

# 4. bybit-user-data (если есть API ключи)
curl "https://function.centerai.tech/api/bybit-user-data?action=balance" -H "X-User-Id: 2"
```

---

## ✅ Проверка успешности

Открой фронтенд приложение и проверь в F12 Console:

**Должны ИСЧЕЗНУТЬ ошибки:**
- ❌ Failed to fetch for virtual-trades
- ❌ Failed to fetch for language
- ❌ Failed to fetch for bybit-user-data
- ❌ Failed to fetch for user-settings
- ❌ CORS error

**Должны работать:**
- ✅ Графики цен (kline)
- ✅ Список пар (tickers)
- ✅ Торговые сигналы (strategy-signals)
- ✅ Виртуальные сделки
- ✅ Переключатель языка

---

## 🔥 Если что-то не работает:

### CORS ошибка
```bash
# Проверь nginx конфиг
nginx -t

# Проверь заголовки
curl -I https://function.centerai.tech/api/bybit-market?action=tickers | grep -i access

# Если не видишь Access-Control-Allow-Origin - CORS не настроен!
```

### База данных ошибка
```bash
# Проверь подключение
psql $DATABASE_URL -c "SELECT 1"

# Проверь что DATABASE_URL задан
echo $DATABASE_URL

# Проверь логи
pm2 logs python-gateway | grep DATABASE
```

### Функция не найдена
```bash
# Проверь что файлы на месте
ls -la /var/www/universal-backend/python-gateway/function/*.py

# Проверь роутинг в main.py
grep -A 10 "routes =" /var/www/universal-backend/python-gateway/main.py
```

---

## 🎯 Итого что будет работать:

| Функция | URL | Статус |
|---------|-----|--------|
| bybit-market | /api/bybit-market | ✅ Уже работает |
| strategy-signals | /api/strategy-signals | ✅ Уже работает |
| pair-analyzer | /api/pair-analyzer | ✅ Уже работает |
| auto-trader | /api/auto-trader | ✅ Уже работает |
| virtual-trades | /api/virtual-trades | 🆕 Нужно настроить |
| language | /api/language | 🆕 Нужно настроить |
| bybit-user-data | /api/bybit-user-data | 🆕 Нужно настроить |
| user-settings | /api/user-settings | 🆕 Нужно настроить |

Все с CORS + PostgreSQL + твой сервер! 🚀
