import json
import os
import urllib.request
import urllib.parse
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отправка уведомлений в Telegram о входе в позицию
    Args: event - dict с httpMethod, body (symbol, side, market, mode, entryPrice)
          context - object с request_id, function_name и другими атрибутами
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    
    if not bot_token or not chat_id:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Telegram credentials not configured'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    
    symbol: str = body_data.get('symbol', 'UNKNOWN')
    side: str = body_data.get('side', 'LONG')
    market: str = body_data.get('market', 'futures')
    mode: str = body_data.get('mode', 'demo')
    entry_price: float = body_data.get('entryPrice', 0.0)
    
    mode_emoji = '🟢' if mode == 'live' else '🔵'
    side_emoji = '🟢' if side == 'LONG' else '🔴'
    market_text = 'Фьючерсы' if market == 'futures' else 'Спот'
    mode_text = 'Bybit' if mode == 'live' else 'Демо'
    
    message = f"""{mode_emoji} <b>{mode_text} - Вход в позицию</b>

{side_emoji} <b>{side}</b> {symbol.replace('USDT', '/USDT')}
📊 Рынок: {market_text}
💰 Цена входа: ${entry_price:,.2f}

⏰ {context.request_id[:8]}"""
    
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    params = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    data = urllib.parse.urlencode(params).encode('utf-8')
    req = urllib.request.Request(telegram_url, data=data, method='POST')
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'Notification sent'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
