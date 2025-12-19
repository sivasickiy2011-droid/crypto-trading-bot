import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, UTCTimestamp } from 'lightweight-charts';

interface PriceDataPoint {
  time: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
}

interface MACrossoverSignal {
  index: number;
  type: 'BUY' | 'SELL';
  price: number;
  ema9: number;
  ema21: number;
  rsi: number;
  timestamp: string;
}

interface MACrossoverData {
  signals: MACrossoverSignal[];
  indicators: {
    ema9: number[];
    ema21: number[];
    rsi: number[];
  };
}

interface TradingViewChartProps {
  chartData: PriceDataPoint[];
  chartType: 'line' | 'candle';
  showIndicators: {
    ema9: boolean;
    ema21: boolean;
    ema50: boolean;
  };
  userOrders?: Array<{orderId: string; symbol: string; side: string; price: number; orderStatus: string}>;
  userPositions?: Array<{symbol: string; side: string; entryPrice: number; unrealizedPnl: number; pnlPercent: number}>;
  maCrossoverSignals?: MACrossoverData | null;
  bestAsk?: number;
  bestBid?: number;
}

export default function TradingViewChart({
  chartData,
  chartType,
  showIndicators,
  userOrders = [],
  userPositions = [],
  maCrossoverSignals = null,
  bestAsk,
  bestBid
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkTheme = document.documentElement.classList.contains('dark');
      setIsDark(isDarkTheme);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          width: 1,
          style: 1,
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          width: 1,
          style: 1,
        },
      },
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [isDark]);

  useEffect(() => {
    if (!chartRef.current || !chartData.length) return;

    candleSeriesRef.current?.setData([]);
    lineSeriesRef.current?.setData([]);
    ema9SeriesRef.current?.setData([]);
    ema21SeriesRef.current?.setData([]);
    ema50SeriesRef.current?.setData([]);

    const convertToTimestamp = (timeStr: string): UTCTimestamp => {
      const date = new Date(timeStr);
      return (date.getTime() / 1000) as UTCTimestamp;
    };

    if (chartType === 'candle') {
      if (!candleSeriesRef.current) {
        candleSeriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });
      }

      const candleData: CandlestickData[] = chartData
        .filter(d => d.open && d.high && d.low && d.close)
        .map(d => ({
          time: convertToTimestamp(d.time),
          open: d.open!,
          high: d.high!,
          low: d.low!,
          close: d.close!,
        }));

      candleSeriesRef.current.setData(candleData);
    } else {
      if (!lineSeriesRef.current) {
        lineSeriesRef.current = chartRef.current.addLineSeries({
          color: '#6366f1',
          lineWidth: 2,
          priceLineVisible: false,
        });
      }

      const lineData: LineData[] = chartData.map(d => ({
        time: convertToTimestamp(d.time),
        value: d.price,
      }));

      lineSeriesRef.current.setData(lineData);
    }

    if (showIndicators.ema9) {
      if (!ema9SeriesRef.current) {
        ema9SeriesRef.current = chartRef.current.addLineSeries({
          color: '#eab308',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
      }

      const ema9Data: LineData[] = chartData
        .filter(d => d.ema9)
        .map(d => ({
          time: convertToTimestamp(d.time),
          value: d.ema9!,
        }));

      ema9SeriesRef.current.setData(ema9Data);
    }

    if (showIndicators.ema21) {
      if (!ema21SeriesRef.current) {
        ema21SeriesRef.current = chartRef.current.addLineSeries({
          color: '#a855f7',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
      }

      const ema21Data: LineData[] = chartData
        .filter(d => d.ema21)
        .map(d => ({
          time: convertToTimestamp(d.time),
          value: d.ema21!,
        }));

      ema21SeriesRef.current.setData(ema21Data);
    }

    if (showIndicators.ema50) {
      if (!ema50SeriesRef.current) {
        ema50SeriesRef.current = chartRef.current.addLineSeries({
          color: '#06b6d4',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
      }

      const ema50Data: LineData[] = chartData
        .filter(d => d.ema50)
        .map(d => ({
          time: convertToTimestamp(d.time),
          value: d.ema50!,
        }));

      ema50SeriesRef.current.setData(ema50Data);
    }

    chartRef.current.timeScale().fitContent();
  }, [chartData, chartType, showIndicators]);

  useEffect(() => {
    if (!chartRef.current) return;

    userOrders.forEach(order => {
      if (order.orderStatus === 'New') {
        chartRef.current!.addPriceLine({
          price: order.price,
          color: order.side === 'Buy' ? '#10b981' : '#ef4444',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `${order.side} ${order.price.toFixed(2)}`,
        });
      }
    });
  }, [userOrders]);

  useEffect(() => {
    if (!chartRef.current || !bestAsk || !bestBid) return;

    chartRef.current.addPriceLine({
      price: bestAsk,
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: 0,
      axisLabelVisible: true,
      title: `Ask ${bestAsk.toFixed(2)}`,
    });

    chartRef.current.addPriceLine({
      price: bestBid,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: 0,
      axisLabelVisible: true,
      title: `Bid ${bestBid.toFixed(2)}`,
    });
  }, [bestAsk, bestBid]);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  );
}
