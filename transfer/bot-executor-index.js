const express = require('express');
const crypto = require('crypto');
const https = require('https');
const app = express();

app.use(express.json());

// Bybit API конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY || '';
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET || '';
const BYBIT_BASE_URL = 'https://api.bybit.com';

// Генерация подписи для Bybit V5 API
function generateSignature(params, secret) {
  const timestamp = Date.now().toString();
  const recv_window = '5000';
  
  const paramStr = timestamp + BYBIT_API_KEY + recv_window + JSON.stringify(params);
  
  return {
    signature: crypto
      .createHmac('sha256', secret)
      .update(paramStr)
      .digest('hex'),
    timestamp,
    recv_window
  };
}

// Выполнение запроса к Bybit API
function bybitRequest(endpoint, method, params = {}) {
  return new Promise((resolve, reject) => {
    const { signature, timestamp, recv_window } = generateSignature(params, BYBIT_API_SECRET);
    
    const options = {
      hostname: 'api.bybit.com',
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'X-BAPI-RECV-WINDOW': recv_window
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (method === 'POST') {
      req.write(JSON.stringify(params));
    }
    
    req.end();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'bot-executor',
    bybitConfigured: !!(BYBIT_API_KEY && BYBIT_API_SECRET)
  });
});

// Выполнение сделки
app.post('/execute', async (req, res) => {
  try {
    const { symbol, side, amount } = req.body;
    
    if (!symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, side, amount'
      });
    }
    
    // Если API ключи не настроены - возвращаем mock
    if (!BYBIT_API_KEY || !BYBIT_API_SECRET) {
      const mockOrder = {
        orderId: `MOCK_ORDER_${Date.now()}`,
        symbol,
        side,
        amount,
        status: 'filled',
        price: 89850.5,
        timestamp: Date.now(),
        note: 'Mock order - API keys not configured'
      };
      
      return res.json({ 
        success: true, 
        order: mockOrder,
        mode: 'mock'
      });
    }
    
    // Реальное размещение ордера через Bybit API
    const orderParams = {
      category: 'linear',
      symbol: symbol,
      side: side.toUpperCase() === 'BUY' ? 'Buy' : 'Sell',
      orderType: 'Market',
      qty: amount.toString(),
      timeInForce: 'GTC'
    };
    
    const result = await bybitRequest('/v5/order/create', 'POST', orderParams);
    
    if (result.retCode === 0) {
      const orderData = result.result;
      
      res.json({
        success: true,
        order: {
          orderId: orderData.orderId,
          symbol: orderData.symbol,
          side: orderData.side,
          amount: parseFloat(orderData.qty),
          status: orderData.orderStatus,
          price: parseFloat(orderData.price || 0),
          timestamp: Date.now()
        },
        mode: 'live'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.retMsg || 'Order placement failed',
        code: result.retCode
      });
    }
    
  } catch (error) {
    console.error('Execute error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Получение баланса
app.get('/balance', async (req, res) => {
  try {
    if (!BYBIT_API_KEY || !BYBIT_API_SECRET) {
      return res.json({
        success: false,
        error: 'API keys not configured'
      });
    }
    
    const result = await bybitRequest('/v5/account/wallet-balance?accountType=UNIFIED', 'GET');
    
    if (result.retCode === 0) {
      res.json({
        success: true,
        data: result.result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.retMsg
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получение активных ордеров
app.get('/orders', async (req, res) => {
  try {
    if (!BYBIT_API_KEY || !BYBIT_API_SECRET) {
      return res.json({
        success: false,
        error: 'API keys not configured'
      });
    }
    
    const symbol = req.query.symbol || '';
    const endpoint = `/v5/order/realtime?category=linear${symbol ? '&symbol=' + symbol : ''}`;
    
    const result = await bybitRequest(endpoint, 'GET');
    
    if (result.retCode === 0) {
      res.json({
        success: true,
        orders: result.result.list || []
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.retMsg
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Bot executor running on port ${PORT}`);
  console.log(`Bybit API configured: ${!!(BYBIT_API_KEY && BYBIT_API_SECRET)}`);
});
