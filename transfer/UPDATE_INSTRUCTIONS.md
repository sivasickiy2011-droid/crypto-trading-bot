# Инструкция по обновлению криптобота с реальной интеграцией Bybit

## Шаг 1: Обновить auto-trader в Python Gateway

```bash
# 1. Перейди в папку функций
cd /var/www/universal-backend/python-gateway/function

# 2. Создай резервную копию
cp auto_trader.py auto_trader.py.old

# 3. Скопируй новый файл из проекта
# (Файл уже обновлён в backend/auto-trader/index.py - нужно скопировать на сервер)

# 4. Перезапусти Python Gateway
pm2 restart python-gateway
```

## Шаг 2: Обновить bot-executor с реальной интеграцией Bybit

```bash
# 1. Перейди в папку bot-executor
cd /root/ymj_bot/cloud-function-executor

# 2. Создай резервную копию
cp index.js index.js.old

# 3. Скопируй новый код из transfer/bot-executor-index.js
# (Содержимое ниже)

# 4. Перезапусти bot-executor
pm2 restart bot-executor

# 5. Проверь статус
pm2 logs bot-executor --lines 20
```

## Шаг 3: Настроить API ключи Bybit (опционально)

Если хочешь реальную торговлю:

```bash
# 1. Открой ecosystem.config.js
nano /root/ymj_bot/cloud-function-executor/ecosystem.config.js

# 2. Добавь переменные окружения:
module.exports = {
  apps: [{
    name: 'bot-executor',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      BYBIT_API_KEY: 'твой_ключ_здесь',
      BYBIT_API_SECRET: 'твой_секрет_здесь'
    }
  }]
};

# 3. Перезапусти с новыми переменными
pm2 delete bot-executor
pm2 start ecosystem.config.js
```

## Шаг 4: Проверить работу

```bash
# 1. Проверь health check
curl http://127.0.0.1:3002/health

# Должен вернуть:
# {"status":"ok","service":"bot-executor","bybitConfigured":true}

# 2. Тест mock сделки (если ключи не настроены)
curl -X POST http://127.0.0.1:3001/auto-trader \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"buy","amount":0.001}'

# 3. Тест через внешний URL
curl -X POST https://function.centerai.tech/api/auto-trader \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"buy","amount":0.001}'
```

## Что изменилось:

### auto-trader (backend/auto-trader/index.py):
- ✅ Теперь принимает параметры symbol, side, amount через POST body или query
- ✅ Использует переменную окружения BOT_EXECUTOR_URL (по умолчанию http://127.0.0.1:3002/execute)
- ✅ Передаёт параметры сделки в bot-executor

### bot-executor (transfer/bot-executor-index.js):
- ✅ Реальная интеграция с Bybit API V5
- ✅ Генерация подписи запросов (HMAC SHA256)
- ✅ POST /execute - размещение Market ордеров
- ✅ GET /balance - проверка баланса
- ✅ GET /orders - получение активных ордеров
- ✅ Работает в двух режимах:
  - **Mock mode** (без API ключей) - возвращает тестовые данные
  - **Live mode** (с API ключами) - реальная торговля

## Безопасность:

⚠️ **ВАЖНО**: Если настраиваешь реальные ключи Bybit:
1. Используй API ключи только с правами на торговлю (без вывода средств)
2. Установи IP whitelist в настройках API ключа на Bybit
3. Используй testnet для тестирования: https://testnet.bybit.com

## Тестирование:

```bash
# Проверка всех 4 функций:

# 1. bybit-market
curl "https://function.centerai.tech/api/bybit-market?action=tickers"

# 2. strategy-signals  
curl "https://function.centerai.tech/api/strategy-signals?symbol=BTCUSDT&interval=1h"

# 3. pair-analyzer
curl "https://function.centerai.tech/api/pair-analyzer?symbols=BTCUSDT,ETHUSDT"

# 4. auto-trader (НОВЫЙ - с реальной интеграцией)
curl -X POST https://function.centerai.tech/api/auto-trader \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"buy","amount":0.001}'
```

## Дополнительные эндпоинты bot-executor:

```bash
# Проверка баланса
curl http://127.0.0.1:3002/balance

# Активные ордера
curl http://127.0.0.1:3002/orders?symbol=BTCUSDT
```
