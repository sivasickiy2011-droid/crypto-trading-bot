import json
import os
import psycopg2
from typing import Dict, Any
from cryptography.fernet import Fernet
import base64
import hashlib

def get_encryption_key() -> bytes:
    """Generate encryption key from environment variable"""
    secret = os.environ.get('ENCRYPTION_SECRET', 'default-secret-key-change-me')
    key = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(key)

def encrypt_value(value: str) -> str:
    """Encrypt API key or secret"""
    f = Fernet(get_encryption_key())
    return f.encrypt(value.encode()).decode()

def decrypt_value(encrypted_value: str) -> str:
    """Decrypt API key or secret, return as-is if not encrypted"""
    try:
        f = Fernet(get_encryption_key())
        return f.decrypt(encrypted_value.encode()).decode()
    except Exception:
        return encrypted_value

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление API ключами пользователей с шифрованием
    GET: Получить ключи пользователя
    POST: Сохранить/обновить ключи
    DELETE: Удалить ключи
    """
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id_str)
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            exchange = params.get('exchange', 'bybit')
            
            cur.execute(
                "SELECT api_key, api_secret FROM t_p69937905_crypto_trading_bot.user_api_keys WHERE user_id = %s AND exchange = %s",
                (user_id, exchange)
            )
            row = cur.fetchone()
            
            if row:
                decrypted_key = decrypt_value(row[0])
                decrypted_secret = decrypt_value(row[1])
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'api_key': decrypted_key,
                        'api_secret': decrypted_secret
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Keys not found'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            api_key = body_data.get('api_key')
            api_secret = body_data.get('api_secret')
            exchange = body_data.get('exchange', 'bybit')
            
            if not api_key or not api_secret:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'API key and secret required'}),
                    'isBase64Encoded': False
                }
            
            encrypted_key = encrypt_value(api_key)
            encrypted_secret = encrypt_value(api_secret)
            
            cur.execute(
                "SELECT id FROM t_p69937905_crypto_trading_bot.user_api_keys WHERE user_id = %s AND exchange = %s",
                (user_id, exchange)
            )
            existing = cur.fetchone()
            
            if existing:
                cur.execute(
                    "UPDATE t_p69937905_crypto_trading_bot.user_api_keys SET api_key = %s, api_secret = %s, updated_at = NOW() WHERE user_id = %s AND exchange = %s",
                    (encrypted_key, encrypted_secret, user_id, exchange)
                )
            else:
                cur.execute(
                    "INSERT INTO t_p69937905_crypto_trading_bot.user_api_keys (user_id, exchange, api_key, api_secret, created_at, updated_at) VALUES (%s, %s, %s, %s, NOW(), NOW())",
                    (user_id, exchange, encrypted_key, encrypted_secret)
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            exchange = params.get('exchange', 'bybit')
            
            cur.execute(
                "DELETE FROM t_p69937905_crypto_trading_bot.user_api_keys WHERE user_id = %s AND exchange = %s",
                (user_id, exchange)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()