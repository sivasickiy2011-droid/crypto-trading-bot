import json
import os
import psycopg2
from typing import Dict, Any, Optional

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление ботами пользователя: получение, создание, обновление, удаление
    Args: event - dict с httpMethod, queryStringParameters, body
          context - object с request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    user_id_str = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id_str)
    
    try:
        if method == 'GET':
            return get_bots(user_id)
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return create_bot(user_id, body_data)
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            return update_bot(user_id, body_data)
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            bot_id = params.get('bot_id')
            if not bot_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'bot_id required'}),
                    'isBase64Encoded': False
                }
            return delete_bot(user_id, bot_id)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def get_bots(user_id: int) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT bot_id, pair, market, strategy, active, entry_signal FROM t_p69937905_crypto_trading_bot.bots WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            rows = cur.fetchall()
            
            bots = []
            for row in rows:
                bots.append({
                    'id': row[0],
                    'pair': row[1],
                    'market': row[2],
                    'strategy': row[3],
                    'active': row[4],
                    'entrySignal': row[5],
                    'status': 'searching' if row[4] else 'stopped'
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'data': bots}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()

def create_bot(user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        bot_id = data.get('bot_id')
        pair = data.get('pair')
        market = data.get('market')
        strategy = data.get('strategy')
        active = data.get('active', True)
        entry_signal = data.get('entrySignal')
        
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO t_p69937905_crypto_trading_bot.bots 
                (user_id, bot_id, pair, market, strategy, active, entry_signal)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, bot_id) DO UPDATE 
                SET pair = EXCLUDED.pair, 
                    market = EXCLUDED.market, 
                    strategy = EXCLUDED.strategy, 
                    active = EXCLUDED.active,
                    entry_signal = EXCLUDED.entry_signal,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (user_id, bot_id, pair, market, strategy, active, entry_signal)
            )
            conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()

def update_bot(user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        bot_id = data.get('bot_id')
        active = data.get('active')
        
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE t_p69937905_crypto_trading_bot.bots 
                SET active = %s, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s AND bot_id = %s
                """,
                (active, user_id, bot_id)
            )
            conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()

def delete_bot(user_id: int, bot_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM t_p69937905_crypto_trading_bot.bots WHERE user_id = %s AND bot_id = %s",
                (user_id, bot_id)
            )
            conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()
