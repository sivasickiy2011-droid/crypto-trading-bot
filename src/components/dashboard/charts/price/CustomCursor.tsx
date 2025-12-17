interface CustomCursorProps {
  points?: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
  chartHeight?: number;
  yMin?: number;
  yMax?: number;
}

export const CustomCursor = ({ points, width, height, chartHeight = 480, yMin = 0, yMax = 100 }: CustomCursorProps) => {
  if (!points || points.length === 0) return null;
  
  const { x, y } = points[0];
  
  const priceRange = yMax - yMin;
  const margin = 15;
  const availableHeight = (chartHeight || 480) - margin * 2;
  
  const currentPrice = yMax - ((y - margin) / availableHeight) * priceRange;
  
  return (
    <g>
      <line
        x1={x}
        y1={margin}
        x2={x}
        y2={(chartHeight || 480) - 10}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      
      <line
        x1={0}
        y1={y}
        x2={width || 0}
        y2={y}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      
      <g transform={`translate(${(width || 0) - 70}, ${y})`}>
        <rect
          x={0}
          y={-10}
          width={65}
          height={20}
          fill="#0ea5e9"
          rx={3}
          opacity={0.9}
        />
        <text
          x={32.5}
          y={4}
          textAnchor="middle"
          fill="#fff"
          fontSize={11}
          fontWeight={700}
          fontFamily="Roboto Mono"
        >
          {currentPrice.toFixed(2)}
        </text>
      </g>
    </g>
  );
};
