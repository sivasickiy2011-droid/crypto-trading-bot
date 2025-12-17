import React from 'react';

interface OrderbookEntry {
  price: number;
  bidSize: number;
  askSize: number;
}

interface VolumeProfileOverlayProps {
  orderbook: OrderbookEntry[];
  yMin: number;
  yMax: number;
  chartWidth: number;
  chartHeight: number;
  bestBid?: number;
  bestAsk?: number;
}

export default function VolumeProfileOverlay({ 
  orderbook, 
  yMin, 
  yMax, 
  chartWidth, 
  chartHeight,
  bestBid,
  bestAsk
}: VolumeProfileOverlayProps) {
  const asks = orderbook.filter(o => o.askSize > 0).sort((a, b) => a.price - b.price).slice(0, 20);
  const bids = orderbook.filter(o => o.bidSize > 0).sort((a, b) => b.price - a.price).slice(0, 20);
  
  const maxOrderSize = Math.max(
    ...asks.map(o => o.askSize),
    ...bids.map(o => o.bidSize),
    1
  );

  // Отступы графика (должны совпадать с margin в ComposedChart)
  const MARGIN_TOP = 15;
  const MARGIN_BOTTOM = 10;
  const MARGIN_RIGHT = 150;
  
  // Дополнительная корректировка для точного совпадения с областью рисования графика
  const Y_AXIS_OFFSET = -27; // Точная подгонка для совпадения с линиями bid/ask
  
  const effectiveHeight = chartHeight - MARGIN_TOP - MARGIN_BOTTOM - Y_AXIS_OFFSET;
  
  const priceToY = (price: number) => {
    const priceRange = yMax - yMin;
    const relativePosition = (yMax - price) / priceRange;
    return relativePosition * effectiveHeight;
  };

  const svgWidth = chartWidth - (MARGIN_RIGHT - 100);
  const maxBarWidth = svgWidth * 0.2; // 20% от ширины SVG
  
  // Вычисляем центр между bid и ask
  const centerPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;
  const centerY = centerPrice ? priceToY(centerPrice) : null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: MARGIN_TOP + Y_AXIS_OFFSET,
        right: MARGIN_RIGHT - 100,
        width: svgWidth,
        height: effectiveHeight,
        pointerEvents: 'none',
      }}
    >
      {/* DEBUG: Выделение области объёмов */}
      <rect
        x={svgWidth - maxBarWidth - 10}
        y={0}
        width={maxBarWidth + 10}
        height={effectiveHeight}
        fill="rgba(255, 0, 255, 0.1)"
        stroke="rgba(255, 0, 255, 0.6)"
        strokeWidth={2}
        strokeDasharray="5 5"
      />
      
      {/* Asks (Sell orders) - Red bars from right */}
      {asks.map((order, idx) => {
        if (order.price < yMin || order.price > yMax) return null;
        
        const barWidth = (order.askSize / maxOrderSize) * maxBarWidth;
        const y = priceToY(order.price);
        
        return (
          <g key={`ask-vol-${idx}`}>
            <rect
              x={svgWidth - barWidth}
              y={y - 1.5}
              width={barWidth}
              height={3}
              fill="#ef4444"
              opacity={0.7}
            />
            {barWidth > maxBarWidth * 0.5 && (
              <text
                x={svgWidth - barWidth - 5}
                y={y + 1}
                fontSize={9}
                fill="#ef4444"
                textAnchor="end"
                fontFamily="Roboto Mono"
              >
                {order.askSize.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}
      
      {/* Центральная линия между bid/ask */}
      {centerY !== null && (
        <>
          <line
            x1={0}
            y1={centerY}
            x2={svgWidth}
            y2={centerY}
            stroke="#eab308"
            strokeWidth={3}
            opacity={0.9}
          />
          {/* DEBUG: Метка с координатой Y */}
          <text
            x={10}
            y={centerY - 5}
            fontSize={11}
            fill="#eab308"
            fontWeight="bold"
            fontFamily="monospace"
          >
            CENTER Y={centerY.toFixed(1)} PRICE={centerPrice?.toFixed(2)}
          </text>
        </>
      )}
      
      {/* Bids (Buy orders) - Green bars from right */}
      {bids.map((order, idx) => {
        if (order.price < yMin || order.price > yMax) return null;
        
        const barWidth = (order.bidSize / maxOrderSize) * maxBarWidth;
        const y = priceToY(order.price);
        
        return (
          <g key={`bid-vol-${idx}`}>
            <rect
              x={svgWidth - barWidth}
              y={y - 1.5}
              width={barWidth}
              height={3}
              fill="#16a34a"
              opacity={0.7}
            />
            {barWidth > maxBarWidth * 0.5 && (
              <text
                x={svgWidth - barWidth - 5}
                y={y + 1}
                fontSize={9}
                fill="#16a34a"
                textAnchor="end"
                fontFamily="Roboto Mono"
              >
                {order.bidSize.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}