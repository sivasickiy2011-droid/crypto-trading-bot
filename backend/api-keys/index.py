import json
import os
import psycopg2
from typing import Dict, Any
import base64

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление API ключами пользователя (сохранение, получение, удаление)
    Args: event - словарь с httpMethod, body, headers
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict со статусом операции
    '''
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
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Authentication required'}),
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
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            exchange = params.get('exchange', 'bybit')
            
            cursor.execute(
                f"SELECT api_key, api_secret FROM user_api_keys WHERE user_id = {int(user_id)} AND exchange = '{exchange}'"
            )
            result = cursor.fetchone()
            
            if result:
                api_key, api_secret = result
                api_key_decoded = base64.b64decode(api_key).decode('utf-8')
                api_secret_decoded = base64.b64decode(api_secret).decode('utf-8')
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True, 
                        'api_key': api_key_decoded,
                        'api_secret': api_secret_decoded,
                        'exchange': exchange
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'API keys not found'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            exchange = body_data.get('exchange', 'bybit')
            api_key = body_data.get('api_key', '')
            api_secret = body_data.get('api_secret', '')
            
            if not api_key or not api_secret:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'api_key and api_secret required'}),
                    'isBase64Encoded': False
                }
            
            api_key_encoded = base64.b64encode(api_key.encode('utf-8')).decode('utf-8')
            api_secret_encoded = base64.b64encode(api_secret.encode('utf-8')).decode('utf-8')
            
            cursor.execute(
                f"""
                INSERT INTO user_api_keys (user_id, exchange, api_key, api_secret) 
                VALUES ({int(user_id)}, '{exchange}', '{api_key_encoded}', '{api_secret_encoded}')
                ON CONFLICT (user_id, exchange) 
                DO UPDATE SET api_key = EXCLUDED.api_key, api_secret = EXCLUDED.api_secret, updated_at = CURRENT_TIMESTAMP
                RETURNING id
                """
            )
            key_id = cursor.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'key_id': key_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            exchange = params.get('exchange', 'bybit')
            
            cursor.execute(
                f"DELETE FROM user_api_keys WHERE user_id = {int(user_id)} AND exchange = '{exchange}' RETURNING id"
            )
            result = cursor.fetchone()
            
            if result:
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'API keys not found'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()