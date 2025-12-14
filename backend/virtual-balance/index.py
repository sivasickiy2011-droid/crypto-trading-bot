import json
import os
from typing import Dict, Any
import psycopg2

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_balance(user_id: int) -> Dict[str, Any]:
    """Get user's virtual balance and stats"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = f"""
    SELECT balance, initial_balance, total_pnl, total_trades, winning_trades, losing_trades, created_at
    FROM virtual_balances 
    WHERE user_id = {user_id}
    """
    cur.execute(query)
    
    result = cur.fetchone()
    
    if not result:
        # Create initial balance if doesn't exist
        insert_query = f"INSERT INTO virtual_balances (user_id) VALUES ({user_id}) RETURNING balance, initial_balance, total_pnl, total_trades, winning_trades, losing_trades, created_at"
        cur.execute(insert_query)
        result = cur.fetchone()
        conn.commit()
    
    cur.close()
    conn.close()
    
    balance = float(result[0])
    initial = float(result[1])
    total_pnl = float(result[2])
    total_trades = result[3]
    winning = result[4]
    losing = result[5]
    
    winrate = (winning / total_trades * 100) if total_trades > 0 else 0
    roi = ((balance - initial) / initial * 100) if initial > 0 else 0
    
    return {
        'balance': balance,
        'initial_balance': initial,
        'total_pnl': total_pnl,
        'total_trades': total_trades,
        'winning_trades': winning,
        'losing_trades': losing,
        'winrate': winrate,
        'roi': roi,
        'created_at': result[6].isoformat() if result[6] else None
    }

def update_balance_after_trade(user_id: int, pnl: float, is_win: bool):
    """Update user balance after closing a trade"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    win_col = 'winning_trades' if is_win else 'losing_trades'
    
    query = f"""
    UPDATE virtual_balances 
    SET balance = balance + {pnl},
        total_pnl = total_pnl + {pnl},
        total_trades = total_trades + 1,
        {win_col} = {win_col} + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = {user_id}
    """
    cur.execute(query)
    
    conn.commit()
    cur.close()
    conn.close()

def reset_balance(user_id: int, new_balance: float = 10000.0):
    """Reset user's virtual balance"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = f"""
    UPDATE virtual_balances 
    SET balance = {new_balance},
        initial_balance = {new_balance},
        total_pnl = 0,
        total_trades = 0,
        winning_trades = 0,
        losing_trades = 0,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = {user_id}
    """
    cur.execute(query)
    
    conn.commit()
    cur.close()
    conn.close()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление виртуальным балансом пользователя для симуляции торговли
    Args: event - HTTP запрос с user_id и action (get/reset)
    Returns: Баланс и статистика
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
    
    try:
        if method == 'GET':
            headers = event.get('headers', {})
            user_id = int(headers.get('X-User-Id', headers.get('x-user-id', 2)))
            
            balance_data = get_user_balance(user_id)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'data': balance_data}),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id', 2)
            action = body.get('action', 'get')
            
            if action == 'reset':
                new_balance = float(body.get('balance', 10000.0))
                reset_balance(user_id, new_balance)
                balance_data = get_user_balance(user_id)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Balance reset', 'data': balance_data}),
                    'isBase64Encoded': False
                }
            
            if action == 'get':
                balance_data = get_user_balance(user_id)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'data': balance_data}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Invalid method or action'}),
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
