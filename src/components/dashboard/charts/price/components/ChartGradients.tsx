export default function ChartGradients() {
  return (
    <defs>
      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.15}/>
        <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0}/>
      </linearGradient>
      <linearGradient id="colorSpot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
      </linearGradient>
      <linearGradient id="colorFutures" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
      </linearGradient>
    </defs>
  );
}
