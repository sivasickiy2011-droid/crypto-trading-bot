import json
from typing import Dict, Any, List
from urllib.request import Request, urlopen

BYBIT_BASE_URL = "https://api.bybit.com"

def calculate_ma(prices: List[float], period: int) -> float:
    if len(prices) < period:
        return prices[-1] if prices else 0
    return sum(prices[-period:]) / period

def calculate_rsi(prices: List[float], period: int = 14) -> float:
    if len(prices) < period + 1:
        return 50.0
    
    gains = []
    losses = []
    
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        if change > 0:
            gains.append(change)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(change))
    
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    
    if avg_loss == 0:
        return 100.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def analyze_ma_crossover(prices: List[float]) -> Dict[str, Any]:
    if len(prices) < 50:
        return {'signal': 'neutral', 'strength': 0, 'reason': 'Недостаточно данных'}
    
    ma20 = calculate_ma(prices, 20)
    ma50 = calculate_ma(prices, 50)
    current_price = prices[-1]
    
    ma20_prev = calculate_ma(prices[:-1], 20)
    ma50_prev = calculate_ma(prices[:-1], 50)
    
    if ma20 > ma50 and ma20_prev <= ma50_prev:
        strength = min(100, int(((ma20 - ma50) / ma50) * 1000))
        return {'signal': 'buy', 'strength': strength, 'reason': f'MA20 пересекла MA50 вверх'}
    elif ma20 < ma50 and ma20_prev >= ma50_prev:
        strength = min(100, int(((ma50 - ma20) / ma50) * 1000))
        return {'signal': 'sell', 'strength': strength, 'reason': f'MA20 пересекла MA50 вниз'}
    elif ma20 > ma50:
        strength = min(100, int(((ma20 - ma50) / ma50) * 500))
        return {'signal': 'buy', 'strength': strength, 'reason': f'MA20 выше MA50 (восх. тренд)'}
    else:
        strength = min(100, int(((ma50 - ma20) / ma50) * 500))
        return {'signal': 'sell', 'strength': strength, 'reason': f'MA20 ниже MA50 (нисх. тренд)'}

def analyze_rsi(prices: List[float]) -> Dict[str, Any]:
    rsi = calculate_rsi(prices)
    
    if rsi < 30:
        strength = int((30 - rsi) * 3.33)
        return {'signal': 'buy', 'strength': min(100, strength), 'reason': f'RSI {rsi:.1f} (перепродано)'}
    elif rsi > 70:
        strength = int((rsi - 70) * 3.33)
        return {'signal': 'sell', 'strength': min(100, strength), 'reason': f'RSI {rsi:.1f} (перекуплено)'}
    else:
        return {'signal': 'neutral', 'strength': 50, 'reason': f'RSI {rsi:.1f} (нейтрально)'}

def analyze_volume_spike(volumes: List[float]) -> Dict[str, Any]:
    if len(volumes) < 20:
        return {'signal': 'neutral', 'strength': 0, 'reason': 'Недостаточно данных'}
    
    avg_volume = sum(volumes[-20:-1]) / 19
    current_volume = volumes[-1]
    
    if current_volume > avg_volume * 2:
        strength = min(100, int((current_volume / avg_volume) * 30))
        return {'signal': 'buy', 'strength': strength, 'reason': f'Всплеск объёма (+{int((current_volume/avg_volume)*100)}%)'}
    else:
        return {'signal': 'neutral', 'strength': 30, 'reason': 'Объём в норме'}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Расчёт торговых сигналов (MA, RSI, Volume) для анализа крипто-пар
    Args: event - dict с httpMethod, queryStringParameters
          context - объект с request_id
    Returns: HTTP response с массивом сигналов
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        symbol = params.get('symbol', 'BTCUSDT')
        
        try:
            url = f"{BYBIT_BASE_URL}/v5/market/kline?category=spot&symbol={symbol}&interval=15&limit=200"
            request = Request(url)
            
            with urlopen(request, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
            
            if data.get('retCode') == 0:
                klines = data.get('result', {}).get('list', [])
                
                prices = [float(k[4]) for k in reversed(klines)]
                volumes = [float(k[5]) for k in reversed(klines)]
                
                signals = [
                    {'strategy': 'MA Crossover', **analyze_ma_crossover(prices)},
                    {'strategy': 'RSI', **analyze_rsi(prices)},
                    {'strategy': 'Volume Spike', **analyze_volume_spike(volumes)}
                ]
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True, 'data': signals}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'Failed to fetch data from Bybit'}),
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
