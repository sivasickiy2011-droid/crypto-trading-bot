import json
import os
import time
import hmac
import hashlib
import base64
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from typing import Dict, Any, List, Optional
import psycopg2

BYBIT_BASE_URL = "https://api.bybit.com"

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_api_keys(user_id: int) -> tuple[str, str]:
    """Get user's Bybit API keys from database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = f"SELECT api_key, api_secret FROM user_api_keys WHERE user_id = {user_id} AND exchange = 'bybit'"
    cur.execute(query)
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if not result:
        raise Exception(f'API keys not found for user {user_id}')
    
    api_key = base64.b64decode(result[0]).decode('utf-8')
    api_secret = base64.b64decode(result[1]).decode('utf-8')
    
    return api_key, api_secret

def generate_signature(params: str, secret: str) -> str:
    """Generate HMAC SHA256 signature for Bybit V5 API"""
    return hmac.new(
        secret.encode('utf-8'),
        params.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def bybit_request(endpoint: str, api_key: str, api_secret: str, params: Dict[str, Any] = None, method: str = 'GET') -> Dict[str, Any]:
    """Make authenticated request to Bybit V5 API"""
    if not params:
        params = {}
    
    timestamp = str(int(time.time() * 1000))
    recv_window = '5000'
    
    if method == 'GET':
        param_str = urlencode(sorted(params.items())) if params else ''
        sign_payload = f"{timestamp}{api_key}{recv_window}{param_str}"
    else:
        param_str = json.dumps(params) if params else ''
        sign_payload = f"{timestamp}{api_key}{recv_window}{param_str}"
    
    signature = generate_signature(sign_payload, api_secret)
    
    url = f"{BYBIT_BASE_URL}{endpoint}"
    if method == 'GET' and param_str:
        url += f"?{param_str}"
    
    headers = {
        'X-BAPI-API-KEY': api_key,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recv_window,
        'Content-Type': 'application/json'
    }
    
    data = None
    if method == 'POST' and param_str:
        data = param_str.encode('utf-8')
    
    request = Request(url, data=data, headers=headers, method=method)
    
    with urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode('utf-8'))

def get_kline_data(symbol: str, interval: str = '15', limit: int = 200) -> List[Dict[str, Any]]:
    """Get kline data from Bybit public API"""
    url = f"{BYBIT_BASE_URL}/v5/market/kline"
    params = {
        'category': 'linear',
        'symbol': symbol,
        'interval': interval,
        'limit': limit
    }
    
    full_url = f"{url}?{urlencode(params)}"
    request = Request(full_url)
    
    with urlopen(request, timeout=10) as response:
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
        
        return []

def calculate_ema(data: List[float], period: int) -> List[float]:
    """Calculate EMA"""
    result = []
    multiplier = 2 / (period + 1)
    result.append(data[0])
    
    for i in range(1, len(data)):
        result.append((data[i] - result[i - 1]) * multiplier + result[i - 1])
    
    return result

def calculate_rsi(data: List[float], period: int = 14) -> List[float]:
    """Calculate RSI"""
    result = []
    gains = []
    losses = []
    
    for i in range(1, len(data)):
        change = data[i] - data[i - 1]
        gains.append(change if change > 0 else 0)
        losses.append(abs(change) if change < 0 else 0)
    
    for i in range(len(gains)):
        if i < period - 1:
            result.append(50)
        else:
            avg_gain = sum(gains[i - period + 1:i + 1]) / period
            avg_loss = sum(losses[i - period + 1:i + 1]) / period
            
            if avg_loss == 0:
                result.append(100)
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
                result.append(rsi)
    
    return [50] + result

def calculate_sma(data: List[float], period: int) -> List[float]:
    """Calculate SMA"""
    result = []
    for i in range(len(data)):
        if i < period - 1:
            slice_data = data[:i + 1]
            result.append(sum(slice_data) / len(slice_data))
        else:
            slice_data = data[i - period + 1:i + 1]
            result.append(sum(slice_data) / period)
    return result

def calculate_bollinger_bands(data: List[float], period: int = 20, std_dev: int = 2) -> Dict[str, List[float]]:
    """Calculate Bollinger Bands"""
    middle = calculate_sma(data, period)
    upper = []
    lower = []
    
    for i in range(len(data)):
        if i < period - 1:
            slice_data = data[:i + 1]
        else:
            slice_data = data[i - period + 1:i + 1]
        
        variance = sum((x - middle[i]) ** 2 for x in slice_data) / len(slice_data)
        std = variance ** 0.5
        
        upper.append(middle[i] + std_dev * std)
        lower.append(middle[i] - std_dev * std)
    
    return {'upper': upper, 'middle': middle, 'lower': lower}

def calculate_macd(data: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[float]]:
    """Calculate MACD"""
    ema_fast = calculate_ema(data, fast)
    ema_slow = calculate_ema(data, slow)
    
    macd_line = [ema_fast[i] - ema_slow[i] for i in range(len(data))]
    signal_line = calculate_ema(macd_line, signal)
    histogram = [macd_line[i] - signal_line[i] for i in range(len(macd_line))]
    
    return {'macd': macd_line, 'signal': signal_line, 'histogram': histogram}

def analyze_strategy(klines: List[Dict[str, Any]], strategy: str) -> Optional[str]:
    """Analyze strategy and return signal: BUY, SELL, or None"""
    if len(klines) < 200:
        return None
    
    closes = [k['close'] for k in klines]
    highs = [k['high'] for k in klines]
    lows = [k['low'] for k in klines]
    
    if strategy == 'ma-crossover':
        ema9 = calculate_ema(closes, 9)
        ema21 = calculate_ema(closes, 21)
        ema55 = calculate_ema(closes, 55)
        
        idx = -1
        trend_up = closes[idx] > ema55[idx]
        trend_down = closes[idx] < ema55[idx]
        
        if trend_up and ema9[-2] <= ema21[-2] and ema9[idx] > ema21[idx]:
            return 'BUY'
        elif trend_down and ema9[-2] >= ema21[-2] and ema9[idx] < ema21[idx]:
            return 'SELL'
    
    elif strategy == 'rsi':
        rsi = calculate_rsi(closes, 14)
        ema50 = calculate_ema(closes, 50)
        
        idx = -1
        trend_up = closes[idx] > ema50[idx]
        trend_down = closes[idx] < ema50[idx]
        
        if trend_up and rsi[-2] <= 35 and rsi[idx] > 35:
            return 'BUY'
        elif trend_down and rsi[-2] >= 65 and rsi[idx] < 65:
            return 'SELL'
    
    elif strategy == 'bollinger':
        bb = calculate_bollinger_bands(closes, 20, 2)
        ema50 = calculate_ema(closes, 50)
        
        idx = -1
        trend_up = closes[idx] > ema50[idx]
        trend_down = closes[idx] < ema50[idx]
        
        price_below_lower = lows[idx] <= bb['lower'][idx] and closes[idx] > bb['lower'][idx]
        price_above_upper = highs[idx] >= bb['upper'][idx] and closes[idx] < bb['upper'][idx]
        
        if trend_up and price_below_lower:
            return 'BUY'
        elif trend_down and price_above_upper:
            return 'SELL'
    
    elif strategy == 'macd':
        macd_data = calculate_macd(closes, 12, 26, 9)
        ema200 = calculate_ema(closes, 200)
        
        idx = -1
        trend_up = closes[idx] > ema200[idx]
        trend_down = closes[idx] < ema200[idx]
        
        bullish_cross = macd_data['histogram'][-2] <= 0 and macd_data['histogram'][idx] > 0
        bearish_cross = macd_data['histogram'][-2] >= 0 and macd_data['histogram'][idx] < 0
        
        if trend_up and bullish_cross and macd_data['macd'][idx] < 0:
            return 'BUY'
        elif trend_down and bearish_cross and macd_data['macd'][idx] > 0:
            return 'SELL'
    
    return None

def get_current_position(api_key: str, api_secret: str, symbol: str) -> Optional[Dict[str, Any]]:
    """Get current position for symbol"""
    result = bybit_request(
        '/v5/position/list',
        api_key,
        api_secret,
        {'category': 'linear', 'symbol': symbol}
    )
    
    if result.get('retCode') == 0:
        positions = result.get('result', {}).get('list', [])
        for pos in positions:
            size = float(pos.get('size', 0))
            if size > 0:
                return {
                    'side': pos.get('side', ''),
                    'size': size,
                    'entryPrice': float(pos.get('avgPrice', 0)),
                    'unrealizedPnl': float(pos.get('unrealisedPnl', 0))
                }
    
    return None

def place_order(api_key: str, api_secret: str, symbol: str, side: str, qty: float) -> bool:
    """Place market order on Bybit"""
    params = {
        'category': 'linear',
        'symbol': symbol,
        'side': side,
        'orderType': 'Market',
        'qty': str(qty),
        'timeInForce': 'GTC'
    }
    
    result = bybit_request('/v5/order/create', api_key, api_secret, params, 'POST')
    
    return result.get('retCode') == 0

def close_position(api_key: str, api_secret: str, symbol: str, side: str, qty: float) -> bool:
    """Close position"""
    close_side = 'Sell' if side == 'Buy' else 'Buy'
    return place_order(api_key, api_secret, symbol, close_side, qty)

def send_telegram_notification(message: str):
    """Send notification to Telegram"""
    try:
        telegram_url = 'https://functions.poehali.dev/3e081d1f-2d3b-429a-8490-942983a3d17d'
        data = json.dumps({'message': message}).encode('utf-8')
        request = Request(telegram_url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        with urlopen(request, timeout=5) as response:
            response.read()
    except Exception as e:
        print(f'Failed to send Telegram notification: {e}')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Автономный исполнитель ботов: анализирует стратегии и торгует 24/7
    Args: event - HTTP запрос (может быть пустым для cron)
    Returns: Отчет о выполненных действиях
    '''
    method = event.get('httpMethod', 'GET')
    
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
    
    conn = get_db_connection()
    actions = []
    
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id, bot_id, pair, market, strategy, entry_signal FROM t_p69937905_crypto_trading_bot.bots WHERE active = true"
            )
            active_bots = cur.fetchall()
        
        for bot_row in active_bots:
            user_id, bot_id, pair, market, strategy, entry_signal = bot_row
            
            try:
                api_key, api_secret = get_user_api_keys(user_id)
            except Exception as e:
                actions.append(f'Bot {bot_id}: No API keys - {str(e)}')
                continue
            
            symbol = pair.replace('/', '')
            
            # Преобразуем человеко-читаемое название стратегии в технический ключ
            strategy_map = {
                'EMA 9/21/55 (тренд + кросс)': 'ma-crossover',
                'RSI 14 + EMA 50': 'rsi',
                'Bollinger Bands + EMA 50': 'bollinger',
                'MACD + EMA 200': 'macd',
                'Мартингейл': 'martingale'
            }
            strategy_key = strategy_map.get(strategy, strategy.lower())
            
            klines = get_kline_data(symbol, '15', 200)
            if not klines:
                actions.append(f'Bot {bot_id}: No kline data')
                continue
            
            signal = analyze_strategy(klines, strategy_key)
            print(f'Bot {bot_id} ({symbol}): strategy={strategy_key}, signal={signal}')
            
            position = get_current_position(api_key, api_secret, symbol)
            
            if position:
                pos_side = position['side']
                
                if (signal == 'SELL' and pos_side == 'Buy') or (signal == 'BUY' and pos_side == 'Sell'):
                    if close_position(api_key, api_secret, symbol, pos_side, position['size']):
                        pnl = position['unrealizedPnl']
                        msg = f"🔴 Закрыта позиция {symbol}\nPnL: {pnl:.2f} USDT\nПричина: Обратный сигнал"
                        send_telegram_notification(msg)
                        actions.append(f'Bot {bot_id}: Closed position {pos_side} on {symbol}, PnL: {pnl:.2f}')
                    else:
                        actions.append(f'Bot {bot_id}: Failed to close position')
            
            else:
                if signal in ['BUY', 'SELL']:
                    side = 'Buy' if signal == 'BUY' else 'Sell'
                    qty = 0.001
                    
                    if place_order(api_key, api_secret, symbol, side, qty):
                        current_price = klines[-1]['close']
                        msg = f"🟢 Открыта позиция {symbol}\nНаправление: {side}\nЦена: {current_price}\nСтратегия: {strategy}"
                        send_telegram_notification(msg)
                        actions.append(f'Bot {bot_id}: Opened {side} position on {symbol}')
                        
                        with conn.cursor() as cur:
                            cur.execute(
                                "UPDATE t_p69937905_crypto_trading_bot.bots SET entry_signal = %s WHERE user_id = %s AND bot_id = %s",
                                (side.upper(), user_id, bot_id)
                            )
                            conn.commit()
                    else:
                        actions.append(f'Bot {bot_id}: Failed to place order')
                else:
                    actions.append(f'Bot {bot_id}: No signal')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'actions': actions}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()