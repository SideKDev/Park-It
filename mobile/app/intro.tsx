import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IntroScreen from '@/components/IntroScreen';

export default function Intro() {
  const handleFinish = async () => {
    await AsyncStorage.setItem('hasSeenIntro', 'true');
    router.replace('/(auth)/login');
  };

  return <IntroScreen onFinish={handleFinish} />;
}
