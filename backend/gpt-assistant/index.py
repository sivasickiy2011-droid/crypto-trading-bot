import json
import os
from urllib.request import Request, urlopen
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    AI ассистент для анализа торговых стратегий через GPT-4
    Мониторит стратегии 24/7 и предлагает оптимизации
    Args: event - POST запрос с message и context
    Returns: Ответ от GPT-4 с рекомендациями
    '''
    method: str = event.get('httpMethod', 'POST')
    
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        context_data = body.get('context', {})
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'success': False, 'error': 'Message is required'}),
                'isBase64Encoded': False
            }
        
        # Формируем контекст для GPT
        system_prompt = """Ты - эксперт по криптотрейдингу и торговым стратегиям. 
Твоя задача - анализировать торговые стратегии, находить проблемы и предлагать улучшения.

Текущий контекст:
- Используемые стратегии: MA Crossover, RSI, Bollinger Bands, MACD, Martingale
- Платформа: Bybit
- Таймфрейм: 15 минут
- Риск-менеджмент: 1-2% от депозита на сделку

Отвечай кратко, по делу, с конкретными рекомендациями. Используй эмодзи для наглядности."""

        strategies_info = ""
        if context_data.get('strategies'):
            strategies_info = "\n\nТекущие метрики стратегий:\n"
            for s in context_data['strategies']:
                strategies_info += f"- {s['name']}: WinRate {s['winRate']:.1f}%, Сделок: {s['totalTrades']}, Средняя прибыль: {s['avgProfit']:.2f}%\n"
        
        # Вызов OpenAI API
        openai_key = os.environ.get('OPENAI_API_KEY')
        if not openai_key:
            raise Exception('OPENAI_API_KEY not configured')
        
        openai_request = {
            'model': 'gpt-4o-mini',
            'messages': [
                {'role': 'system', 'content': system_prompt + strategies_info},
                {'role': 'user', 'content': user_message}
            ],
            'max_tokens': 500,
            'temperature': 0.7
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {openai_key}'
        }
        
        req = Request(
            'https://api.openai.com/v1/chat/completions',
            data=json.dumps(openai_request).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        
        with urlopen(req, timeout=30) as response:
            openai_response = json.loads(response.read().decode('utf-8'))
            
            if 'choices' in openai_response and len(openai_response['choices']) > 0:
                gpt_message = openai_response['choices'][0]['message']['content']
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'response': gpt_message,
                        'model': 'gpt-4o-mini',
                        'timestamp': context.request_id
                    }),
                    'isBase64Encoded': False
                }
            else:
                raise Exception('Invalid OpenAI response')
    
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
