#!/bin/bash
# Скрипт проверки развертывания функции авторизации

set -e

echo "========================================="
echo "Проверка развертывания Auth функции"
echo "========================================="
echo ""

DIR="/var/www/universal-backend/python-gateway/functions/auth"

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Проверка директории
echo "1. Проверка директории..."
if [ -d "$DIR" ]; then
    check_pass "Директория $DIR существует"
else
    check_fail "Директория $DIR не найдена"
    exit 1
fi
echo ""

# 2. Проверка файлов
echo "2. Проверка файлов..."
FILES=("index.py" "requirements.txt" "tests.json")
for file in "${FILES[@]}"; do
    if [ -f "$DIR/$file" ]; then
        SIZE=$(stat -f%z "$DIR/$file" 2>/dev/null || stat -c%s "$DIR/$file" 2>/dev/null)
        check_pass "$file найден (размер: $SIZE байт)"
    else
        check_fail "$file не найден"
    fi
done
echo ""

# 3. Проверка зависимостей Python
echo "3. Проверка зависимостей Python..."
if pip3 list | grep -q psycopg2-binary; then
    VERSION=$(pip3 list | grep psycopg2-binary | awk '{print $2}')
    check_pass "psycopg2-binary установлен (версия: $VERSION)"
else
    check_fail "psycopg2-binary не установлен"
fi

if pip3 list | grep -q bcrypt; then
    VERSION=$(pip3 list | grep bcrypt | awk '{print $2}')
    check_pass "bcrypt установлен (версия: $VERSION)"
else
    check_fail "bcrypt не установлен"
fi
echo ""

# 4. Проверка базы данных
echo "4. Проверка базы данных..."
if sudo -u postgres psql -d universal_backend -c "\dt users" > /dev/null 2>&1; then
    check_pass "Таблица users существует"
    
    # Проверка колонки password_hash
    if sudo -u postgres psql -d universal_backend -c "\d users" | grep -q password_hash; then
        check_pass "Колонка password_hash существует"
        
        # Проверка пользователя suser
        RESULT=$(sudo -u postgres psql -d universal_backend -t -c "SELECT id, username FROM users WHERE username = 'suser';")
        if [ -n "$RESULT" ]; then
            check_pass "Пользователь suser найден"
            echo "   $RESULT"
            
            # Проверка хеша
            HASH=$(sudo -u postgres psql -d universal_backend -t -c "SELECT password_hash FROM users WHERE username = 'suser';" | xargs)
            if [ -n "$HASH" ] && [[ "$HASH" == \$2b\$* ]]; then
                check_pass "Bcrypt хеш установлен (начало: ${HASH:0:15}...)"
            else
                check_fail "Bcrypt хеш не установлен или некорректен"
            fi
        else
            check_fail "Пользователь suser не найден"
        fi
    else
        check_fail "Колонка password_hash не существует"
    fi
else
    check_fail "Таблица users не найдена или нет доступа к БД"
fi
echo ""

# 5. Проверка сервиса Python Gateway
echo "5. Проверка сервиса Python Gateway..."
if systemctl is-active --quiet python-gateway; then
    check_pass "Сервис python-gateway активен"
    
    # Показать статус
    UPTIME=$(systemctl show python-gateway -p ActiveEnterTimestamp --value)
    echo "   Запущен: $UPTIME"
else
    check_fail "Сервис python-gateway не активен"
    check_warn "Запустите: systemctl start python-gateway"
fi
echo ""

# 6. Проверка переменной окружения DATABASE_URL
echo "6. Проверка конфигурации сервиса..."
if systemctl show python-gateway -p Environment | grep -q DATABASE_URL; then
    check_pass "DATABASE_URL настроен"
else
    check_warn "DATABASE_URL может быть не настроен"
fi
echo ""

# 7. Тест функции авторизации
echo "7. Тест функции авторизации..."
RESPONSE=$(curl -s -X POST http://localhost:8000/auth \
    -H "Content-Type: application/json" \
    -d '{"action":"login","username":"suser","password":"Wqesad321"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
    check_pass "Тест авторизации PASSED"
    echo "   Ответ: $RESPONSE"
else
    check_fail "Тест авторизации FAILED"
    echo "   Ответ: $RESPONSE"
    
    # Показать последние логи
    echo ""
    echo "Последние логи python-gateway:"
    journalctl -u python-gateway -n 10 --no-pager
fi
echo ""

# 8. Проверка портов
echo "8. Проверка портов..."
if netstat -tuln | grep -q ':8000'; then
    check_pass "Порт 8000 прослушивается"
else
    check_warn "Порт 8000 не прослушивается"
fi
echo ""

# Итоги
echo "========================================="
echo "Проверка завершена!"
echo "========================================="
echo ""
echo "Для просмотра логов используйте:"
echo "  journalctl -u python-gateway -f"
echo ""
echo "Для ручного теста:"
echo "  curl -X POST http://localhost:8000/auth -H 'Content-Type: application/json' -d '{\"action\":\"login\",\"username\":\"suser\",\"password\":\"Wqesad321\"}'"
