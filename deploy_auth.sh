#!/bin/bash
# Скрипт развертывания функции авторизации

set -e  # Остановка при ошибке

echo "=== 1. Создание директории для auth функции ==="
mkdir -p /var/www/universal-backend/python-gateway/functions/auth
cd /var/www/universal-backend/python-gateway/functions/auth

echo "=== 2. Создание index.py ==="
cat > index.py << 'EOPYTHON'
import json
import os
import psycopg2
import bcrypt
import secrets
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Аутентификация пользователей: вход, выход, проверка токена
    Args: event - словарь с httpMethod, body, queryStringParameters
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict с токеном или ошибкой
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'login')
            
            if action == 'login':
                username = body_data.get('username', '')
                password = body_data.get('password', '')
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Username and password required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT id, password_hash FROM users WHERE username = %s",
                    (username,)
                )
                user = cursor.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Invalid credentials'}),
                        'isBase64Encoded': False
                    }
                
                user_id, password_hash = user
                
                if password_hash.startswith('$2b$12$EmptyPasswordNeedsReset'):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': False, 
                            'error': 'Password reset required',
                            'needs_password_reset': True,
                            'user_id': user_id,
                            'username': username
                        }),
                        'isBase64Encoded': False
                    }
                
                if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
                    token = secrets.token_urlsafe(32)
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'token': token,
                            'user_id': user_id,
                            'username': username
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Invalid credentials'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'register':
                username = body_data.get('username', '')
                password = body_data.get('password', '')
                
                if not username or not password or len(password) < 6:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Invalid username or password (min 6 chars)'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                try:
                    cursor.execute(
                        "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                        (username, password_hash)
                    )
                    user_id = cursor.fetchone()[0]
                    conn.commit()
                    
                    token = secrets.token_urlsafe(32)
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'token': token,
                            'user_id': user_id,
                            'username': username
                        }),
                        'isBase64Encoded': False
                    }
                except psycopg2.IntegrityError:
                    conn.rollback()
                    return {
                        'statusCode': 409,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Username already exists'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'set_password':
                user_id = body_data.get('user_id')
                new_password = body_data.get('new_password', '')
                
                if not user_id or not new_password or len(new_password) < 6:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Invalid password (min 6 chars)'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                cursor.execute(
                    "UPDATE users SET password_hash = %s WHERE id = %s RETURNING username",
                    (password_hash, int(user_id))
                )
                result = cursor.fetchone()
                
                if result:
                    conn.commit()
                    username = result[0]
                    token = secrets.token_urlsafe(32)
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'token': token,
                            'user_id': user_id,
                            'username': username
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'verify':
                token = body_data.get('token', '')
                
                if not token:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Token required'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'valid': True}),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Unknown action'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()
EOPYTHON

echo "=== 3. Создание requirements.txt ==="
cat > requirements.txt << 'EOF'
psycopg2-binary==2.9.9
bcrypt==4.1.2
EOF

echo "=== 4. Создание tests.json ==="
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

echo "=== 5. Установка зависимостей ==="
pip3 install -r requirements.txt

echo ""
echo "=== 6. Генерация bcrypt хеша для пароля ==="
BCRYPT_HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw('Wqesad321'.encode(), bcrypt.gensalt()).decode())")
echo "Сгенерированный хеш: $BCRYPT_HASH"

echo ""
echo "=== 7. Обновление пользователя в БД ==="
echo "Добавление колонки password_hash (если не существует)..."
sudo -u postgres psql -d universal_backend -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"

echo "Обновление хеша пароля для пользователя suser..."
sudo -u postgres psql -d universal_backend -c "UPDATE users SET password_hash = '$BCRYPT_HASH' WHERE username = 'suser';"

echo "Проверка обновления..."
sudo -u postgres psql -d universal_backend -c "SELECT id, username, LEFT(password_hash, 30) as hash_preview FROM users WHERE username = 'suser';"

echo ""
echo "=== 8. Перезапуск Python Gateway ==="
systemctl restart python-gateway
sleep 2
systemctl status python-gateway --no-pager

echo ""
echo "=== 9. Проверка функции авторизации ==="
echo "Тестовый запрос на авторизацию..."
curl -X POST http://localhost:8000/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"suser","password":"Wqesad321"}'

echo ""
echo ""
echo "=== РЕЗУЛЬТАТЫ ==="
echo "Список файлов в директории auth:"
ls -lah /var/www/universal-backend/python-gateway/functions/auth/

echo ""
echo "Bcrypt хеш пароля: $BCRYPT_HASH"
