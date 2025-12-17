const BYBIT_API_URL = 'https://function.centerai.tech/api/bybit-market';
const BYBIT_USER_DATA_URL = 'https://function.centerai.tech/api/bybit-user-data';
const AUTH_API_URL = 'https://function.centerai.tech/api/auth';
const STRATEGY_API_URL = 'https://functions.poehali.dev/9640515a-c02c-42e9-9706-ca5bfaeabcbd';
const LANGUAGE_API_URL = 'https://function.centerai.tech/api/language';
const STRATEGY_SIGNALS_URL = 'https://function.centerai.tech/api/strategy-signals';
const TELEGRAM_NOTIFY_URL = 'https://function.centerai.tech/api/telegram-notify';
const BOTS_MANAGER_URL = 'https://function.centerai.tech/api/bots-manager';
const USER_SETTINGS_URL = 'https://function.centerai.tech/api/user-settings';
const VIRTUAL_TRADES_URL = 'https://function.centerai.tech/api/virtual-trades';
const API_KEYS_URL = 'https://functions.poehali.dev/6a6a9758-4774-44ac-81a0-af8f328603c2';

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  volume: string;
  high24h: number;
  low24h: number;
}

export interface KlineData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getMarketTickers(symbols: string[]): Promise<TickerData[]> {
  const response = await fetch(`${BYBIT_API_URL}?action=tickers&symbols=${symbols.join(',')}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch tickers');
}

export async function getKlineData(
  symbol: string, 
  interval: string = '15', 
  limit: number = 50
): Promise<KlineData[]> {
  const response = await fetch(
    `${BYBIT_API_URL}?action=kline&symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch kline data');
}

export async function getAccountBalance(): Promise<any> {
  const response = await fetch(`${BYBIT_API_URL}?action=balance`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch balance');
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user_id?: number;
  username?: string;
  error?: string;
  needs_password_reset?: boolean;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username, password })
  });
  return await response.json();
}

export async function register(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', username, password })
  });
  return await response.json();
}

export async function saveStrategyConfig(userId: number, strategyName: string, configData: any): Promise<any> {
  const response = await fetch(STRATEGY_API_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-User-Id': userId.toString()
    },
    body: JSON.stringify({ strategy_name: strategyName, config_data: configData })
  });
  return await response.json();
}

export async function loadStrategyConfig(userId: number, strategyName?: string): Promise<any> {
  const url = strategyName 
    ? `${STRATEGY_API_URL}?strategy=${strategyName}`
    : STRATEGY_API_URL;
  
  const response = await fetch(url, {
    headers: { 'X-User-Id': userId.toString() }
  });
  return await response.json();
}

export async function getUserLanguage(userId: number): Promise<{success: boolean, language: string}> {
  const response = await fetch(LANGUAGE_API_URL, {
    headers: { 'X-User-Id': userId.toString() }
  });
  return await response.json();
}

export async function setUserLanguage(userId: number, language: 'ru' | 'en'): Promise<any> {
  const response = await fetch(LANGUAGE_API_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-User-Id': userId.toString()
    },
    body: JSON.stringify({ language })
  });
  return await response.json();
}

export async function setPassword(userId: number, newPassword: string): Promise<LoginResponse> {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set_password', user_id: userId, new_password: newPassword })
  });
  return await response.json();
}

export async function saveApiKeys(userId: number, apiKey: string, apiSecret: string, exchange: string = 'bybit'): Promise<any> {
  const response = await fetch(API_KEYS_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-User-Id': userId.toString()
    },
    body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret, exchange })
  });
  return await response.json();
}

export async function getApiKeys(userId: number, exchange: string = 'bybit'): Promise<any> {
  const response = await fetch(`${API_KEYS_URL}?exchange=${exchange}`, {
    method: 'GET',
    headers: { 
      'X-User-Id': userId.toString() 
    }
  });
  const data = await response.json();
  return { ...data, hasKeys: data.success };
}

export async function deleteApiKeys(userId: number, exchange: string = 'bybit'): Promise<any> {
  const response = await fetch(`${API_KEYS_URL}?exchange=${exchange}`, {
    method: 'DELETE',
    headers: { 
      'X-User-Id': userId.toString()
    }
  });
  return await response.json();
}

export interface UserBalanceData {
  totalEquity: number;
  totalWalletBalance: number;
  totalAvailable: number;
  usdtBalance: number;
}

export interface UserPositionData {
  symbol: string;
  side: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  unrealizedPnl: number;
  pnlPercent: number;
}

export interface UserOrderData {
  orderId: string;
  symbol: string;
  side: string;
  orderType: string;
  price: number;
  qty: number;
  cumExecQty: number;
  orderStatus: string;
  createdTime: string;
}

export async function getUserBalance(userId: number, testnet: boolean = false): Promise<UserBalanceData> {
  const url = BYBIT_USER_DATA_URL;
  const response = await fetch(`${url}?action=balance`, {
    headers: { 'X-User-Id': userId.toString() }
  });
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch user balance');
}

