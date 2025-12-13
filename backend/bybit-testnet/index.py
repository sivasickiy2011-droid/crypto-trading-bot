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

BYBIT_TESTNET_BASE_URL = "https://api-testnet.bybit.com"

def get_user_api_keys(user_id: int) -> tuple[str, str]:
    """Get user's Bybit API keys from database"""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    query = f"SELECT api_key, api_secret FROM user_api_keys WHERE user_id = {user_id} AND exchange = 'bybit-testnet'"
    cur.execute(query)
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if not result:
        raise Exception('Testnet API keys not found for user')
    
    api_key = base64.b64decode(result[0]).decode('utf-8')
    api_secret = base64.b64decode(result[1]).decode('utf-8')
    
    return api_key, api_secret

def generate_signature(params: str, secret: str) -> str:
    """Generate HMAC SHA256 signature for Bybit V5 API"""
    return hmac.new(
        secret.encode('utf-8'),
        params.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def bybit_testnet_request(endpoint: str, api_key: str, api_secret: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Make authenticated request to Bybit V5 Testnet API"""
    if not params:
        params = {}
    
    timestamp = str(int(time.time() * 1000))
    recv_window = '5000'
    
    param_str = urlencode(sorted(params.items())) if params else ''
    sign_payload = f"{timestamp}{api_key}{recv_window}{param_str}"
    signature = generate_signature(sign_payload, api_secret)
    
    url = f"{BYBIT_TESTNET_BASE_URL}{endpoint}"
    if param_str:
        url += f"?{param_str}"
    
    headers = {
        'X-BAPI-API-KEY': api_key,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recv_window,
        'Content-Type': 'application/json'
    }
    
    request = Request(url, headers=headers)
    
    with urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode('utf-8'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Bybit Testnet API для безопасного тестирования стратегий
    Args: event - HTTP запрос с X-User-Id и action параметром
    Returns: Данные из Testnet (баланс, позиции, ордера)
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
    user_id_str = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id_str)
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'balance')
    
    try:
        api_key, api_secret = get_user_api_keys(user_id)
        
        if method == 'GET':
            if action == 'balance':
                result = bybit_testnet_request(
                    '/v5/account/wallet-balance',
                    api_key,
                    api_secret,
                    {'accountType': 'UNIFIED'}
                )
                
                if result.get('retCode') == 0:
                    wallet_list = result.get('result', {}).get('list', [])
                    if wallet_list:
                        coins = wallet_list[0].get('coin', [])
                        
                        total_equity = float(wallet_list[0].get('totalEquity', 0))
                        total_wallet_balance = float(wallet_list[0].get('totalWalletBalance', 0))
                        total_available = float(wallet_list[0].get('totalAvailableBalance', 0))
                        
                        usdt_balance = 0
                        for coin in coins:
                            if coin.get('coin') == 'USDT':
                                usdt_balance = float(coin.get('walletBalance', 0))
                                break
                        
                        return {
                            'statusCode': 200,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({
                                'success': True,
                                'data': {
                                    'totalEquity': total_equity,
                                    'totalWalletBalance': total_wallet_balance,
                                    'totalAvailable': total_available,
                                    'usdtBalance': usdt_balance,
                                    'testnet': True
                                }
                            }),
                            'isBase64Encoded': False
                        }
            
            elif action == 'positions':
                result = bybit_testnet_request(
                    '/v5/position/list',
                    api_key,
                    api_secret,
                    {'category': 'linear', 'settleCoin': 'USDT'}
                )
                
                if result.get('retCode') == 0:
                    positions = result.get('result', {}).get('list', [])
                    
                    active_positions = []
                    for pos in positions:
                        size = float(pos.get('size', 0))
                        if size > 0:
                            entry_price = float(pos.get('avgPrice', 0))
                            current_price = float(pos.get('markPrice', 0))
                            unrealized_pnl = float(pos.get('unrealisedPnl', 0))
                            
                            active_positions.append({
                                'symbol': pos.get('symbol', ''),
                                'side': pos.get('side', ''),
                                'size': size,
                                'entryPrice': entry_price,
                                'currentPrice': current_price,
                                'leverage': int(pos.get('leverage', 1)),
                                'unrealizedPnl': unrealized_pnl,
                                'pnlPercent': (unrealized_pnl / (entry_price * size)) * 100 if entry_price > 0 else 0,
                                'testnet': True
                            })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'success': True, 'data': active_positions}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            order_action = body_data.get('action', '')
            
            if order_action == 'place_order':
                symbol = body_data.get('symbol', '')
                side = body_data.get('side', '')
                order_type = body_data.get('orderType', 'Market')
                qty = body_data.get('qty', '0')
                
                order_params = {
                    'category': 'linear',
                    'symbol': symbol,
                    'side': side,
                    'orderType': order_type,
                    'qty': qty
                }
                
                if order_type == 'Limit':
                    order_params['price'] = body_data.get('price', '0')
                
                result = bybit_testnet_request(
                    '/v5/order/create',
                    api_key,
                    api_secret,
                    order_params
                )
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': result.get('retCode') == 0,
                        'data': result.get('result', {}),
                        'testnet': True
                    }),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
