import { UserOrderData, UserPositionData } from '@/lib/api';

interface OrderLinesProps {
  orders: UserOrderData[];
  positions: UserPositionData[];
  chartHeight: number;
  priceToY: (price: number) => number;
}

export default function OrderLines({ orders, positions, chartHeight, priceToY }: OrderLinesProps) {
  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      style={{ width: '100%', height: chartHeight }}
    >
      {orders.map((order) => {
        const y = priceToY(order.price);
        const isLong = order.side === 'Buy';
        const color = isLong ? '#22c55e' : '#ef4444';
        
        return (
          <g key={order.orderId}>
            <line
              x1="0"
              y1={y}
              x2="100%"
              y2={y}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.6"
            />
            <text
              x="8"
              y={y - 4}
              fill={color}
              fontSize="10"
              fontWeight="600"
              className="pointer-events-auto"
            >
              {isLong ? '📈' : '📉'} Заявка ${order.price.toFixed(2)} ({order.qty})
            </text>
          </g>
        );
      })}

      {positions.map((position) => {
        const y = priceToY(position.entryPrice);
        const isLong = position.side === 'Buy';
        const color = isLong ? '#22c55e' : '#ef4444';
        
        return (
          <g key={position.symbol + position.side}>
            <line
              x1="0"
              y1={y}
              x2="100%"
              y2={y}
              stroke={color}
              strokeWidth="2"
              opacity="0.8"
            />
            <text
              x="8"
              y={y - 4}
              fill={color}
              fontSize="10"
              fontWeight="700"
              className="pointer-events-auto"
            >
              {isLong ? '🟢' : '🔴'} ${position.entryPrice.toFixed(2)} | 
              PnL: {position.pnlPercent > 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}% 
              (${position.unrealizedPnl.toFixed(2)})
            </text>
          </g>
        );
      })}
    </svg>
  );
}
