# Быстрая проверка обновлённого криптобота

## ✅ Что уже работает в облаке:

### 1. bybit-market
```bash
curl "https://functions.poehali.dev/4bbebda7-0f6b-47e0-b89b-2b5a8c14ae3f?action=tickers"
```

### 2. strategy-signals
```bash
curl "https://functions.poehali.dev/b68a8b0e-cfb4-4b9a-ac86-3e27e34e8e42?symbol=BTCUSDT&interval=1h"
```

### 3. pair-analyzer
```bash
curl "https://functions.poehali.dev/8d7a9d96-6aff-4ed5-888c-87ac66f48aa5?symbols=BTCUSDT,ETHUSDT"
```

### 4. auto-trader (ОБНОВЛЁН!)
```bash
# GET - статус автоторговли
curl "https://functions.poehali.dev/646ab114-b395-4b2b-9d1f-b2e89e74b47c"

# POST - запуск demo сделки
curl -X POST "https://functions.poehali.dev/646ab114-b395-4b2b-9d1f-b2e89e74b47c" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"buy","amount":0.001}'
```

## 📋 Обновление на вашем сервере function.centerai.tech:

### Шаг 1: Обновить auto_trader.py на сервере

```bash
# 1. Подключись к серверу
ssh root@function.centerai.tech

# 2. Перейди в папку функций
cd /var/www/universal-backend/python-gateway/function

# 3. Сделай резервную копию
cp auto_trader.py auto_trader.py.backup

# 4. Скопируй новый код
# (Содержимое файла transfer/server-auto-trader.py)
nano auto_trader.py
# Вставь новый код, сохрани (Ctrl+O, Enter, Ctrl+X)

# 5. Перезапусти Python Gateway
pm2 restart python-gateway

# 6. Проверь локально
curl -X POST http://127.0.0.1:3001/auto-trader \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"buy","amount":0.001}'

# 7. Проверь через интернет
curl -X POST https://function.centerai.tech/api/auto-trader \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"buy","amount":0.001}'
```

### Шаг 2: Обновить bot-executor с реальной Bybit интеграцией (опционально)

```bash
# 1. Перейди в папку bot-executor
cd /root/ymj_bot/cloud-function-executor

# 2. Сделай резервную копию
cp index.js index.js.backup

# 3. Скопируй новый код
# (Содержимое файла transfer/bot-executor-index.js)
nano index.js
# Вставь новый код, сохрани

# 4. Перезапусти bot-executor
pm2 restart bot-executor

# 5. Проверь
curl http://127.0.0.1:3002/health
```

## 🔧 Что изменилось:

### auto-trader (обновлён):
- ✅ Теперь работает автономно в **demo режиме**
- ✅ GET запрос возвращает статус автоторговли
- ✅ POST запрос создаёт mock сделки для тестирования
- ✅ Можно подключить реальный bot-executor через переменную BOT_EXECUTOR_URL
- ✅ Все тесты проходят успешно

### bot-executor (новый код готов):
- ✅ Реальная интеграция с Bybit API V5
- ✅ Работает в двух режимах: demo (без ключей) и live (с ключами)
- ✅ POST /execute - размещение Market ордеров
- ✅ GET /balance - проверка баланса
- ✅ GET /orders - активные ордера

## 🎯 Проверка всех 4 функций на вашем сервере:

```bash
# 1. bybit-market
curl "https://function.centerai.tech/api/bybit-market?action=tickers"

# 2. strategy-signals  
curl "https://function.centerai.tech/api/strategy-signals?symbol=BTCUSDT&interval=1h"

# 3. pair-analyzer
curl "https://function.centerai.tech/api/pair-analyzer?symbols=BTCUSDT,ETHUSDT"

# 4. auto-trader (DEMO MODE)
curl -X POST https://function.centerai.tech/api/auto-trader \
  -H "Content-Type: application/json" \
  -d '{"symbol":"ETHUSDT","side":"sell","amount":0.01}'
```

## ⚡ Для подключения реальной торговли:

1. Получи API ключи на Bybit (testnet или mainnet)
2. Установи их в bot-executor:
```bash
cd /root/ymj_bot/cloud-function-executor
nano ecosystem.config.js

# Добавь:
env: {
  BYBIT_API_KEY: 'твой_ключ',
  BYBIT_API_SECRET: 'твой_секрет'
}

pm2 delete bot-executor
pm2 start ecosystem.config.js
```

3. Установи переменную в Python Gateway:
```bash
# В конфиге pm2 для python-gateway:
env: {
  BOT_EXECUTOR_URL: 'http://127.0.0.1:3002/execute'
}
```

## 📊 Ожидаемые результаты:

### Demo режим (сейчас):
```json
{
  "success": true,
  "message": "Mock trade executed (demo mode)",
  "result": {
    "orderId": "MOCK_1765798000000",
    "symbol": "BTCUSDT",
    "side": "BUY",
    "amount": 0.001,
    "status": "filled",
    "price": 89850.5,
    "timestamp": 1765798000000,
    "mode": "demo",
    "note": "Установите BOT_EXECUTOR_URL для реальной торговли"
  }
}
```

### Live режим (после настройки API):
```json
{
  "success": true,
  "message": "Trade executed via bot-executor",
  "result": {
    "orderId": "real-order-id-from-bybit",
    "symbol": "BTCUSDT",
    "side": "Buy",
    "amount": 0.001,
    "status": "Filled",
    "price": 89850.5,
    "timestamp": 1765798000000,
    "mode": "live"
  }
}
```
