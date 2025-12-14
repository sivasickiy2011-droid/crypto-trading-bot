import json
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from typing import Dict, Any, List

BYBIT_BASE_URL = "https://api.bybit.com"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Анализирует криптовалютные пары по волатильности и надёжности рынка
    Находит лучшие пары для автоматической торговли
    Args: event - GET запрос (опционально: ?min_volume=1000000)
    Returns: Список топ-пар с метриками
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
    min_volume = float(params.get('min_volume', 5000000))  # Увеличиваем минимальный объём
    
    # Получаем все торговые пары
    tickers = get_all_tickers()
    
    # Быстрая фильтрация по объёму и сортировка
    filtered_tickers = [t for t in tickers if t['volume24h'] >= min_volume]
    filtered_tickers.sort(key=lambda x: x['turnover24h'], reverse=True)
    
    # Берём только топ-30 по обороту для детального анализа
    top_tickers = filtered_tickers[:30]
    
    # Анализируем каждую пару
    analyzed_pairs = []
    for ticker in top_tickers:
        symbol = ticker['symbol']
        
        # Получаем свечи для анализа
        klines = get_kline_data(symbol, interval='15', limit=100)
        
        if len(klines) < 50:
            continue
        
        # Рассчитываем метрики
        volatility = calculate_volatility(klines)
        liquidity = calculate_liquidity(ticker)
        trend_strength = calculate_trend_strength(klines)
        market_reliability = calculate_market_reliability(klines, ticker)
        
        # Общий скор (0-100)
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
    
    # Сортируем по общему скору
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
    """Получить все тикеры с Bybit"""
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
    """Получить свечи"""
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
    """
    Рассчитать волатильность пары
    Высокая волатильность = больше возможностей для прибыли
    """
    if len(klines) < 20:
        return {'value': 0, 'score': 0, 'level': 'unknown'}
    
    # ATR (Average True Range) за последние 14 свечей
    atr_values = []
    for i in range(1, len(klines)):
        high_low = klines[i]['high'] - klines[i]['low']
        high_close = abs(klines[i]['high'] - klines[i-1]['close'])
        low_close = abs(klines[i]['low'] - klines[i-1]['close'])
        true_range = max(high_low, high_close, low_close)
        atr_values.append(true_range)
    
    avg_atr = sum(atr_values[-14:]) / 14
    current_price = klines[-1]['close']
    
    # ATR в процентах от цены
    volatility_percent = (avg_atr / current_price) * 100
    
    # Скор 0-100 (оптимум 1-3%)
    if volatility_percent < 0.5:
        score = volatility_percent * 40  # Слишком низкая
    elif volatility_percent <= 3:
        score = 60 + (volatility_percent - 0.5) * 16  # Оптимальная зона
    else:
        score = max(0, 100 - (volatility_percent - 3) * 10)  # Слишком высокая
    
    level = 'low' if volatility_percent < 1 else 'optimal' if volatility_percent <= 3 else 'high'
    
    return {
        'value': round(volatility_percent, 3),
        'score': round(min(100, max(0, score)), 2),
        'level': level
    }

def calculate_liquidity(ticker: Dict[str, Any]) -> Dict[str, Any]:
    """
    Рассчитать ликвидность
    Высокая ликвидность = меньше проскальзывания, надёжнее исполнение
    """
    volume = ticker['volume24h']
    turnover = ticker['turnover24h']
    
    # Скор на основе оборота (в миллионах USDT)
    turnover_millions = turnover / 1_000_000
    
    if turnover_millions < 5:
        score = turnover_millions * 10
    elif turnover_millions <= 50:
        score = 50 + (turnover_millions - 5) * 1.11
    else:
        score = 100
    
    level = 'low' if turnover_millions < 10 else 'medium' if turnover_millions < 50 else 'high'
    
    return {
        'volume24h': round(volume, 2),
        'turnover24h': round(turnover, 2),
        'score': round(min(100, score), 2),
        'level': level
    }

