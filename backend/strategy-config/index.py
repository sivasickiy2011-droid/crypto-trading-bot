import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управляет настройками торговых стратегий пользователя
    GET - получить все настройки или конкретную стратегию
    POST - сохранить/обновить настройки стратегии
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'User ID required'}),
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
    
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {})
            strategy_name = query_params.get('strategy') if query_params else None
            
            if strategy_name:
                cursor.execute(
                    'SELECT strategy_name, config_data FROM strategy_configs WHERE user_id = %s AND strategy_name = %s',
                    (int(user_id), strategy_name)
                )
                row = cursor.fetchone()
                if row:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'config': {
                                'strategy_name': row['strategy_name'],
                                'config': row['config_data']
                            }
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Strategy not found'}),
                        'isBase64Encoded': False
                    }
            else:
                cursor.execute(
                    'SELECT strategy_name, config_data FROM strategy_configs WHERE user_id = %s',
                    (int(user_id),)
                )
                rows = cursor.fetchall()
                configs = [{'strategy_name': row['strategy_name'], 'config': row['config_data']} for row in rows]
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'configs': configs}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            strategy_name = body_data.get('strategy_name')
            config_data = body_data.get('config_data')
            
            if not strategy_name or config_data is None:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'strategy_name and config_data required'}),
                    'isBase64Encoded': False
                }
            
            # Check if config exists
            cursor.execute(
                'SELECT id FROM strategy_configs WHERE user_id = %s AND strategy_name = %s',
                (int(user_id), strategy_name)
            )
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute(
                    'UPDATE strategy_configs SET config_data = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s AND strategy_name = %s',
                    (json.dumps(config_data), int(user_id), strategy_name)
                )
            else:
                cursor.execute(
                    'INSERT INTO strategy_configs (user_id, strategy_name, config_data, updated_at) VALUES (%s, %s, %s, CURRENT_TIMESTAMP)',
                    (int(user_id), strategy_name, json.dumps(config_data))
                )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Strategy config saved'}),
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
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()