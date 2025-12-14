import json
from urllib.request import Request, urlopen
from typing import Dict, Any

BOT_EXECUTOR_URL = 'https://functions.poehali.dev/e2dd154c-dde5-456b-a4c6-1200070fcc75'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Планировщик для запуска bot-executor каждые 5 минут через Yandex Cloud Functions Triggers
    Args: event - триггер от планировщика (пустой)
    Returns: Результат запуска bot-executor
    '''
    try:
        request = Request(BOT_EXECUTOR_URL, method='GET')
        
        with urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Bot executor triggered successfully',
                    'result': result
                }),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': f'Failed to trigger bot executor: {str(e)}'
            }),
            'isBase64Encoded': False
        }