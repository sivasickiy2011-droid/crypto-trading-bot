import { useState, useEffect, useRef } from 'react';

export function useApiRequestCounter(
  chartsEnabled: boolean,
  signalsEnabled: boolean
) {
  const [savedRequests, setSavedRequests] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let requestsPerMinute = 0;
    
    if (!chartsEnabled) {
      requestsPerMinute += 4;
    }
    
    if (!signalsEnabled) {
      requestsPerMinute += 12;
    }

    if (requestsPerMinute > 0) {
      intervalRef.current = setInterval(() => {
        setSavedRequests(prev => prev + requestsPerMinute);
      }, 60000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [chartsEnabled, signalsEnabled]);

  const resetCounter = () => setSavedRequests(0);

  return { savedRequests, resetCounter };
}
