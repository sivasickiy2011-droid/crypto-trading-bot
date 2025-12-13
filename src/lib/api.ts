const BYBIT_API_URL = 'https://functions.poehali.dev/6312362e-43af-4142-b3d3-cc951ebd3d8b';
const AUTH_API_URL = 'https://functions.poehali.dev/59cd39d3-4edd-4a58-9f7c-821efe138ccb';
const STRATEGY_API_URL = 'https://functions.poehali.dev/fcf2c4c4-a831-42be-b73d-06d909453b38';
const LANGUAGE_API_URL = 'https://functions.poehali.dev/c93d68f3-190d-4064-8eba-fe82eba4f04d';

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