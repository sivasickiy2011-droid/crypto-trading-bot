import { useState, useEffect } from 'react';
import { getUserBalance, getUserPositions, UserBalanceData, UserPositionData } from '@/lib/api';

export function useUserData(userId: number, apiMode: 'live' | 'testnet', enabled: boolean = true) {
  const [balance, setBalance] = useState<UserBalanceData | null>(null);
  const [positions, setPositions] = useState<UserPositionData[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const loadUserData = async () => {
      try {
        const isTestnet = apiMode === 'testnet';
        const [balanceData, positionsData] = await Promise.all([
          getUserBalance(userId, isTestnet).catch(() => null),
          getUserPositions(userId, isTestnet).catch(() => [])
        ]);
        setBalance(balanceData);
        setPositions(positionsData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
    const userDataInterval = setInterval(loadUserData, 30000);
    return () => clearInterval(userDataInterval);
  }, [userId, apiMode, enabled]);

  return { balance, positions };
}