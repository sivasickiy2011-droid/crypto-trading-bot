import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getUserLanguage, setUserLanguage } from '@/lib/api';

interface LanguageSwitcherProps {
  userId: number;
}

export default function LanguageSwitcher({ userId }: LanguageSwitcherProps) {
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');

  useEffect(() => {
    getUserLanguage(userId).then(result => {
      if (result.success) {
        setLanguage(result.language as 'ru' | 'en');
      }
    }).catch(() => {});
  }, [userId]);

  const toggleLanguage = async () => {
    const newLang = language === 'ru' ? 'en' : 'ru';
    try {
      await setUserLanguage(userId, newLang);
      setLanguage(newLang);
    } catch (error) {
      console.error('Failed to update language');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="text-sm font-mono"
    >
      {language === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
    </Button>
  );
}
