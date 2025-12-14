import json
import os
from typing import Dict, Any, List
import psycopg2

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_virtual_trades(user_id: int, status: str = 'all', limit: int = 100) -> List[Dict[str, Any]]:
    """Get user's virtual trades"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    status_filter = f"AND status = '{status}'" if status != 'all' else ""
    
    query = f"""
    SELECT id, symbol, side, quantity, entry_price, leverage, opened_at, 
           closed_at, close_price, pnl, status, bot_id, signal_id
    FROM virtual_trades 
    WHERE user_id = {user_id} {status_filter}
    ORDER BY opened_at DESC
    LIMIT {limit}
    """
    cur.execute(query)
    
    trades = []
    for row in cur.fetchall():
        trade = {
            'id': row[0],
            'symbol': row[1],
            'side': row[2],
            'quantity': float(row[3]),
            'entry_price': float(row[4]),
            'leverage': row[5],
            'opened_at': row[6].isoformat() if row[6] else None,
            'closed_at': row[7].isoformat() if row[7] else None,
            'close_price': float(row[8]) if row[8] else None,
            'pnl': float(row[9]) if row[9] else None,
            'status': row[10],
            'bot_id': row[11],
            'signal_id': row[12],
            'is_demo': True
        }
        trades.append(trade)
    
    cur.close()
    conn.close()
    
    return trades

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Получение истории виртуальных сделок
    Args: event - HTTP запрос с user_id, status (open/closed/all), limit
    Returns: Список виртуальных сделок
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        headers = event.get('headers', {})
        params = event.get('queryStringParameters', {})
        
        user_id = int(headers.get('X-User-Id', headers.get('x-user-id', 2)))
        status = params.get('status', 'all')
        limit = int(params.get('limit', 100))
        
        trades = get_virtual_trades(user_id, status, limit)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'trades': trades, 'count': len(trades)}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
