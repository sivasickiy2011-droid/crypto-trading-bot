# 🚀 Deploy Auth Function to Server

Деплой функции аутентификации на сервер function.centerai.tech

## 📋 Что будет сделано

1. ✅ Создана папка `/var/www/universal-backend/python-gateway/functions/auth/`
2. ✅ Скопированы файлы: `index.py`, `requirements.txt`, `tests.json`
3. ✅ Установлены зависимости: `psycopg2-binary==2.9.9`, `bcrypt==4.1.2`
4. ✅ Сгенерирован bcrypt хеш для пароля "Wqesad321"
5. ✅ Обновлен пользователь `suser` в базе данных
6. ✅ Перезапущен сервис `python-gateway`

## 🎯 Быстрый старт (рекомендуется)

### Вариант 1: Python скрипт (работает везде)

```bash
# Установка зависимостей
pip install paramiko bcrypt

# Запуск деплоя
python3 deploy_auth.py
```

### Вариант 2: Bash скрипт (нужен sshpass)

```bash
# Установка sshpass (если нужно)
# MacOS: brew install sshpass
# Ubuntu/Debian: sudo apt-get install sshpass
# CentOS/RHEL: sudo yum install sshpass

# Запуск деплоя
chmod +x quick_deploy.sh
./quick_deploy.sh
```

### Вариант 3: Детальный скрипт с проверками

```bash
chmod +x deploy_auth_manual.sh
./deploy_auth_manual.sh
```

## 📝 Ручной деплой (пошагово)

Если автоматические скрипты не работают, используйте команды из файла `DEPLOYMENT_COMMANDS.md`.

## 🔐 Учетные данные

- **Host:** 158.160.162.231
- **User:** root
- **Password:** Xw1Utoce1!?!
- **DB User:** suser
- **DB Password:** Wqesad321 (после деплоя)

## 📁 Файлы для деплоя

### index.py
Основной обработчик с действиями:
- `login` - вход пользователя
- `register` - регистрация нового пользователя
- `set_password` - установка нового пароля
- `verify` - проверка токена
- `logout` - выход пользователя

### requirements.txt
```
psycopg2-binary==2.9.9
bcrypt==4.1.2
```

### tests.json
Тестовые сценарии для функции

## 🧪 Проверка после деплоя

### 1. Проверить файлы на сервере
```bash
sshpass -p 'Xw1Utoce1!?!' ssh root@158.160.162.231 \
  "ls -la /var/www/universal-backend/python-gateway/functions/auth/"
```

Ожидаемый результат:
```
-rw-r--r-- 1 root root 6234 Dec 16 12:00 index.py
-rw-r--r-- 1 root root   42 Dec 16 12:00 requirements.txt
-rw-r--r-- 1 root root  234 Dec 16 12:00 tests.json
```

### 2. Проверить статус сервиса
```bash
sshpass -p 'Xw1Utoce1!?!' ssh root@158.160.162.231 \
  "systemctl status python-gateway"
```

Должно быть: `Active: active (running)`

### 3. Проверить пользователя в БД
```bash
sshpass -p 'Xw1Utoce1!?!' ssh root@158.160.162.231 \
  "sudo -u postgres psql -d universal_backend -c 'SELECT id, username, LEFT(password_hash, 30) FROM users WHERE username = '\''suser'\'';'"
```

### 4. Проверить API
```bash
curl -X POST https://function.centerai.tech/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"suser","password":"Wqesad321"}'
```

Ожидаемый ответ:
```json
{
  "success": true,
  "token": "...",
  "user_id": 1,
  "username": "suser"
}
```

## 🔧 Устранение проблем

### Проблема: sshpass не установлен
**Решение:** Используйте Python скрипт `deploy_auth.py` или установите sshpass

### Проблема: paramiko не установлен
**Решение:** 
```bash
pip install paramiko bcrypt
```

### Проблема: Permission denied
**Решение:** Проверьте пароль и права доступа к серверу

### Проблема: Service failed to restart
**Решение:** Проверьте логи:
```bash
sshpass -p 'Xw1Utoce1!?!' ssh root@158.160.162.231 \
  "journalctl -u python-gateway -n 50"
```

### Проблема: Module not found (bcrypt/psycopg2)
**Решение:** Переустановите зависимости:
```bash
sshpass -p 'Xw1Utoce1!?!' ssh root@158.160.162.231 \
  "cd /var/www/universal-backend/python-gateway/functions/auth && pip3 install -r requirements.txt --force-reinstall"
```

## 📊 Ожидаемые результаты

После успешного деплоя вы получите:

1. **Структура файлов:**
```
/var/www/universal-backend/python-gateway/functions/auth/
├── index.py
├── requirements.txt
└── tests.json
```

2. **Хеш пароля:**
```
$2b$12$[random_hash_here]
```

3. **Запись в БД:**
```
 id | username | hash_preview
----+----------+--------------------------------
  1 | suser    | $2b$12$...
```

4. **Статус сервиса:**
```
● python-gateway.service - Python Gateway Service
   Active: active (running)
```

## 🌐 Endpoint

После деплоя функция будет доступна по адресу:
```
https://function.centerai.tech/auth
```

## 📚 Доступные скрипты

| Скрипт | Описание | Требования |
|--------|----------|------------|
| `deploy_auth.py` | Python скрипт (рекомендуется) | paramiko, bcrypt |
| `quick_deploy.sh` | Быстрый bash деплой | sshpass |
| `deploy_auth_manual.sh` | Детальный деплой с проверками | sshpass |
| `DEPLOYMENT_COMMANDS.md` | Ручные команды | sshpass |

## 💡 Рекомендации

1. Используйте `deploy_auth.py` для максимальной совместимости
2. Проверьте соединение с сервером перед деплоем
3. Сохраните сгенерированный хеш пароля
4. После деплоя протестируйте API endpoint

## ⚠️ Важно

- Пароль пользователя будет изменен на: **Wqesad321**
- Старый пароль перестанет работать
- Токены сессий не хранятся (stateless auth)
- Проверьте firewall и доступность порта на сервере
