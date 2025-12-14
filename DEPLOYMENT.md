# Инструкция по переносу на свой сервер

## 🎯 Что имеем сейчас

- **Frontend**: React приложение (poehali.dev)
- **Backend**: 13 Cloud Functions (Yandex Cloud Functions)
- **Database**: PostgreSQL (управляемая БД)
- **Триггеры**: Yandex Cloud Functions Triggers

## 🚀 Перенос на свой сервер

### Вариант 1: Полный перенос (рекомендуется)

#### 1. Подготовка сервера

Требования:
- Ubuntu 22.04 / Debian 11+ (или аналог)
- 4GB RAM минимум
- Python 3.11
- Node.js 18+
- PostgreSQL 15+
- Nginx

Установка зависимостей:
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-15 -y

# Nginx
sudo apt install nginx -y
```

#### 2. Создание структуры

```bash
mkdir -p /opt/crypto-bot/{backend,frontend,logs}
cd /opt/crypto-bot
```

#### 3. Перенос Backend Functions

**Конвертация в FastAPI:**

Создай `/opt/crypto-bot/backend/main.py`:
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import importlib.util
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Динамическая загрузка функций
FUNCTIONS = [
    "auth", "api-keys", "bots-manager", "bot-executor", 
    "bybit-market", "strategy-signals", "telegram-notify",
    "pair-analyzer", "gpt-assistant"
]

@app.post("/functions/{function_name}")
@app.get("/functions/{function_name}")
async def execute_function(function_name: str, request: Request):
    if function_name not in FUNCTIONS:
        return {"error": "Function not found"}
    
    # Загружаем модуль функции
    spec = importlib.util.spec_from_file_location(
        function_name, 
        f"/opt/crypto-bot/backend/{function_name}/index.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    
    # Формируем event как в Cloud Functions
    body = await request.body()
    event = {
        "httpMethod": request.method,
        "headers": dict(request.headers),
        "body": body.decode() if body else "",
        "queryStringParameters": dict(request.query_params)
    }
    
    # Мок context
    class Context:
        request_id = str(hash(str(event)))
        function_name = function_name
    
    # Вызываем handler
    result = module.handler(event, Context())
    
    return json.loads(result["body"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Копируем все функции:
```bash
# На локальной машине (где проект)
scp -r backend/* user@your-server:/opt/crypto-bot/backend/
```

Устанавливаем зависимости:
```bash
cd /opt/crypto-bot/backend
python3.11 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn psycopg2-binary python-multipart
```

#### 4. Frontend

Собираем и копируем:
```bash
# Локально
npm run build
scp -r dist/* user@your-server:/opt/crypto-bot/frontend/
```

#### 5. Настройка Nginx

Создай `/etc/nginx/sites-available/crypto-bot`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /opt/crypto-bot/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /functions/ {
        proxy_pass http://localhost:8000/functions/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Активируй:
```bash
sudo ln -s /etc/nginx/sites-available/crypto-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Systemd Service для Backend

Создай `/etc/systemd/system/crypto-bot-api.service`:
```ini
[Unit]
Description=Crypto Trading Bot API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/crypto-bot/backend
Environment="DATABASE_URL=postgresql://user:pass@localhost/crypto_bot"
Environment="OPENAI_API_KEY=sk-..."
ExecStart=/opt/crypto-bot/backend/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl daemon-reload
sudo systemctl enable crypto-bot-api
sudo systemctl start crypto-bot-api
```

#### 7. Cron для автозапуска ботов

Уже создан в `cron/bot-scheduler.sh`. Установка:
```bash
chmod +x cron/bot-scheduler.sh
crontab -e
# Добавь: */5 * * * * /opt/crypto-bot/cron/bot-scheduler.sh
```

#### 8. База данных

Экспорт из текущей БД:
```bash
pg_dump -h your-current-db-host -U user -d database > backup.sql
```

Импорт на новый сервер:
```bash
sudo -u postgres createdb crypto_bot
sudo -u postgres psql crypto_bot < backup.sql
```

### Вариант 2: Гибридный (только триггеры на сервере)

Оставляем все функции в Yandex Cloud, но триггеры заменяем на cron:

```bash
# Установка только cron-скрипта
scp cron/bot-scheduler.sh user@your-server:~/
chmod +x ~/bot-scheduler.sh
crontab -e
# Добавь: */5 * * * * ~/bot-scheduler.sh >> ~/crypto-bot.log 2>&1
```

## 📊 Мониторинг

После установки проверь:

1. **Backend работает:**
```bash
curl http://localhost:8000/functions/strategy-signals?symbols=BTCUSDT
```

2. **Frontend доступен:**
```bash
curl http://your-domain.com
```

3. **Cron работает:**
```bash
tail -f /var/log/crypto-bot.log
```

4. **База данных подключена:**
```bash
sudo -u postgres psql crypto_bot -c "SELECT * FROM bots LIMIT 5;"
```

## 🔐 Безопасность

1. **Firewall:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **SSL (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. **Переменные окружения:**
Никогда не храни секреты в коде! Используй `.env` или systemd Environment.

## 📝 Обновление функций

После изменений в коде:
```bash
# Локально
git pull
scp backend/function-name/index.py user@server:/opt/crypto-bot/backend/function-name/

# На сервере
sudo systemctl restart crypto-bot-api
```

## 💡 Полезные команды

```bash
# Логи FastAPI
sudo journalctl -u crypto-bot-api -f

# Логи Nginx
sudo tail -f /var/log/nginx/error.log

# Статус всех сервисов
sudo systemctl status crypto-bot-api nginx postgresql

# Перезапуск всего
sudo systemctl restart crypto-bot-api nginx
```
