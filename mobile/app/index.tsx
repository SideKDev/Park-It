import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function Index() {
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    // Clear the flag for testing - remove this line later
    AsyncStorage.removeItem('hasSeenIntro');
    checkIntro();
  }, []);

  const checkIntro = async () => {
    const seen = await AsyncStorage.getItem('hasSeenIntro');
    setHasSeenIntro(seen === 'true');
  };

  if (hasSeenIntro === null) return null;

  if (!hasSeenIntro) {
    return <Redirect href="/intro" />;
  }

  return <Redirect href="/(auth)/login" />;
}
