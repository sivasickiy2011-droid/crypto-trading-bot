import json
import os
from urllib.request import Request, urlopen
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    AI ассистент для анализа торговых стратегий через Nebius Token Factory
    Мониторит стратегии 24/7 и предлагает оптимизации
    Args: event - POST запрос с message и context
    Returns: Ответ от DeepSeek R1 Distill Llama 70B с рекомендациями
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
        selected_model = body.get('model', 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B')
        
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
        
        # Вызов Nebius Token Factory API (OpenAI-совместимый)
        nebius_key = os.environ.get('NEBIUS_API_KEY')
        if not nebius_key:
            raise Exception('NEBIUS_API_KEY not configured')
        
        # Используем выбранную модель
        ai_request = {
            'model': selected_model,
            'messages': [
                {'role': 'system', 'content': system_prompt + strategies_info},
                {'role': 'user', 'content': user_message}
            ],
            'max_tokens': 800,
            'temperature': 0.7
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {nebius_key}'
        }
        
        req = Request(
            'https://api.studio.nebius.ai/v1/chat/completions',
            data=json.dumps(ai_request).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        
        with urlopen(req, timeout=60) as response:
            ai_response = json.loads(response.read().decode('utf-8'))
            
            if 'choices' in ai_response and len(ai_response['choices']) > 0:
                ai_message = ai_response['choices'][0]['message']['content']
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'response': ai_message,
                        'model': selected_model,
                        'provider': 'Nebius Token Factory',
                        'timestamp': context.request_id
                    }),
                    'isBase64Encoded': False
                }
            else:
                raise Exception('Invalid AI response')
    
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