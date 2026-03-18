import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasShownSplash } from '@/utils/session';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasLaunched').then((value) => {
      if (!value) {
        setDestination('/welcome');
      } else if (!hasShownSplash()) {
        setDestination('/splash');
      } else {
        setDestination('/(tabs)');
      }
    });
  }, []);

  if (!destination) return null;

  return <Redirect href={destination as any} />;
}
