import json
import os
import urllib.request
import urllib.parse
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отправка уведомлений в Telegram о сигналах, входе/выходе из позиций
    Args: event - dict с httpMethod, body (type, symbol, side, price, signal, strength, reason, pnl, pnlPercent)
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
    
    notification_type: str = body_data.get('type', 'position_entry')
    symbol: str = body_data.get('symbol', 'UNKNOWN')
    mode: str = body_data.get('mode', 'demo')
    
    mode_emoji = '🟢' if mode == 'live' else '🔵'
    mode_text = 'Bybit' if mode == 'live' else 'Демо'
    symbol_display = symbol.replace('USDT', '/USDT')
    
    if notification_type == 'signal':
        signal: str = body_data.get('signal', 'neutral')
        strength: int = body_data.get('strength', 50)
        reason: str = body_data.get('reason', '')
        strategy: str = body_data.get('strategy', 'Стратегия')
        
        signal_emoji = '🟢' if signal == 'buy' else '🔴' if signal == 'sell' else '⚪'
        signal_text = 'ПОКУПАТЬ' if signal == 'buy' else 'ПРОДАВАТЬ' if signal == 'sell' else 'НЕЙТРАЛЬНО'
        
        message = f"""📊 <b>{mode_text} - Сигнал от стратегии</b>

{signal_emoji} <b>{signal_text}</b> {symbol_display}
🎯 Стратегия: {strategy}
💪 Сила сигнала: {strength}%
📝 Причина: {reason}

⏰ {context.request_id[:8]}"""
    
    elif notification_type == 'position_entry':
        side: str = body_data.get('side', 'LONG')
        entry_price: float = body_data.get('entryPrice', 0.0)
        size: float = body_data.get('size', 0.0)
        leverage: int = body_data.get('leverage', 1)
        market: str = body_data.get('market', 'futures')
        
        side_emoji = '🟢' if side == 'LONG' else '🔴'
        market_text = 'Фьючерсы' if market == 'futures' else 'Спот'
        
        message = f"""{mode_emoji} <b>{mode_text} - Вход в позицию</b>

{side_emoji} <b>{side}</b> {symbol_display}
📊 Рынок: {market_text}
💰 Цена входа: ${entry_price:,.2f}
📦 Размер: {size}
⚡ Плечо: {leverage}x

⏰ {context.request_id[:8]}"""
    
    elif notification_type == 'position_exit':
        side: str = body_data.get('side', 'LONG')
        entry_price: float = body_data.get('entryPrice', 0.0)
        exit_price: float = body_data.get('exitPrice', 0.0)
        pnl: float = body_data.get('pnl', 0.0)
        pnl_percent: float = body_data.get('pnlPercent', 0.0)
        reason: str = body_data.get('reason', 'Закрытие')
        
        side_emoji = '🟢' if side == 'LONG' else '🔴'
        pnl_emoji = '💰' if pnl >= 0 else '📉'
        pnl_sign = '+' if pnl >= 0 else ''
        
        message = f"""{mode_emoji} <b>{mode_text} - Выход из позиции</b>

{side_emoji} <b>{side}</b> {symbol_display}
📊 Причина: {reason}
💵 Цена входа: ${entry_price:,.2f}
💵 Цена выхода: ${exit_price:,.2f}
{pnl_emoji} PnL: {pnl_sign}${pnl:,.2f} ({pnl_sign}{pnl_percent:.2f}%)

⏰ {context.request_id[:8]}"""
    
    else:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid notification type'}),
            'isBase64Encoded': False
        }
    
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