interface CustomCursorProps {
  points?: Array<{ x: number; y: number; payload?: any }>;
  width?: number;
  height?: number;
  chartHeight?: number;
  yMin?: number;
  yMax?: number;
  activeCoordinate?: { x: number; y: number };
}

export const CustomCursor = (props: any) => {
  const { points, width, height, yAxisMap, activeLabel } = props;
  
  if (!points || points.length === 0 || !width || !height) return null;
  
  const x = points[0].x;
  
  const yAxis = yAxisMap && yAxisMap[0];
  if (!yAxis) return null;
  
  const { domain } = yAxis;
  const [yMin, yMax] = domain || [0, 100];
  
  const mouseY = props.activeCoordinate?.y;
  if (!mouseY) return null;
  
  const priceRange = yMax - yMin;
  const relativeY = mouseY / height;
  const currentPrice = yMax - (relativeY * priceRange);
  
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
        y1={mouseY}
        x2={width}
        y2={mouseY}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      
      <g transform={`translate(${width - 70}, ${mouseY})`}>
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