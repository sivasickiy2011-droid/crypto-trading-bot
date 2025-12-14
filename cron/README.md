# Настройка автозапуска на сервере

## Быстрая установка

1. **Скопируй скрипт на сервер:**
```bash
scp cron/bot-scheduler.sh user@your-server:/home/user/crypto-bot/
```

2. **Сделай исполняемым:**
```bash
chmod +x /home/user/crypto-bot/bot-scheduler.sh
```

3. **Добавь в cron (запуск каждые 5 минут):**
```bash
crontab -e
```

Добавь строку:
```
*/5 * * * * /home/user/crypto-bot/bot-scheduler.sh >> /var/log/crypto-bot.log 2>&1
```

4. **Создай лог-файл:**
```bash
sudo touch /var/log/crypto-bot.log
sudo chmod 666 /var/log/crypto-bot.log
```

5. **Проверь работу:**
```bash
tail -f /var/log/crypto-bot.log
```

## Альтернатива: systemd timer

Создай `/etc/systemd/system/crypto-bot.service`:
```ini
[Unit]
Description=Crypto Trading Bot Executor
After=network.target

[Service]
Type=oneshot
ExecStart=/home/user/crypto-bot/bot-scheduler.sh
StandardOutput=journal
StandardError=journal
```

Создай `/etc/systemd/system/crypto-bot.timer`:
```ini
[Unit]
Description=Run Crypto Bot every 5 minutes
Requires=crypto-bot.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

Активируй:
```bash
sudo systemctl daemon-reload
sudo systemctl enable crypto-bot.timer
sudo systemctl start crypto-bot.timer
```

Проверь статус:
```bash
sudo systemctl status crypto-bot.timer
sudo journalctl -u crypto-bot.service -f
```

## Мониторинг

Просмотр логов:
```bash
# Последние 100 строк
tail -100 /var/log/crypto-bot.log

# Реальное время
tail -f /var/log/crypto-bot.log

# Только ошибки
grep "❌" /var/log/crypto-bot.log

# Статистика за день
grep "$(date '+%Y-%m-%d')" /var/log/crypto-bot.log | grep "✅" | wc -l
```

## Остановка

Cron:
```bash
crontab -e  # Удали или закомментируй строку
```

Systemd:
```bash
sudo systemctl stop crypto-bot.timer
sudo systemctl disable crypto-bot.timer
```
