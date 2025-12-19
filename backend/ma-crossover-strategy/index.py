import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def calculate_ema(prices: List[float], period: int) -> List[Optional[float]]:
    """
    Рассчитывает экспоненциальную скользящую среднюю (EMA)
    """
    if len(prices) < period:
        return [None] * len(prices)
    
    multiplier = 2 / (period + 1)
    ema_values = [None] * (period - 1)
    
    # Первое значение - простая средняя
    sma = sum(prices[:period]) / period
    ema_values.append(sma)
    
    # Остальные значения по формуле EMA
    for price in prices[period:]:
        ema = (price - ema_values[-1]) * multiplier + ema_values[-1]
        ema_values.append(ema)
    
    return ema_values

def calculate_rsi(prices: List[float], period: int = 14) -> List[Optional[float]]:
    """
    Рассчитывает индекс относительной силы (RSI)
    """
    if len(prices) < period + 1:
        return [None] * len(prices)
    
    rsi_values = [None] * period
    
    # Расчет изменений цены
    changes = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    
    gains = [change if change > 0 else 0 for change in changes]
    losses = [-change if change < 0 else 0 for change in changes]
    
    # Первое среднее значение
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    if avg_loss == 0:
        rsi_values.append(100)
    else:
        rs = avg_gain / avg_loss
        rsi_values.append(100 - (100 / (1 + rs)))
    
    # Остальные значения по формуле Wilder
    for i in range(period, len(changes)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
        if avg_loss == 0:
            rsi_values.append(100)
        else:
            rs = avg_gain / avg_loss
            rsi_values.append(100 - (100 / (1 + rs)))
    
    return rsi_values

def detect_signals(
    prices: List[float],
    ema9: List[Optional[float]],
    ema21: List[Optional[float]],
    rsi: List[Optional[float]]
) -> List[Dict[str, Any]]:
    """
    Определяет сигналы входа/выхода на основе стратегии MA Crossover + RSI
    """
    signals = []
    
    for i in range(1, len(prices)):
        if ema9[i] is None or ema21[i] is None or rsi[i] is None:
            continue
        
        if ema9[i-1] is None or ema21[i-1] is None or rsi[i-1] is None:
            continue
        
        # Сигнал на покупку: EMA9 пересекает EMA21 вверх + RSI > 50
        if ema9[i-1] <= ema21[i-1] and ema9[i] > ema21[i] and rsi[i] > 50:
            signals.append({
                'index': i,
                'type': 'BUY',
                'price': prices[i],
                'ema9': ema9[i],
                'ema21': ema21[i],
                'rsi': rsi[i],
                'timestamp': datetime.now().isoformat()
            })
        
        # Сигнал на продажу: EMA9 пересекает EMA21 вниз или RSI < 50
        elif ema9[i-1] >= ema21[i-1] and ema9[i] < ema21[i]:
            signals.append({
                'index': i,
                'type': 'SELL',
                'price': prices[i],
                'ema9': ema9[i],
                'ema21': ema21[i],
                'rsi': rsi[i],
                'timestamp': datetime.now().isoformat()
            })
    
    return signals

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Обработчик стратегии MA Crossover + RSI
    Принимает исторические данные, рассчитывает индикаторы и генерирует сигналы
    """
    method: str = event.get('httpMethod', 'GET')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        if method == 'POST':
            # Получаем исторические данные из тела запроса
            body_data = json.loads(event.get('body', '{}'))
            
            prices = body_data.get('prices', [])
            symbol = body_data.get('symbol', 'BTCUSDT')
            user_id = event.get('headers', {}).get('X-User-Id', '1')
            
            if not prices or len(prices) < 30:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': False,
                        'error': 'Недостаточно данных для расчета (минимум 30 свечей)'
                    })
                }
            
            # Рассчитываем индикаторы
            ema9 = calculate_ema(prices, 9)
            ema21 = calculate_ema(prices, 21)
            rsi = calculate_rsi(prices, 14)
            
            # Определяем сигналы
            signals = detect_signals(prices, ema9, ema21, rsi)
            
            # Сохраняем сигналы в БД (опционально)
            if signals:
                try:
                    dsn = os.environ.get('DATABASE_URL')
                    conn = psycopg2.connect(dsn)
                    cursor = conn.cursor()
                    
                    for signal in signals:
                        cursor.execute("""
                            INSERT INTO strategy_signals 
                            (user_id, symbol, signal_type, price, ema9, ema21, rsi, signal_data, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        """, (
                            user_id,
                            symbol,
                            signal['type'],
                            signal['price'],
                            signal['ema9'],
                            signal['ema21'],
                            signal['rsi'],
                            json.dumps(signal)
                        ))
                    
                    conn.commit()
                    cursor.close()
                    conn.close()
                except Exception as db_error:
                    print(f"DB Error: {db_error}")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'signals': signals,
                    'indicators': {
                        'ema9': ema9[-10:],  # Последние 10 значений
                        'ema21': ema21[-10:],
                        'rsi': rsi[-10:]
                    }
                })
            }
        
        elif method == 'GET':
            # Получаем последние сигналы из БД
            user_id = event.get('queryStringParameters', {}).get('user_id', '1')
            symbol = event.get('queryStringParameters', {}).get('symbol', 'BTCUSDT')
            limit = int(event.get('queryStringParameters', {}).get('limit', '10'))
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM strategy_signals 
                WHERE user_id = %s AND symbol = %s
                ORDER BY created_at DESC 
                LIMIT %s
            """, (user_id, symbol, limit))
            
            signals = cursor.fetchall()
            cursor.close()
            conn.close()
            
            # Преобразуем datetime в строки
            for signal in signals:
                if 'created_at' in signal and signal['created_at']:
                    signal['created_at'] = signal['created_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'signals': signals
                })
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
