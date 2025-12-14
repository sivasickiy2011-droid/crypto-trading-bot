import json
import os
import psycopg2
from typing import Dict, Any
from urllib.request import Request, urlopen

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    AI менеджер стратегий: позволяет YandexGPT читать/изменять настройки и запускать бэктесты
    Args: event - POST с action: get_config/update_config/run_backtest
    Returns: результат операции
    '''
    method: str = event.get('httpMethod', 'POST')
    
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        user_id = body.get('userId')
        
        if not user_id:
            return error_response('userId required')
        
        if action == 'get_config':
            return get_strategy_config(user_id)
        elif action == 'update_config':
            strategy_name = body.get('strategyName')
            config = body.get('config')
            return update_strategy_config(user_id, strategy_name, config)
        elif action == 'run_backtest':
            params = body.get('params', {})
            return run_backtest(user_id, params)
        else:
            return error_response(f'Unknown action: {action}')
    
    except Exception as e:
        return error_response(str(e))

def get_strategy_config(user_id: int) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT strategy_name, config FROM t_p69937905_crypto_trading_bot.strategy_configs WHERE user_id = %s",
                (user_id,)
            )
            rows = cur.fetchall()
            
            configs = {}
            for row in rows:
                configs[row[0]] = row[1]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'configs': configs,
                    'summary': generate_config_summary(configs)
                }),
                'isBase64Encoded': False
            }
    finally:
        conn.close()

def update_strategy_config(user_id: int, strategy_name: str, config: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO t_p69937905_crypto_trading_bot.strategy_configs (user_id, strategy_name, config)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id, strategy_name) 
                DO UPDATE SET config = EXCLUDED.config, updated_at = CURRENT_TIMESTAMP
                """,
                (user_id, strategy_name, json.dumps(config))
            )
            conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'Настройки {strategy_name} обновлены'
            }),
            'isBase64Encoded': False
        }
    finally:
        conn.close()

def run_backtest(user_id: int, params: Dict[str, Any]) -> Dict[str, Any]:
    '''Запускает бэктест со специальными параметрами через bot-executor'''
    try:
        bot_executor_url = 'https://functions.poehali.dev/e2dd154c-dde5-456b-a4c6-1200070fcc75'
        
        backtest_params = {
            'mode': 'backtest',
            'userId': user_id,
            'symbol': params.get('symbol', 'BTCUSDT'),
            'strategy': params.get('strategy', 'ma-crossover'),
            'period': params.get('period', '7d'),
            'customConfig': params.get('config')
        }
        
        req = Request(
            bot_executor_url,
            data=json.dumps(backtest_params).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'result': result,
                    'summary': generate_backtest_summary(result)
                }),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return error_response(f'Backtest failed: {str(e)}')

def generate_config_summary(configs: Dict[str, Any]) -> str:
    '''Создаёт текстовую сводку настроек для AI'''
    summary = []
    
    if 'ma-crossover' in configs:
        ma = configs['ma-crossover']
        summary.append(f"MA Crossover: короткий={ma.get('shortPeriod', 20)}, длинный={ma.get('longPeriod', 50)}, SL={ma.get('stopLoss', 2.5)}%, TP={ma.get('takeProfit', 5)}%")
    
    if 'martingale' in configs:
        mart = configs['martingale']
        summary.append(f"Мартингейл: уровни={mart.get('maxLevels', 3)}, множитель={mart.get('multiplier', 2)}, база={mart.get('baseSize', 0.1)}")
    
    if 'risk' in configs:
        risk = configs['risk']
        summary.append(f"Риск-менеджмент: макс позиций={risk.get('maxPositions', 5)}, плечо={risk.get('maxLeverage', 10)}x, лимит убытка={risk.get('dailyLossLimit', 500)} USDT")
    
    return '\n'.join(summary) if summary else 'Настройки по умолчанию'

def generate_backtest_summary(result: Dict[str, Any]) -> str:
    '''Создаёт текстовую сводку бэктеста для AI'''
    if not result.get('success'):
        return 'Бэктест не выполнен'
    
    data = result.get('data', {})
    return f"Прибыль: {data.get('totalPnl', 0):.2f} USDT, Сделок: {data.get('totalTrades', 0)}, Win Rate: {data.get('winRate', 0):.1f}%"

def error_response(message: str) -> Dict[str, Any]:
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': False, 'error': message}),
        'isBase64Encoded': False
    }
