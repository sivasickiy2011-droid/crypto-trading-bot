const BYBIT_API_URL = 'https://functions.poehali.dev/6312362e-43af-4142-b3d3-cc951ebd3d8b';

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
