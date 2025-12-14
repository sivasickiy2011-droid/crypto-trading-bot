import json
import os
import time
import hmac
import hashlib
import base64
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from typing import Dict, Any
import psycopg2

BYBIT_API_URL = "https://api.bybit.com"

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_api_keys(user_id: int) -> tuple[str, str]:
    """Get user's Bybit API keys (for demo account)"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = f"SELECT api_key, api_secret FROM user_api_keys WHERE user_id = {user_id} AND exchange = 'bybit'"
    cur.execute(query)
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if not result:
        raise Exception(f'Bybit API keys not found for user {user_id}')
    
    api_key = base64.b64decode(result[0]).decode('utf-8')
    api_secret = base64.b64decode(result[1]).decode('utf-8')
    
    print(f'API key length: {len(api_key)}, starts with: {api_key[:5]}...')
    print(f'API secret length: {len(api_secret)}, starts with: {api_secret[:5]}...')
    
    return api_key, api_secret

def generate_signature(params: str, secret: str) -> str:
    """Generate HMAC SHA256 signature for Bybit V5 API"""
    return hmac.new(
        secret.encode('utf-8'),
        params.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def bybit_request(endpoint: str, api_key: str, api_secret: str, params: Dict[str, Any] = None, method: str = 'GET') -> Dict[str, Any]:
    """Make authenticated request to Bybit V5 API (demo account)"""
    if not params:
        params = {}
    
    timestamp = str(int(time.time() * 1000))
    recv_window = '5000'
    
    if method == 'GET':
        param_str = urlencode(sorted(params.items())) if params else ''
        sign_payload = f"{timestamp}{api_key}{recv_window}{param_str}"
    else:
        param_str = json.dumps(params) if params else ''
        sign_payload = f"{timestamp}{api_key}{recv_window}{param_str}"
    
    signature = generate_signature(sign_payload, api_secret)
    
    url = f"{BYBIT_API_URL}{endpoint}"
    if method == 'GET' and param_str:
        url += f"?{param_str}"
    
    headers = {
        'X-BAPI-API-KEY': api_key,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recv_window,
        'Content-Type': 'application/json'
    }
    
    data = None
    if method == 'POST' and param_str:
        data = param_str.encode('utf-8')
    
    request = Request(url, data=data, headers=headers, method=method)
    
    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f'Bybit API error: {str(e)}')
        print(f'Request URL: {url}')
        print(f'Request headers: {headers}')
        raise

def get_current_price(symbol: str) -> float:
    """Get current market price"""
    url = f"https://api.bybit.com/v5/market/tickers"
    params = {'category': 'linear', 'symbol': symbol}
    full_url = f"{url}?{urlencode(params)}"
    
    request = Request(full_url)
    with urlopen(request, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        if data.get('retCode') == 0:
            tickers = data.get('result', {}).get('list', [])
            if tickers:
                return float(tickers[0]['lastPrice'])
    return 0.0

def get_wallet_balance(api_key: str, api_secret: str) -> Dict[str, Any]:
    """Get wallet balance"""
    result = bybit_request(
        '/v5/account/wallet-balance',
        api_key,
        api_secret,
        {'accountType': 'UNIFIED'},
        'GET'
    )
    return result

def get_current_position(api_key: str, api_secret: str, symbol: str) -> Dict[str, Any] | None:
    """Get current position for symbol"""
    result = bybit_request(
        '/v5/position/list',
        api_key,
        api_secret,
        {'category': 'linear', 'symbol': symbol},
        'GET'
    )
    
    if result.get('retCode') == 0:
        positions = result.get('result', {}).get('list', [])
        for pos in positions:
            size = float(pos.get('size', 0))
            if size > 0:
                return {
                    'side': pos.get('side', ''),
                    'size': size,
                    'entryPrice': float(pos.get('avgPrice', 0)),
                    'unrealizedPnl': float(pos.get('unrealisedPnl', 0)),
                    'leverage': pos.get('leverage', '1')
                }
    return None

def place_order(api_key: str, api_secret: str, symbol: str, side: str, qty: float) -> Dict[str, Any]:
    """Place market order"""
    params = {
        'category': 'linear',
        'symbol': symbol,
        'side': side,
        'orderType': 'Market',
        'qty': str(qty),
        'timeInForce': 'GTC'
    }
    
    result = bybit_request('/v5/order/create', api_key, api_secret, params, 'POST')
    return result

def close_position(api_key: str, api_secret: str, symbol: str, side: str, qty: float) -> Dict[str, Any]:
    """Close position"""
    close_side = 'Sell' if side == 'Buy' else 'Buy'
    return place_order(api_key, api_secret, symbol, close_side, qty)

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
    Тестовая торговля на демо-счете Bybit (виртуальные деньги)
    Открывает/закрывает позицию по SOL/USDT на демо-счете
    Args: event - HTTP запрос с user_id и action (open/close/status)
    Returns: Отчет о тестовой сделке с балансом и PnL
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
        action = body.get('action', 'open')
        symbol = 'SOLUSDT'
        
        api_key, api_secret = get_user_api_keys(user_id)
        
        steps = []
        
        # Шаг 1: Проверяем баланс
        balance_data = get_wallet_balance(api_key, api_secret)
        print(f'Balance API response: {balance_data}')
        
        if balance_data.get('retCode') == 0:
            coins = balance_data.get('result', {}).get('list', [{}])[0].get('coin', [])
            usdt_balance = 0
            for coin in coins:
                if coin.get('coin') == 'USDT':
                    usdt_balance = float(coin.get('walletBalance', 0))
                    break
            steps.append(f'💰 Баланс: {usdt_balance:.2f} USDT')
        else:
            error_msg = balance_data.get('retMsg', 'Failed to get balance')
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': f'Bybit API error: {error_msg}', 'details': balance_data}),
                'isBase64Encoded': False
            }
        
        # Шаг 2: Проверяем текущую позицию
        position = get_current_position(api_key, api_secret, symbol)
        
        if action == 'open':
            if position:
                steps.append(f'⚠️ Позиция уже открыта: {position["side"]} {position["size"]} SOL')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'steps': steps, 'message': 'Position already exists'}),
                    'isBase64Encoded': False
                }
            
            # Открываем позицию
            current_price = get_current_price(symbol)
            steps.append(f'📊 Текущая цена SOL: ${current_price:.2f}')
            
            qty = 0.1
            order_result = place_order(api_key, api_secret, symbol, 'Buy', qty)
            
            if order_result.get('retCode') == 0:
                steps.append(f'✅ Открыта позиция: BUY {qty} SOL')
                send_telegram(f'🧪 ТЕСТ ОТКРЫТИЕ\n\nПара: SOL/USDT\nНаправление: LONG\nОбъем: {qty} SOL\nЦена: ${current_price:.2f}\n\nРежим: Testnet Demo')
            else:
                error_msg = order_result.get('retMsg', 'Unknown error')
                steps.append(f'❌ Ошибка открытия: {error_msg}')
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'steps': steps, 'error': error_msg}),
                    'isBase64Encoded': False
                }
        
        elif action == 'close':
            if not position:
                steps.append('⚠️ Нет открытой позиции для закрытия')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'steps': steps, 'message': 'No position to close'}),
                    'isBase64Encoded': False
                }
            
            # Закрываем позицию
            pnl = position['unrealizedPnl']
            close_result = close_position(api_key, api_secret, symbol, position['side'], position['size'])
            
            if close_result.get('retCode') == 0:
                steps.append(f'✅ Закрыта позиция: {position["side"]} {position["size"]} SOL')
                steps.append(f'💵 PnL: {pnl:.2f} USDT')
                send_telegram(f'🧪 ТЕСТ ЗАКРЫТИЕ\n\nПара: SOL/USDT\nPnL: {pnl:.2f} USDT\n\nРежим: Testnet Demo')
            else:
                error_msg = close_result.get('retMsg', 'Unknown error')
                steps.append(f'❌ Ошибка закрытия: {error_msg}')
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'steps': steps, 'error': error_msg}),
                    'isBase64Encoded': False
                }
        
        elif action == 'status':
            if position:
                steps.append(f'📍 Открыта позиция:')
                steps.append(f'  - Направление: {position["side"]}')
                steps.append(f'  - Объем: {position["size"]} SOL')
                steps.append(f'  - Цена входа: ${position["entryPrice"]:.2f}')
                steps.append(f'  - PnL: {position["unrealizedPnl"]:.2f} USDT')
            else:
                steps.append('✅ Нет открытых позиций')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'steps': steps}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }