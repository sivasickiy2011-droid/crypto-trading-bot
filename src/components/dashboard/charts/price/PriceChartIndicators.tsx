import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

interface PriceDataPoint {
  time: string;
  rsi?: number;
  macd?: number;
}

interface PriceChartIndicatorsProps {
  chartData: PriceDataPoint[];
  showRSI: boolean;
  showMACD: boolean;
}

export default function PriceChartIndicators({ chartData, showRSI, showMACD }: PriceChartIndicatorsProps) {
  return (
    <>
      {showRSI && (
        <div className="h-[120px] mt-2">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-xs text-muted-foreground">RSI (14)</span>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-destructive">30</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-success">70</span>
            </div>
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
                domain={[0, 100]}
                ticks={[0, 30, 50, 70, 100]}
                orientation="right"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [value.toFixed(2), 'RSI']}
              />
              <Line 
                type="monotone"
                dataKey="rsi"
                stroke="hsl(280, 70%, 60%)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone"
                dataKey={() => 30}
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone"
                dataKey={() => 70}
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={1}
                strokeDasharray="3 3"
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
