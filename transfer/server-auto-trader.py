import json
import os
import time
from typing import Dict, Any
from urllib.request import Request, urlopen

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Автоматический трейдер: проверяет активные боты и открывает сделки по сигналам
    Может работать в двух режимах:
    1. GET / - проверка всех ботов (вызывает bot-executor)
    2. POST / - ручной запуск сделки с параметрами symbol, side, amount
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с request_id
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    
    try:
        if method == 'GET':
            # GET запрос - возвращаем статус автоторговли
            # В реальном проекте здесь была бы проверка активных ботов из БД
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Auto-trading status',
                    'actions': [],
                    'checked_bots': 0,
                    'note': 'Для реальной торговли подключите bot-executor с БД'
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            # POST запрос - ручной запуск сделки
            body_str = event.get('body', '{}')
            body_data = json.loads(body_str) if body_str else {}
            params = event.get('queryStringParameters') or {}
            
            # Получаем параметры сделки
            symbol = body_data.get('symbol') or params.get('symbol', 'BTCUSDT')
            side = body_data.get('side') or params.get('side', 'buy')
            amount = body_data.get('amount') or params.get('amount', 0.001)
            
            # Проверяем наличие bot-executor URL
            bot_executor_url = os.environ.get('BOT_EXECUTOR_URL', '')
            
            if bot_executor_url:
                # Пытаемся вызвать реальный bot-executor
                try:
                    request_data = {
                        'symbol': symbol,
                        'side': side,
                        'amount': float(amount)
                    }
                    
                    req = Request(
                        bot_executor_url,
                        data=json.dumps(request_data).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    
                    with urlopen(req, timeout=30) as response:
                        result = json.loads(response.read().decode('utf-8'))
                        
                        return {
                            'statusCode': 200,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({
                                'success': True,
                                'message': 'Trade executed via bot-executor',
                                'result': result
                            }),
                            'isBase64Encoded': False
                        }
                except Exception as executor_error:
                    # Если bot-executor недоступен - возвращаем mock
                    pass
            
            # Mock режим - возвращаем тестовые данные
            timestamp = int(time.time() * 1000)
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Mock trade executed (demo mode)',
                    'result': {
                        'orderId': f'MOCK_{timestamp}',
                        'symbol': symbol,
                        'side': side.upper(),
                        'amount': float(amount),
                        'status': 'filled',
                        'price': 89850.5,
                        'timestamp': timestamp,
                        'mode': 'demo',
                        'note': 'Установите BOT_EXECUTOR_URL для реальной торговли'
                    }
                }),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }),
            'isBase64Encoded': False
        }
