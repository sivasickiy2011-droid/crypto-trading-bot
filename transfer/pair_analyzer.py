import json
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from typing import Dict, Any, List

BYBIT_BASE_URL = "https://api.bybit.com"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Анализирует криптовалютные пары по волатильности, ликвидности, тренду
    Args: event - GET запрос (опционально: ?min_volume=1000000)
          context - объект с request_id
    Returns: Список топ-пар с метриками для автоторговли
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters') or {}
    min_volume = float(params.get('min_volume', 5000000))
    
    tickers = get_all_tickers()
    
    filtered_tickers = [t for t in tickers if t['volume24h'] >= min_volume]
    filtered_tickers.sort(key=lambda x: x['turnover24h'], reverse=True)
    
    top_tickers = filtered_tickers[:30]
    
    analyzed_pairs = []
    for ticker in top_tickers:
        symbol = ticker['symbol']
        
        klines = get_kline_data(symbol, interval='15', limit=100)
        
        if len(klines) < 50:
            continue
        
        volatility = calculate_volatility(klines)
        liquidity = calculate_liquidity(ticker)
        trend_strength = calculate_trend_strength(klines)
        market_reliability = calculate_market_reliability(klines, ticker)
        
        total_score = (
            volatility['score'] * 0.30 +
            liquidity['score'] * 0.25 +
            trend_strength['score'] * 0.25 +
            market_reliability['score'] * 0.20
        )
        
        analyzed_pairs.append({
            'symbol': symbol,
            'price': ticker['lastPrice'],
            'volume24h': ticker['volume24h'],
            'priceChange24h': ticker['priceChangePercent'],
            'volatility': volatility,
            'liquidity': liquidity,
            'trend': trend_strength,
            'reliability': market_reliability,
            'totalScore': round(total_score, 2),
            'recommendation': get_recommendation(total_score, volatility, trend_strength)
        })
    
    analyzed_pairs.sort(key=lambda x: x['totalScore'], reverse=True)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'timestamp': int(time.time()),
            'totalPairs': len(analyzed_pairs),
            'topPairs': analyzed_pairs[:20],
            'criteria': {
                'minVolume': min_volume,
                'weights': {
                    'volatility': 0.30,
                    'liquidity': 0.25,
                    'trendStrength': 0.25,
                    'reliability': 0.20
                }
            }
        }),
        'isBase64Encoded': False
    }

