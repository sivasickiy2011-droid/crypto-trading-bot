#!/bin/bash

# Настройка триггера для автозапуска bot-scheduler каждые 5 минут
# Yandex Cloud Functions Trigger с cron расписанием

FOLDER_ID="b1g5k8cjhe07r04j6glg"  # Мой folder ID где развернуты функции
FUNCTION_ID="3baf1812-37ea-46ef-bb85-dbed89ed66a5"  # bot-scheduler function ID
SERVICE_ACCOUNT_ID="ajehnve9qlnpj2ofk18p"  # Service account с правами на вызов функций

# Cron выражение: каждые 5 минут
CRON_EXPRESSION="*/5 * * * ? *"

echo "Создаю триггер для автозапуска торговых ботов..."
echo "Функция: bot-scheduler ($FUNCTION_ID)"
echo "Расписание: каждые 5 минут"
echo ""

yc serverless trigger create timer \
  --name bot-executor-cron \
  --description "Автозапуск торговых ботов каждые 5 минут" \
  --cron-expression "$CRON_EXPRESSION" \
  --invoke-function-id $FUNCTION_ID \
  --invoke-function-service-account-id $SERVICE_ACCOUNT_ID \
  --folder-id $FOLDER_ID

echo ""
echo "✅ Триггер создан! Боты будут работать 24/7 автоматически."
