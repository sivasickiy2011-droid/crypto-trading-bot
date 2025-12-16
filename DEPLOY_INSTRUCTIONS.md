# Инструкция по развертыванию функции авторизации

## Подключение к серверу

```bash
ssh root@158.160.162.231
# Пароль: Xw1Utoce1!?!
```

## Вариант 1: Автоматическое развертывание (рекомендуется)

### Скопируйте скрипт на сервер:

```bash
# На вашем локальном компьютере:
scp deploy_auth.sh root@158.160.162.231:/tmp/
```

### Выполните скрипт на сервере:

```bash
# На сервере:
chmod +x /tmp/deploy_auth.sh
/tmp/deploy_auth.sh
```

## Вариант 2: Ручное развертывание

### 1. Создайте директорию:
```bash
mkdir -p /var/www/universal-backend/python-gateway/functions/auth
cd /var/www/universal-backend/python-gateway/functions/auth
```

### 2. Создайте index.py:
```bash
cat > index.py << 'EOPYTHON'
# Скопируйте содержимое из deploy_auth.sh
EOPYTHON
```

### 3. Создайте requirements.txt:
```bash
cat > requirements.txt << 'EOF'
psycopg2-binary==2.9.9
bcrypt==4.1.2
EOF
```

### 4. Создайте tests.json:
```bash
cat > tests.json << 'EOF'
{
  "tests": [
    {
      "name": "Login with valid credentials",
      "method": "POST",
      "path": "/",
      "body": {
        "action": "login",
        "username": "suser",
        "password": "Wqesad321"
      },
      "expectedStatus": 200,
      "expectedBody": {
        "success": true,
        "token": "string",
        "user_id": 2
      },
      "bodyMatcher": "partial"
    }
  ]
}
EOF
```

### 5. Установите зависимости:
```bash
pip3 install -r requirements.txt
```

### 6. Сгенерируйте bcrypt хеш:
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw('Wqesad321'.encode(), bcrypt.gensalt()).decode())"
```

### 7. Обновите БД (замените [ХЕШ] на хеш из шага 6):
```bash
sudo -u postgres psql -d universal_backend -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"
sudo -u postgres psql -d universal_backend -c "UPDATE users SET password_hash = '[ХЕШ_ИЗ_ШАГА_6]' WHERE username = 'suser';"
sudo -u postgres psql -d universal_backend -c "SELECT id, username, LEFT(password_hash, 30) FROM users WHERE username = 'suser';"
```

### 8. Перезапустите Python Gateway:
```bash
systemctl restart python-gateway
systemctl status python-gateway
```

### 9. Протестируйте функцию:
```bash
curl -X POST http://localhost:8000/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"suser","password":"Wqesad321"}'
```

## Ожидаемые результаты

### Успешный ответ авторизации:
```json
{
  "success": true,
  "token": "случайная_строка_токена",
  "user_id": 2,
  "username": "suser"
}
```

### Список файлов:
```
/var/www/universal-backend/python-gateway/functions/auth/
├── index.py
├── requirements.txt
└── tests.json
```

### Статус сервиса:
```
● python-gateway.service - Python Gateway
   Active: active (running)
```

## Устранение проблем

### Если функция не работает:

1. Проверьте логи:
```bash
journalctl -u python-gateway -n 50 --no-pager
```

2. Проверьте DATABASE_URL в окружении:
```bash
cat /etc/systemd/system/python-gateway.service
```

3. Проверьте права на файлы:
```bash
ls -la /var/www/universal-backend/python-gateway/functions/auth/
```

4. Проверьте установку пакетов:
```bash
pip3 list | grep -E "psycopg2|bcrypt"
```