def get_all_tickers() -> List[Dict[str, Any]]:
    url = f"{BYBIT_BASE_URL}/v5/market/tickers"
    params = {'category': 'linear'}
    
    full_url = f"{url}?{urlencode(params)}"
    request = Request(full_url)
    
    with urlopen(request, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        if data.get('retCode') == 0:
            tickers = data.get('result', {}).get('list', [])
            formatted = []
            
            for t in tickers:
                if not t['symbol'].endswith('USDT'):
                    continue
                
                try:
                    formatted.append({
                        'symbol': t['symbol'],
                        'lastPrice': float(t['lastPrice']),
                        'volume24h': float(t['volume24h']),
                        'turnover24h': float(t['turnover24h']),
                        'priceChangePercent': float(t['price24hPcnt']) * 100,
                        'highPrice24h': float(t['highPrice24h']),
                        'lowPrice24h': float(t['lowPrice24h'])
                    })
                except (ValueError, KeyError):
                    continue
            
            return formatted
        
        return []

def get_kline_data(symbol: str, interval: str = '15', limit: int = 100) -> List[Dict[str, Any]]:
    url = f"{BYBIT_BASE_URL}/v5/market/kline"
    params = {
        'category': 'linear',
        'symbol': symbol,
        'interval': interval,
        'limit': limit
    }
    
    full_url = f"{url}?{urlencode(params)}"
    request = Request(full_url)
    
    try:
        with urlopen(request, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            if data.get('retCode') == 0:
                klines = data.get('result', {}).get('list', [])
                formatted = []
                for k in klines:
                    formatted.append({
                        'time': k[0],
                        'open': float(k[1]),
                        'high': float(k[2]),
                        'low': float(k[3]),
                        'close': float(k[4]),
                        'volume': float(k[5])
                    })
                return formatted[::-1]
    except Exception:
        pass
    
    return []

def calculate_volatility(klines: List[Dict[str, Any]]) -> Dict[str, Any]:
    if len(klines) < 20:
        return {'value': 0, 'score': 0, 'level': 'unknown'}
    
    atr_values = []
    for i in range(1, len(klines)):
        high_low = klines[i]['high'] - klines[i]['low']
        high_close = abs(klines[i]['high'] - klines[i-1]['close'])
        low_close = abs(klines[i]['low'] - klines[i-1]['close'])
        true_range = max(high_low, high_close, low_close)
        atr_values.append(true_range)
    
    avg_atr = sum(atr_values[-14:]) / 14
    current_price = klines[-1]['close']
    
    volatility_percent = (avg_atr / current_price) * 100
    
    if volatility_percent < 0.5:
        score = volatility_percent * 40
    elif volatility_percent <= 3:
        score = 60 + (volatility_percent - 0.5) * 16
    else:
        score = max(0, 100 - (volatility_percent - 3) * 10)
    
    level = 'low' if volatility_percent < 1 else 'optimal' if volatility_percent <= 3 else 'high'
    
    return {
        'value': round(volatility_percent, 3),
        'score': round(min(100, max(0, score)), 2),
        'level': level
    }

def calculate_liquidity(ticker: Dict[str, Any]) -> Dict[str, Any]:
    volume = ticker['volume24h']
    turnover = ticker['turnover24h']
    
    turnover_millions = turnover / 1_000_000
    
    if turnover_millions < 5:
        score = turnover_millions * 10
    elif turnover_millions <= 50:
        score = 50 + (turnover_millions - 5) * 1.11
    else:
        score = 100
    
    level = 'low' if turnover_millions < 10 else 'medium' if turnover_millions < 50 else 'high'
    
    return {
        'volume24h': volume,
        'turnover24h': turnover,
        'score': round(min(100, max(0, score)), 2),
        'level': level
    }

def calculate_trend_strength(klines: List[Dict[str, Any]]) -> Dict[str, Any]:
    if len(klines) < 30:
        return {'direction': 'unknown', 'score': 0, 'strength': 0}
    
    closes = [k['close'] for k in klines[-30:]]
    
    sma_short = sum(closes[-10:]) / 10
    sma_long = sum(closes[-30:]) / 30
    
    trend_diff = ((sma_short - sma_long) / sma_long) * 100
    
    if abs(trend_diff) < 0.5:
        direction = 'sideways'
        strength = 0
        score = 30
    elif trend_diff > 0:
        direction = 'up'
        strength = min(100, abs(trend_diff) * 20)
        score = 50 + (strength / 2)
    else:
        direction = 'down'
        strength = min(100, abs(trend_diff) * 20)
        score = 50 + (strength / 2)
    
    return {
        'direction': direction,
        'strength': round(strength, 2),
        'score': round(min(100, max(0, score)), 2),
        'trendValue': round(trend_diff, 3)
    }

def calculate_market_reliability(klines: List[Dict[str, Any]], ticker: Dict[str, Any]) -> Dict[str, Any]:
    if len(klines) < 20:
        return {'score': 0, 'level': 'unknown'}
    
    price_consistency = 0
    for i in range(1, len(klines)):
        if klines[i]['close'] > 0:
            change = abs((klines[i]['close'] - klines[i-1]['close']) / klines[i-1]['close']) * 100
            if change < 5:
                price_consistency += 1
    
    consistency_percent = (price_consistency / (len(klines) - 1)) * 100
    
    turnover = ticker['turnover24h']
    turnover_score = min(100, (turnover / 10_000_000) * 50)
    
    score = (consistency_percent * 0.6) + (turnover_score * 0.4)
    
    level = 'low' if score < 50 else 'medium' if score < 75 else 'high'
    
    return {
        'score': round(min(100, max(0, score)), 2),
        'level': level,
        'priceConsistency': round(consistency_percent, 2)
    }

def get_recommendation(total_score: float, volatility: Dict, trend: Dict) -> str:
    if total_score >= 75:
        if trend['direction'] == 'up':
            return 'Отлично для длинных позиций'
        elif trend['direction'] == 'down':
            return 'Отлично для коротких позиций'
        else:
            return 'Отлично для скальпинга'
    elif total_score >= 60:
        return 'Хорошо для торговли'
    elif total_score >= 40:
        return 'Средний потенциал'
    else:
        return 'Низкий приоритет'
