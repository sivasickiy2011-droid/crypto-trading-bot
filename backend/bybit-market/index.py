import json
import os
import time
import hmac
import hashlib
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from typing import Dict, Any, List

BYBIT_BASE_URL = "https://api.bybit.com"

def generate_signature(params: Dict[str, Any], secret: str) -> str:
    param_str = urlencode(sorted(params.items()))
    return hmac.new(
        secret.encode('utf-8'),
        param_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def bybit_request(endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    api_key = os.environ.get('BYBIT_API_KEY', '')
    api_secret = os.environ.get('BYBIT_API_SECRET', '')
    
    if not params:
        params = {}
    
    params['api_key'] = api_key
    params['timestamp'] = str(int(time.time() * 1000))
    params['sign'] = generate_signature(params, api_secret)
    
    url = f"{BYBIT_BASE_URL}{endpoint}?{urlencode(params)}"
    
    request = Request(url, headers={
        'Content-Type': 'application/json'
    })
    
    with urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode('utf-8'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        action = params.get('action', 'tickers')
        
        try:
            if action == 'tickers':
                symbols = params.get('symbols', 'BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT').split(',')
                
                url = f"{BYBIT_BASE_URL}/v5/market/tickers?category=spot"
                request = Request(url)
                
                with urlopen(request, timeout=10) as response:
                    data = json.loads(response.read().decode('utf-8'))
                
                if data.get('retCode') == 0:
                    tickers = data.get('result', {}).get('list', [])
                    filtered = [
                        {
                            'symbol': t['symbol'],
                            'price': float(t.get('lastPrice', 0)),
                            'change': float(t.get('price24hPcnt', 0)) * 100,
                            'volume': t.get('volume24h', '0'),
                            'high24h': float(t.get('highPrice24h', 0)),
                            'low24h': float(t.get('lowPrice24h', 0))
                        }
                        for t in tickers if t['symbol'] in symbols
                    ]
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'success': True, 'data': filtered}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'kline':
                symbol = params.get('symbol', 'BTCUSDT')
                interval = params.get('interval', '15')
                limit = params.get('limit', '50')
                
                url = f"{BYBIT_BASE_URL}/v5/market/kline?category=spot&symbol={symbol}&interval={interval}&limit={limit}"
                request = Request(url)
                
                with urlopen(request, timeout=10) as response:
                    data = json.loads(response.read().decode('utf-8'))
                
                if data.get('retCode') == 0:
                    klines = data.get('result', {}).get('list', [])
                    formatted = [
                        {
                            'time': k[0],
                            'open': float(k[1]),
                            'high': float(k[2]),
                            'low': float(k[3]),
                            'close': float(k[4]),
                            'volume': float(k[5])
                        }
                        for k in reversed(klines)
                    ]
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'success': True, 'data': formatted}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'balance':
                if not os.environ.get('BYBIT_API_KEY'):
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': False, 
                            'error': 'API keys not configured'
                        }),
                        'isBase64Encoded': False
                    }
                
                result = bybit_request('/v5/account/wallet-balance', {'accountType': 'UNIFIED'})
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True, 'data': result}),
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
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'success': False, 'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
