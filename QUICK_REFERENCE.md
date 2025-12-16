# Быстрая справка - Развертывание Auth функции

## Способ 1: Автоматический (самый быстрый)

```bash
# На локальном компьютере:
chmod +x deploy_auth.sh quick_deploy.sh

# Если есть sshpass:
./quick_deploy.sh

# Если нет sshpass:
scp deploy_auth.sh root@158.160.162.231:/tmp/
ssh root@158.160.162.231
chmod +x /tmp/deploy_auth.sh && /tmp/deploy_auth.sh
```

## Способ 2: Ручной (пошагово)

### Подключение:
```bash
ssh root@158.160.162.231
# Пароль: Xw1Utoce1!?!
```

### Развертывание (скопируйте всё сразу):
```bash
# Создать директорию
mkdir -p /var/www/universal-backend/python-gateway/functions/auth
cd /var/www/universal-backend/python-gateway/functions/auth

# Скопировать файлы (index.py, requirements.txt, tests.json)
# См. manual_commands.txt для полного кода

# Установить зависимости
pip3 install psycopg2-binary==2.9.9 bcrypt==4.1.2

# Сгенерировать хеш и обновить БД
HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw('Wqesad321'.encode(), bcrypt.gensalt()).decode())")
sudo -u postgres psql -d universal_backend -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"
sudo -u postgres psql -d universal_backend -c "UPDATE users SET password_hash = '$HASH' WHERE username = 'suser';"

# Перезапустить сервис
systemctl restart python-gateway

# Тест
curl -X POST http://localhost:8000/auth -H "Content-Type: application/json" -d '{"action":"login","username":"suser","password":"Wqesad321"}'
```

## Проверка результатов

```bash
# Список файлов
ls -lah /var/www/universal-backend/python-gateway/functions/auth/

# Пользователь в БД
sudo -u postgres psql -d universal_backend -c "SELECT id, username, LEFT(password_hash, 30) FROM users WHERE username = 'suser';"

# Статус сервиса
systemctl status python-gateway

# Логи (если есть ошибки)
journalctl -u python-gateway -n 50
```

## Ожидаемый результат curl:

```json
{
  "success": true,
  "token": "случайная_строка_токена_32_символа",
  "user_id": 2,
  "username": "suser"
}
```

## Файлы проекта

- **deploy_auth.sh** - Полный автоматический скрипт развертывания
- **quick_deploy.sh** - Скрипт для запуска через SSH с локальной машины
- **manual_commands.txt** - Все команды для ручного выполнения
- **DEPLOY_INSTRUCTIONS.md** - Подробная инструкция

## Устранение проблем

| Проблема | Решение |
|----------|---------|
| Сервис не стартует | `journalctl -u python-gateway -n 100` |
| Ошибка импорта | `pip3 install -r requirements.txt` |
| Ошибка БД | Проверить DATABASE_URL в сервисе |
| 401 Invalid credentials | Проверить хеш в БД |

## Тестовые учетные данные

- **Username:** suser
- **Password:** Wqesad321
- **Expected user_id:** 2

## Endpoints

- **Local:** http://localhost:8000/auth
- **Public:** https://function.centerai.tech/auth (после развертывания)

## Actions

- **login** - Вход пользователя
- **register** - Регистрация нового пользователя
- **set_password** - Установка нового пароля
- **verify** - Проверка токена