def calculate_trend_strength(klines: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Рассчитать силу тренда
    Сильный тренд = лучше работают трендовые стратегии
    """
    if len(klines) < 50:
        return {'direction': 'unknown', 'strength': 0, 'score': 0}
    
    closes = [k['close'] for k in klines]
    
    # EMA 20 и EMA 50
    ema20 = calculate_ema(closes, 20)
    ema50 = calculate_ema(closes, 50)
    
    current_price = closes[-1]
    
    # Направление тренда
    if current_price > ema20[-1] > ema50[-1]:
        direction = 'uptrend'
        distance = ((current_price - ema50[-1]) / ema50[-1]) * 100
    elif current_price < ema20[-1] < ema50[-1]:
        direction = 'downtrend'
        distance = ((ema50[-1] - current_price) / ema50[-1]) * 100
    else:
        direction = 'sideways'
        distance = abs((current_price - ema50[-1]) / ema50[-1]) * 100
    
    # Сила тренда (расстояние от EMA50)
    if direction == 'sideways':
        strength = 30
        score = 40
    else:
        strength = min(100, distance * 20)
        score = 50 + strength * 0.5
    
    return {
        'direction': direction,
        'strength': round(strength, 2),
        'score': round(min(100, score), 2),
        'ema20': round(ema20[-1], 4),
        'ema50': round(ema50[-1], 4)
    }

def calculate_market_reliability(klines: List[Dict[str, Any]], ticker: Dict[str, Any]) -> Dict[str, Any]:
    """
    Рассчитать надёжность рынка
    Стабильность, отсутствие экстремальных скачков
    """
    if len(klines) < 20:
        return {'score': 0, 'level': 'unknown'}
    
    closes = [k['close'] for k in klines]
    
    # 1. Проверка на экстремальные свечи
    price_changes = []
    for i in range(1, len(klines)):
        change_percent = abs((klines[i]['close'] - klines[i-1]['close']) / klines[i-1]['close']) * 100
        price_changes.append(change_percent)
    
    avg_change = sum(price_changes) / len(price_changes)
    max_change = max(price_changes[-20:])
    
    # 2. Стабильность объёма
    volumes = [k['volume'] for k in klines[-20:]]
    avg_volume = sum(volumes) / len(volumes)
    volume_std = (sum((v - avg_volume) ** 2 for v in volumes) / len(volumes)) ** 0.5
    volume_stability = 100 - min(100, (volume_std / avg_volume) * 100)
    
    # 3. Отсутствие пампов/дампов
    extreme_penalty = 0
    if max_change > 10:
        extreme_penalty = min(40, (max_change - 10) * 4)
    
    # Итоговый скор
    score = (
        (100 - min(100, avg_change * 20)) * 0.4 +  # Средняя стабильность
        volume_stability * 0.3 +  # Стабильность объёма
        (100 - extreme_penalty) * 0.3  # Отсутствие экстремальных движений
    )
    
    level = 'low' if score < 50 else 'medium' if score < 75 else 'high'
    
    return {
        'score': round(score, 2),
        'level': level,
        'avgPriceChange': round(avg_change, 3),
        'maxRecentChange': round(max_change, 3)
    }

def calculate_ema(data: List[float], period: int) -> List[float]:
    """Рассчитать EMA"""
    result = []
    multiplier = 2 / (period + 1)
    result.append(data[0])
    
    for i in range(1, len(data)):
        result.append((data[i] - result[i - 1]) * multiplier + result[i - 1])
    
    return result

def get_recommendation(score: float, volatility: Dict, trend: Dict) -> str:
    """Получить рекомендацию по паре"""
    if score >= 75:
        if volatility['level'] == 'optimal' and trend['direction'] != 'sideways':
            return 'excellent'
        return 'good'
    elif score >= 60:
        return 'moderate'
    else:
        return 'avoid'