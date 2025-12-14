import json
import os
from typing import Dict, Any
from urllib.request import Request, urlopen

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Автоматический трейдер: проверяет активные боты и открывает сделки по сигналам
    Запускается по расписанию каждые 15 минут
    Args: event - dict с httpMethod
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
        bot_executor_url = 'https://functions.poehali.dev/e2dd154c-dde5-456b-a4c6-1200070fcc75'
        
        request_data = {
            'auto_mode': True,
            'check_all_users': True
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
                    'message': 'Auto-trading cycle completed',
                    'result': result
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
