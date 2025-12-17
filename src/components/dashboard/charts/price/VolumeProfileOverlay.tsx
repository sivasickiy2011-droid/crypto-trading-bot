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

  const priceToY = (price: number) => {
    const priceRange = yMax - yMin;
    const relativePosition = (yMax - price) / priceRange;
    return relativePosition * chartHeight;
  };

  const maxBarWidth = chartWidth * 0.15; // 15% max width
  
  // Вычисляем центр между bid и ask
  const centerPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;
  const centerY = centerPrice ? priceToY(centerPrice) : null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 15,
        right: 50,
        width: chartWidth - 50,
        height: chartHeight - 25,
        pointerEvents: 'none',
      }}
    >
      {/* Asks (Sell orders) - Red bars from right */}
      {asks.map((order, idx) => {
        if (order.price < yMin || order.price > yMax) return null;
        
        const barWidth = (order.askSize / maxOrderSize) * maxBarWidth;
        const y = priceToY(order.price);
        
        return (
          <g key={`ask-vol-${idx}`}>
            <rect
              x={chartWidth - 50 - barWidth}
              y={y - 1.5}
              width={barWidth}
              height={3}
              fill="#ef4444"
              opacity={0.7}
            />
            {barWidth > maxBarWidth * 0.5 && (
              <text
                x={chartWidth - 55 - barWidth}
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
        <line
          x1={0}
          y1={centerY}
          x2={chartWidth - 50}
          y2={centerY}
          stroke="#eab308"
          strokeWidth={2}
          opacity={0.8}
        />
      )}
      
      {/* Bids (Buy orders) - Green bars from right */}
      {bids.map((order, idx) => {
        if (order.price < yMin || order.price > yMax) return null;
        
        const barWidth = (order.bidSize / maxOrderSize) * maxBarWidth;
        const y = priceToY(order.price);
        
        return (
          <g key={`bid-vol-${idx}`}>
            <rect
              x={chartWidth - 50 - barWidth}
              y={y - 1.5}
              width={barWidth}
              height={3}
              fill="#16a34a"
              opacity={0.7}
            />
            {barWidth > maxBarWidth * 0.5 && (
              <text
                x={chartWidth - 55 - barWidth}
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