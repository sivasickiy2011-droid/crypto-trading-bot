#!/bin/bash

# Автозапуск bot-executor каждые 5 минут
# Установка: crontab -e
# Добавить строку: */5 * * * * /path/to/cron/bot-scheduler.sh >> /var/log/crypto-bot.log 2>&1

EXECUTOR_URL="https://functions.poehali.dev/e2dd154c-dde5-456b-a4c6-1200070fcc75"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting bot executor..."

RESPONSE=$(curl -s -X GET "$EXECUTOR_URL" -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] Response: $RESPONSE"
    
    # Проверяем успешность
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "[$TIMESTAMP] ✅ Bot executor completed successfully"
    else
        echo "[$TIMESTAMP] ⚠️ Bot executor returned error"
    fi
else
    echo "[$TIMESTAMP] ❌ Failed to call bot executor"
fi

echo "[$TIMESTAMP] Finished"
echo "---"
