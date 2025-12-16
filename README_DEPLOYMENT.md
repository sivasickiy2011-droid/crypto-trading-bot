# Развертывание функции авторизации на сервере

## Обзор

Этот пакет содержит все необходимое для развертывания функции авторизации на удаленном сервере.

## Данные для подключения

- **Host:** 158.160.162.231
- **User:** root
- **Password:** Xw1Utoce1!?!

## Структура файлов

```
/
├── deploy_auth.sh           # Полный автоматический скрипт развертывания (запускать на сервере)
├── quick_deploy.sh          # Скрипт для автоматического развертывания с локальной машины
├── verify_deployment.sh     # Скрипт проверки развертывания (запускать на сервере)
├── manual_commands.txt      # Все команды для ручного выполнения
├── DEPLOY_INSTRUCTIONS.md   # Подробная пошаговая инструкция
├── QUICK_REFERENCE.md       # Краткая справка
└── README_DEPLOYMENT.md     # Этот файл
```

## Быстрый старт

### Вариант A: Автоматическое развертывание с локальной машины

```bash
chmod +x quick_deploy.sh
./quick_deploy.sh
```

**Требования:** установлен `sshpass`
- macOS: `brew install hudochenkov/sshpass/sshpass`
- Ubuntu/Debian: `sudo apt-get install sshpass`

### Вариант B: Развертывание на сервере

1. Скопируйте скрипт на сервер:
```bash
scp deploy_auth.sh root@158.160.162.231:/tmp/
```

2. Подключитесь к серверу:
```bash
ssh root@158.160.162.231
# Пароль: Xw1Utoce1!?!
```

3. Запустите скрипт:
```bash
chmod +x /tmp/deploy_auth.sh
/tmp/deploy_auth.sh
```

### Вариант C: Ручное развертывание

Следуйте инструкциям в файлах:
- **DEPLOY_INSTRUCTIONS.md** - подробная инструкция
- **manual_commands.txt** - набор команд для копирования

## Проверка развертывания

### На сервере:

```bash
# Скопировать скрипт проверки
scp verify_deployment.sh root@158.160.162.231:/tmp/

# На сервере запустить
chmod +x /tmp/verify_deployment.sh
/tmp/verify_deployment.sh
```

### Ручная проверка:

```bash
# 1. Список файлов
ls -lah /var/www/universal-backend/python-gateway/functions/auth/

# 2. Статус сервиса
systemctl status python-gateway

# 3. Проверка пользователя в БД
sudo -u postgres psql -d universal_backend -c "SELECT id, username, LEFT(password_hash, 30) FROM users WHERE username = 'suser';"

# 4. Тест авторизации
curl -X POST http://localhost:8000/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"suser","password":"Wqesad321"}'
```

## Ожидаемые результаты

### Список файлов:
```
/var/www/universal-backend/python-gateway/functions/auth/
├── index.py (8-10 KB)
├── requirements.txt (50 bytes)
└── tests.json (300 bytes)
```

### Пользователь в БД:
```
 id | username | hash_preview
----+----------+--------------------------------
  2 | suser    | $2b$12$...
```

### Статус сервиса:
```
● python-gateway.service - Python Gateway
   Active: active (running)
```

### Ответ авторизации:
```json
{
  "success": true,
  "token": "случайная_строка_токена_32_символа",
  "user_id": 2,
  "username": "suser"
}
```

## Что делает развертывание

1. Создает директорию `/var/www/universal-backend/python-gateway/functions/auth/`
2. Создает файлы:
   - `index.py` - обработчик функции авторизации (220 строк)
   - `requirements.txt` - зависимости Python
   - `tests.json` - тестовые сценарии
3. Устанавливает зависимости:
   - `psycopg2-binary==2.9.9` - драйвер PostgreSQL
   - `bcrypt==4.1.2` - хеширование паролей
4. Генерирует bcrypt хеш для пароля "Wqesad321"
5. Обновляет пользователя `suser` в БД с новым хешем
6. Перезапускает сервис `python-gateway`
7. Выполняет тестовый запрос авторизации

## Функции авторизации

Функция поддерживает следующие действия (action):

### 1. Login (вход)
```json
{
  "action": "login",
  "username": "suser",
  "password": "Wqesad321"
}
```

### 2. Register (регистрация)
```json
{
  "action": "register",
  "username": "newuser",
  "password": "password123"
}
```

### 3. Set Password (установка пароля)
```json
{
  "action": "set_password",
  "user_id": 2,
  "new_password": "newpassword123"
}
```

### 4. Verify (проверка токена)
```json
{
  "action": "verify",
  "token": "токен_из_login"
}
```

## Устранение проблем

### Проблема: Сервис не стартует

**Решение:**
```bash
journalctl -u python-gateway -n 100 --no-pager
systemctl restart python-gateway
```

### Проблема: Ошибка импорта модулей

**Решение:**
```bash
cd /var/www/universal-backend/python-gateway/functions/auth
pip3 install -r requirements.txt
systemctl restart python-gateway
```

### Проблема: Ошибка подключения к БД

**Решение:**
```bash
# Проверить DATABASE_URL
systemctl cat python-gateway | grep DATABASE_URL

# Проверить доступность PostgreSQL
sudo -u postgres psql -d universal_backend -c "SELECT version();"
```

### Проблема: 401 Invalid credentials

**Решение:**
```bash
# Проверить хеш в БД
sudo -u postgres psql -d universal_backend -c "SELECT username, password_hash FROM users WHERE username = 'suser';"

# Пересоздать хеш
HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw('Wqesad321'.encode(), bcrypt.gensalt()).decode())")
sudo -u postgres psql -d universal_backend -c "UPDATE users SET password_hash = '$HASH' WHERE username = 'suser';"
```

### Проблема: Порт 8000 не отвечает

**Решение:**
```bash
# Проверить что сервис слушает порт
netstat -tuln | grep 8000
ss -tuln | grep 8000

# Проверить firewall
iptables -L -n | grep 8000
```

## Логи и отладка

### Просмотр логов в реальном времени:
```bash
journalctl -u python-gateway -f
```

### Последние 100 строк логов:
```bash
journalctl -u python-gateway -n 100 --no-pager
```

### Ручной тест функции:
```bash
cd /var/www/universal-backend/python-gateway/functions/auth
export DATABASE_URL="postgresql://user:pass@localhost/universal_backend"
python3 -c "from index import handler; import json; print(json.dumps(handler({'httpMethod': 'POST', 'body': json.dumps({'action': 'login', 'username': 'suser', 'password': 'Wqesad321'})}, None), indent=2))"
```

## Контакты и поддержка

Если возникли проблемы с развертыванием:

1. Проверьте файл **QUICK_REFERENCE.md** для быстрых решений
2. Изучите логи: `journalctl -u python-gateway -n 100`
3. Запустите скрипт проверки: `/tmp/verify_deployment.sh`

## Следующие шаги

После успешного развертывания:

1. Протестируйте все 4 действия (login, register, set_password, verify)
2. Настройте HTTPS для внешнего доступа
3. Настройте мониторинг доступности функции
4. Добавьте дополнительных пользователей при необходимости

## Безопасность

- Пароли хешируются с использованием bcrypt
- Используется salt для каждого пароля
- Токены генерируются криптографически стойким генератором
- CORS настроен для всех источников (настройте при необходимости)

## Версии

- Python: 3.x
- psycopg2-binary: 2.9.9
- bcrypt: 4.1.2
- PostgreSQL: 12+
