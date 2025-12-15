# Инструкция по переносу функций

## 📦 Что переносим
4 функции криптобота на твой сервер `https://function.centerai.tech`:
1. **bybit-market** - получение рыночных данных (88+ запросов/день)
2. **strategy-signals** - расчёт торговых сигналов
3. **pair-analyzer** - анализ криптопар
4. **auto-trader** - триггер автоторговли (15-минутный таймер)

## 🚀 Шаги установки

### 1. Скопируй файлы
```bash
# Скопируй эти файлы в твой python-gateway/functions/
bybit_market.py
strategy_signals.py
pair_analyzer.py
auto_trader.py
```

### 2. Обнови main.py
Замени свой `python-gateway/main.py` на файл `main.py` из этой папки.
Он уже содержит все роуты (старые + новые).

### 3. Проверь зависимости
В твоём `python-gateway/requirements.txt` должно быть:
```
fastapi
uvicorn
python-dotenv
requests
beautifulsoup4
```

Если чего-то нет — добавь.

### 4. Перезапусти сервер
```bash
cd python-gateway
pm2 restart ecosystem.config.js
# или
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

### 5. Проверь работоспособность
Открой в браузере (или через curl):

```bash
# Проверка здоровья
curl https://function.centerai.tech/health

# Тест рыночных данных
curl "https://function.centerai.tech/bybit-market?action=tickers&symbols=BTCUSDT"

# Тест сигналов
curl "https://function.centerai.tech/strategy-signals?symbol=BTCUSDT"

# Тест анализатора пар
curl "https://function.centerai.tech/pair-analyzer"

# Тест авто-трейдера
curl https://function.centerai.tech/auto-trader
```

## 📝 Обновление фронтенда

После успешного запуска на твоём сервере нужно обновить URL в файле:
`src/config/functions.ts`

Замени:
```typescript
// БЫЛО:
bybitMarket: 'https://functions.poehali.dev/...',
strategySignals: 'https://functions.poehali.dev/...',
pairAnalyzer: 'https://functions.poehali.dev/...',
autoTrader: 'https://functions.poehali.dev/...',

// СТАЛО:
bybitMarket: 'https://function.centerai.tech/bybit-market',
strategySignals: 'https://function.centerai.tech/strategy-signals',
pairAnalyzer: 'https://function.centerai.tech/pair-analyzer',
autoTrader: 'https://function.centerai.tech/auto-trader',
```

## ⏰ Настройка cron для auto-trader

Чтобы auto-trader запускался каждые 15 минут:

**Вариант 1: crontab**
```bash
crontab -e
# Добавь строку:
*/15 * * * * curl -X GET https://function.centerai.tech/auto-trader
```

**Вариант 2: PM2 cron**
```javascript
// В ecosystem.config.js добавь:
{
  name: "auto-trader-cron",
  script: "curl",
  args: "-X GET https://function.centerai.tech/auto-trader",
  cron_restart: "*/15 * * * *"
}
```

## 🎯 Результат

После переноса:
- ✅ 88+ запросов/день сняты с poehali.dev
- ✅ Триггер авто-торговли заработает
- ✅ Все функции без БД работают на твоём сервере
- ✅ 14 функций с БД остаются на poehali.dev (auth, bots, api-keys, etc.)

## 🐛 Если что-то не работает

1. Проверь логи:
```bash
pm2 logs python-gateway
```

2. Проверь, что порт 3001 открыт в файрволе

3. Убедись, что nginx проксирует запросы на 3001 порт

4. Проверь CORS в логах браузера (F12 → Console)

Готово! 🚀
