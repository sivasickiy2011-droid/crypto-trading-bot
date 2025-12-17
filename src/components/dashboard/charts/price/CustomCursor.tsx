interface CustomCursorProps {
  points?: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
  chartHeight?: number;
  yMin?: number;
  yMax?: number;
}

export const CustomCursor = ({ points, width, height, chartHeight = 480, yMin = 0, yMax = 100 }: CustomCursorProps) => {
  if (!points || points.length === 0 || !width || !height) return null;
  
  const { x, y } = points[0];
  
  const priceRange = yMax - yMin;
  const yAxisValue = points[0].payload?.price || yMin + ((height - y) / height) * priceRange;
  
  return (
    <g>
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      
      <line
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      
      <g transform={`translate(${width - 70}, ${y})`}>
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
          {yAxisValue.toFixed(2)}
        </text>
      </g>
    </g>
  );
};