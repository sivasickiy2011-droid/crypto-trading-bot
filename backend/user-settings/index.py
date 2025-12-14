import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not found')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление настройками пользователя (графики, сигналы)
    Args: event - dict с httpMethod, headers, body
    Returns: HTTP response с настройками
    '''
    method = event.get('httpMethod', 'GET')
    
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
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    try:
        if method == 'GET':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    SELECT charts_enabled, signals_mode 
                    FROM t_p69937905_crypto_trading_bot.users 
                    WHERE id = %s
                ''', (user_id,))
                
                result = cur.fetchone()
                
                if result:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'settings': {
                                'charts_enabled': result['charts_enabled'],
                                'signals_mode': result['signals_mode']
                            }
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'success': False, 'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            charts_enabled = body.get('charts_enabled')
            signals_mode = body.get('signals_mode')
            
            if charts_enabled is None and signals_mode is None:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': 'No settings provided'}),
                    'isBase64Encoded': False
                }
            
            update_parts = []
            params = []
            
            if charts_enabled is not None:
                update_parts.append('charts_enabled = %s')
                params.append(charts_enabled)
            
            if signals_mode is not None:
                if signals_mode not in ['disabled', 'bots_only', 'top10']:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'success': False, 'error': 'Invalid signals_mode'}),
                        'isBase64Encoded': False
                    }
                update_parts.append('signals_mode = %s')
                params.append(signals_mode)
            
            params.append(user_id)
            
            with conn.cursor() as cur:
                cur.execute(f'''
                    UPDATE t_p69937905_crypto_trading_bot.users 
                    SET {', '.join(update_parts)}
                    WHERE id = %s
                ''', params)
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Settings updated'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()
