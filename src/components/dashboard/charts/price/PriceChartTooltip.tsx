export const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  const isCandle = data.open !== undefined;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{data.time}</p>
      {isCandle ? (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
            <span className="text-muted-foreground">O:</span>
            <span className="text-foreground">{data.open?.toFixed(2)}</span>
            <span className="text-muted-foreground">H:</span>
            <span className="text-success">{data.high?.toFixed(2)}</span>
            <span className="text-muted-foreground">L:</span>
            <span className="text-destructive">{data.low?.toFixed(2)}</span>
            <span className="text-muted-foreground">C:</span>
            <span className="text-foreground font-semibold">{data.close?.toFixed(2)}</span>
          </div>
        </>
      ) : (
        <p className="text-sm font-mono font-semibold">${data.price?.toFixed(2)}</p>
      )}
      {data.volume && (
        <p className="text-xs text-muted-foreground mt-1">Vol: {data.volume.toFixed(4)}</p>
      )}
      {(data.ema9 || data.ema21 || data.ema50 || data.rsi || data.bbUpper) && (
        <div className="border-t border-border mt-2 pt-2 space-y-0.5">
          {data.ema9 && <p className="text-xs"><span className="text-yellow-500">EMA9:</span> <span className="font-mono">{data.ema9.toFixed(2)}</span></p>}
          {data.ema21 && <p className="text-xs"><span className="text-success">EMA21:</span> <span className="font-mono">{data.ema21.toFixed(2)}</span></p>}
          {data.ema50 && <p className="text-xs"><span className="text-blue-500">EMA50:</span> <span className="font-mono">{data.ema50.toFixed(2)}</span></p>}
          {data.rsi && <p className="text-xs"><span className="text-purple-500">RSI:</span> <span className="font-mono">{data.rsi.toFixed(2)}</span></p>}
          {data.bbUpper && (
            <p className="text-xs">
              <span className="text-purple-500">BB:</span> 
              <span className="font-mono ml-1">{data.bbUpper.toFixed(2)} / {data.bbLower.toFixed(2)}</span>
            </p>
          )}
          {data.macd && <p className="text-xs"><span className="text-blue-500">MACD:</span> <span className="font-mono">{data.macd.toFixed(4)}</span></p>}
        </div>
      )}
    </div>
  );
};
