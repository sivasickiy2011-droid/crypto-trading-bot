import { Line } from 'recharts';

interface ChartIndicatorsProps {
  showIndicators: {
    ema9: boolean;
    ema21: boolean;
    ema50: boolean;
    rsi: boolean;
    bb: boolean;
    macd: boolean;
  };
}

export default function ChartIndicators({ showIndicators }: ChartIndicatorsProps) {
  return (
    <>
      {showIndicators.ema9 && (
        <Line 
          type="monotone" 
          dataKey="ema9" 
          stroke="#fbbf24" 
          strokeWidth={1.2}
          dot={false}
          isAnimationActive={false}
          opacity={0.8}
        />
      )}
      
      {showIndicators.ema21 && (
        <Line 
          type="monotone" 
          dataKey="ema21" 
          stroke="#a855f7" 
          strokeWidth={1.2}
          dot={false}
          isAnimationActive={false}
          opacity={0.8}
        />
      )}
      
      {showIndicators.ema50 && (
        <Line 
          type="monotone" 
          dataKey="ema50" 
          stroke="#3b82f6" 
          strokeWidth={1.2}
          dot={false}
          isAnimationActive={false}
          opacity={0.8}
        />
      )}
      
      {showIndicators.bb && (
        <>
          <Line 
            type="monotone" 
            dataKey="bbUpper" 
            stroke="#818cf8" 
            strokeWidth={1}
            strokeDasharray="2 2"
            dot={false}
            isAnimationActive={false}
            opacity={0.5}
          />
          <Line 
            type="monotone" 
            dataKey="bbLower" 
            stroke="#818cf8" 
            strokeWidth={1}
            strokeDasharray="2 2"
            dot={false}
            isAnimationActive={false}
            opacity={0.5}
          />
        </>
      )}
    </>
  );
}