export async function getUserPositions(userId: number, testnet: boolean = false): Promise<UserPositionData[]> {
  const url = BYBIT_USER_DATA_URL;
  const response = await fetch(`${url}?action=positions`, {
    headers: { 'X-User-Id': userId.toString() }
  });
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch user positions');
}

export async function getUserOrders(userId: number, testnet: boolean = false): Promise<UserOrderData[]> {
  const url = BYBIT_USER_DATA_URL;
  const response = await fetch(`${url}?action=orders`, {
    headers: { 'X-User-Id': userId.toString() }
  });
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch user orders');
}

export interface OrderbookEntry {
  price: number;
  bidSize: number;
  askSize: number;
}

export async function getOrderbook(symbol: string, limit: number = 25): Promise<OrderbookEntry[]> {
  const response = await fetch(`${BYBIT_API_URL}?action=orderbook&symbol=${symbol}&limit=${limit}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch orderbook');
}

export async function getCurrentPrice(symbol: string): Promise<number> {
  const response = await fetch(`${BYBIT_API_URL}?action=tickers&symbols=${symbol}`);
  const data = await response.json();
  
  if (data.success && data.data && data.data.length > 0) {
    return data.data[0].price;
  }
  
  throw new Error(data.error || 'Failed to fetch current price');
}

export interface StrategySignal {
  strategy: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  reason: string;
}

export async function getStrategySignals(symbol: string): Promise<StrategySignal[]> {
  const response = await fetch(`${STRATEGY_SIGNALS_URL}?symbol=${symbol}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch strategy signals');
}

interface TelegramNotificationBase {
  type: 'signal' | 'position_entry' | 'position_exit';
  symbol: string;
  mode: string;
}

interface SignalNotification extends TelegramNotificationBase {
  type: 'signal';
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  reason: string;
  strategy: string;
}

interface PositionEntryNotification extends TelegramNotificationBase {
  type: 'position_entry';
  side: string;
  entryPrice: number;
  size: number;
  leverage: number;
  market: string;
}

interface PositionExitNotification extends TelegramNotificationBase {
  type: 'position_exit';
  side: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  reason: string;
}

type TelegramNotification = SignalNotification | PositionEntryNotification | PositionExitNotification;

export async function sendTelegramNotification(notification: TelegramNotification): Promise<{ success: boolean }> {
  const response = await fetch(TELEGRAM_NOTIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification)
  });
  const data = await response.json();
  
  if (data.success) {
    return data;
  }
  
  throw new Error(data.error || 'Failed to send notification');
}

export interface BotData {
  id: string;
  pair: string;
  market: 'spot' | 'futures';
  strategy: string;
  active: boolean;
  entrySignal?: string;
  status?: 'searching' | 'in_position' | 'stopped';
}

export async function getUserBots(userId: number): Promise<BotData[]> {
  const response = await fetch(BOTS_MANAGER_URL, {
    headers: { 'X-User-Id': userId.toString() }
  });
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.error || 'Failed to fetch bots');
}

export async function createBot(userId: number, bot: BotData): Promise<{ success: boolean }> {
  const response = await fetch(BOTS_MANAGER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId.toString()
    },
    body: JSON.stringify({
      bot_id: bot.id,
      pair: bot.pair,
      market: bot.market,
      strategy: bot.strategy,
      active: bot.active,
      entrySignal: bot.entrySignal
    })
  });
  const data = await response.json();
  
  if (data.success) {
    return data;
  }
  
  throw new Error(data.error || 'Failed to create bot');
}

export async function updateBot(userId: number, botId: string, active: boolean): Promise<{ success: boolean }> {
  const response = await fetch(BOTS_MANAGER_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId.toString()
    },
    body: JSON.stringify({ bot_id: botId, active })
  });
  const data = await response.json();
  
  if (data.success) {
    return data;
  }
  
  throw new Error(data.error || 'Failed to update bot');
}

export async function deleteBot(userId: number, botId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${BOTS_MANAGER_URL}?bot_id=${botId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId.toString() }
  });
  const data = await response.json();
  
  if (data.success) {
    return data;
  }
  
  throw new Error(data.error || 'Failed to delete bot');
}

export interface UserSettings {
  charts_enabled: boolean;
  signals_mode: 'disabled' | 'bots_only' | 'top10';
}

export async function getUserSettings(userId: number): Promise<UserSettings> {
  const response = await fetch(USER_SETTINGS_URL, {
    headers: { 'X-User-Id': userId.toString() }
  });
  const data = await response.json();
  
  if (data.success) {
    return data.settings;
  }
  
  throw new Error(data.error || 'Failed to fetch user settings');
}

export async function updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<{ success: boolean }> {
  const response = await fetch(USER_SETTINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId.toString()
    },
    body: JSON.stringify(settings)
  });
  const data = await response.json();
  
  if (data.success) {
    return data;
  }
  
  throw new Error(data.error || 'Failed to update settings');
}