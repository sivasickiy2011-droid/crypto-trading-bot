import json
import os
import time
from urllib.request import Request, urlopen
from typing import Dict, Any
import psycopg2

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_current_price(symbol: str) -> float:
    """Get current market price from Bybit"""
    url = f"https://api.bybit.com/v5/market/tickers?category=linear&symbol={symbol}"
    request = Request(url)
    with urlopen(request, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        if data.get('retCode') == 0:
            tickers = data.get('result', {}).get('list', [])
            if tickers:
                return float(tickers[0]['lastPrice'])
    return 0.0

def get_open_position(user_id: int, symbol: str) -> Dict[str, Any] | None:
    """Get user's open virtual position"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = f"SELECT id, side, quantity, entry_price, leverage, opened_at FROM virtual_trades WHERE user_id = {user_id} AND symbol = '{symbol}' AND status = 'open' ORDER BY opened_at DESC LIMIT 1"
    cur.execute(query)
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if result:
        return {
            'id': result[0],
            'side': result[1],
            'quantity': float(result[2]),
            'entry_price': float(result[3]),
            'leverage': result[4],
            'opened_at': result[5]
        }
    return None

def open_virtual_position(user_id: int, symbol: str, side: str, quantity: float, price: float, leverage: int) -> int:
    """Open new virtual position"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = f"INSERT INTO virtual_trades (user_id, symbol, side, quantity, entry_price, leverage, status) VALUES ({user_id}, '{symbol}', '{side}', {quantity}, {price}, {leverage}, 'open') RETURNING id"
    cur.execute(query)
    
    trade_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return trade_id

def close_virtual_position(trade_id: int, close_price: float, user_id: int) -> float:
    """Close virtual position and calculate PnL"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get position details
    query = f"SELECT side, quantity, entry_price, leverage FROM virtual_trades WHERE id = {trade_id}"
    cur.execute(query)
    result = cur.fetchone()
    
    side = result[0]
    quantity = float(result[1])
    entry_price = float(result[2])
    leverage = result[3]
    
    # Calculate PnL
    if side == 'Buy':
        pnl = (close_price - entry_price) * quantity * leverage
    else:
        pnl = (entry_price - close_price) * quantity * leverage
    
    # Update position
    update_query = f"UPDATE virtual_trades SET status = 'closed', closed_at = CURRENT_TIMESTAMP, close_price = {close_price}, pnl = {pnl} WHERE id = {trade_id}"
    cur.execute(update_query)
    
    # Update user balance
    is_win = pnl > 0
    win_col = 'winning_trades' if is_win else 'losing_trades'
    
    balance_query = f"""
    UPDATE virtual_balances 
    SET balance = balance + {pnl},
        total_pnl = total_pnl + {pnl},
        total_trades = total_trades + 1,
        {win_col} = {win_col} + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = {user_id}
    """
    cur.execute(balance_query)
    
    conn.commit()
    cur.close()
    conn.close()
    
    return pnl

def send_telegram(message: str):
    """Send Telegram notification"""
    try:
        url = 'https://functions.poehali.dev/3e081d1f-2d3b-429a-8490-942983a3d17d'
        data = json.dumps({'message': message}).encode('utf-8')
        request = Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        with urlopen(request, timeout=5) as response:
            response.read()
    except Exception as e:
        print(f'Telegram error: {e}')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Виртуальный симулятор торговли (без реальных денег)
    Открывает/закрывает виртуальные позиции по SOL/USDT с реальными ценами рынка
    Args: event - HTTP запрос с user_id и action (open/close/status)
    Returns: Отчет о виртуальной сделке с балансом и PnL
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id', 2)
        action = body.get('action', 'status')
        symbol = 'SOLUSDT'
        
        steps = []
        
        # Get current market price
        current_price = get_current_price(symbol)
        if current_price == 0:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Failed to get market price'}),
                'isBase64Encoded': False
            }
        
        steps.append(f'📊 Текущая цена SOL: ${current_price:.2f}')
        
        # Get open position
        position = get_open_position(user_id, symbol)
        
        if action == 'status' or action == 'diagnose':
            steps.append('🔧 Режим: Виртуальный симулятор (без реальных денег)')
            steps.append(f'🌐 Цены с рынка: Bybit API (реальные)')
            
            if position:
                entry_price = position['entry_price']
                quantity = position['quantity']
                leverage = position['leverage']
                
                if position['side'] == 'Buy':
                    unrealized_pnl = (current_price - entry_price) * quantity * leverage
                else:
                    unrealized_pnl = (entry_price - current_price) * quantity * leverage
                
                pnl_percent = (unrealized_pnl / (entry_price * quantity)) * 100
                
                steps.append(f'📍 Открытая позиция: {position["side"]} {quantity} SOL')
                steps.append(f'💰 Цена входа: ${entry_price:.2f}')
                steps.append(f'📈 Плечо: {leverage}x')
                steps.append(f'💵 Текущий PnL: {unrealized_pnl:.2f} USDT ({pnl_percent:+.2f}%)')
            else:
                steps.append('⚪ Нет открытых позиций')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'steps': steps}),
                'isBase64Encoded': False
            }
        
        if action == 'open':
            if position:
                steps.append(f'⚠️ Позиция уже открыта: {position["side"]} {position["quantity"]} SOL')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'steps': steps, 'message': 'Position already exists'}),
                    'isBase64Encoded': False
                }
            
            # Open new position
            quantity = 0.1
            leverage = 10
            trade_id = open_virtual_position(user_id, symbol, 'Buy', quantity, current_price, leverage)
            
            steps.append(f'✅ Открыта виртуальная позиция #{trade_id}')
            steps.append(f'📈 Направление: LONG (Buy)')
            steps.append(f'📦 Объем: {quantity} SOL')
            steps.append(f'💰 Цена входа: ${current_price:.2f}')
            steps.append(f'⚡ Плечо: {leverage}x')
            steps.append(f'💵 Размер контракта: ${quantity * current_price * leverage:.2f}')
            
            send_telegram(f'🎮 ВИРТУАЛЬНАЯ СДЕЛКА\n\nОткрыта: LONG\nПара: SOL/USDT\nОбъем: {quantity} SOL\nЦена: ${current_price:.2f}\nПлечо: {leverage}x\n\n⚠️ Это симулятор (не реальные деньги)')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'steps': steps}),
                'isBase64Encoded': False
            }
        
        if action == 'close':
            if not position:
                steps.append('⚠️ Нет открытой позиции для закрытия')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'steps': steps, 'message': 'No position to close'}),
                    'isBase64Encoded': False
                }
            
            # Close position
            pnl = close_virtual_position(position['id'], current_price, user_id)
            pnl_percent = (pnl / (position['entry_price'] * position['quantity'])) * 100
            
            steps.append(f'✅ Закрыта виртуальная позиция #{position["id"]}')
            steps.append(f'📉 Цена выхода: ${current_price:.2f}')
            steps.append(f'💵 PnL: {pnl:+.2f} USDT ({pnl_percent:+.2f}%)')
            
            emoji = '🟢' if pnl > 0 else '🔴'
            send_telegram(f'{emoji} ВИРТУАЛЬНАЯ СДЕЛКА ЗАКРЫТА\n\nПара: SOL/USDT\nВход: ${position["entry_price"]:.2f}\nВыход: ${current_price:.2f}\nPnL: {pnl:+.2f} USDT ({pnl_percent:+.2f}%)\n\n⚠️ Это симулятор (не реальные деньги)')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'steps': steps}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Invalid action'}),
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