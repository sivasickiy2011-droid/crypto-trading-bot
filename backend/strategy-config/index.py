import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Сохранение и загрузка настроек стратегий пользователя
    Args: event - словарь с httpMethod, body, headers
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict с конфигурацией или статусом
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
            strategy_name = params.get('strategy')
            
            if strategy_name:
                cursor.execute(
                    "SELECT config_data FROM strategy_configs WHERE user_id = %s AND strategy_name = %s ORDER BY updated_at DESC LIMIT 1",
                    (int(user_id), strategy_name)
                )
            else:
                cursor.execute(
                    "SELECT strategy_name, config_data, updated_at FROM strategy_configs WHERE user_id = %s ORDER BY updated_at DESC",
                    (int(user_id),)
                )
            
            result = cursor.fetchall()
            
            if strategy_name and result:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'config': result[0][0]}),
                    'isBase64Encoded': False
                }
            elif not strategy_name:
                configs = [{'strategy_name': row[0], 'config': row[1], 'updated_at': row[2].isoformat()} for row in result]
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'configs': configs}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Config not found'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            strategy_name = body_data.get('strategy_name')
            config_data = body_data.get('config_data')
            
            if not strategy_name or not config_data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'strategy_name and config_data required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "INSERT INTO strategy_configs (user_id, strategy_name, config_data) VALUES (%s, %s, %s) RETURNING id",
                (int(user_id), strategy_name, json.dumps(config_data))
            )
            config_id = cursor.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'config_id': config_id}),
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
