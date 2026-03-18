import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasLaunched').then((value) => {
      setDestination(value ? '/(tabs)' : '/welcome');
    });
  }, []);

  if (!destination) return null;

  return <Redirect href={destination as any} />;
}
