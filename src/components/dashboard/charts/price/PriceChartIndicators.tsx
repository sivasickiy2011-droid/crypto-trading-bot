import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

interface PriceDataPoint {
  time: string;
  rsi?: number;
  macd?: number;
  volume?: number;
  open?: number;
  close?: number;
}

interface PriceChartIndicatorsProps {
  chartData: PriceDataPoint[];
  showRSI: boolean;
  showMACD: boolean;
  showVolume?: boolean;
}

export default function PriceChartIndicators({ chartData, showRSI, showMACD, showVolume = true }: PriceChartIndicatorsProps) {
  const volumeData = chartData.map(d => ({
    ...d,
    volumeColor: (d.close && d.open && d.close >= d.open) ? '#16a34a' : '#ef4444'
  }));

  return (
    <>
      {showVolume && (
        <div className="h-[100px] mt-2">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-xs text-zinc-400 font-medium">Объем</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volumeData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.3)" 
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.1)" 
                tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                orientation="right"
                width={60}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
                formatter={(value: number) => [value.toFixed(2), 'Объем']}
              />
              <Bar 
                dataKey="volume"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isGreen = payload.close >= payload.open;
                  const color = isGreen ? '#16a34a' : '#ef4444';
                  
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={color}
                      opacity={0.8}
                      rx={2}
                    />
                  );
                }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {showRSI && (
        <div className="h-[100px] mt-2">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-xs text-zinc-400 font-medium">RSI (14)</span>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-red-400">30</span>
              <span className="text-zinc-600">|</span>
              <span className="text-green-400">70</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.3)" 
                tick={{ fontSize: 10 }}
                hide
              />
              <YAxis 
                stroke="rgba(255,255,255,0.1)" 
                tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                domain={[0, 100]}
                ticks={[0, 30, 50, 70, 100]}
                orientation="right"
                width={60}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
                formatter={(value: number) => [value.toFixed(2), 'RSI']}
              />
              <Line 
                type="monotone"
                dataKey="rsi"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone"
                dataKey={() => 30}
                stroke="rgba(239, 68, 68, 0.5)"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone"
                dataKey={() => 70}
                stroke="rgba(22, 163, 74, 0.5)"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {showMACD && (
        <div className="h-[120px] mt-2">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-xs text-muted-foreground">MACD Histogram</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(220, 9%, 50%)" 
                tick={{ fontSize: 10 }}
                hide
              />
              <YAxis 
                stroke="hsl(220, 9%, 50%)" 
                tick={{ fontSize: 10 }}
                orientation="right"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [value.toFixed(4), 'MACD']}
              />
              <Bar 
                dataKey="macd"
                fill="hsl(199, 89%, 48%)"
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
              <Line 
                type="monotone"
                dataKey={() => 0}
                stroke="hsl(220, 9%, 50%)"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}