import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { markSplashShown } from '@/utils/session';

function navigateToHome() {
  markSplashShown();
  router.replace('/(tabs)');
}

export default function SplashScreen() {
  // Auto-advance to the main screen after 3 seconds.
  useEffect(() => {
    const timer = setTimeout(navigateToHome, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/splash.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />

      {/* Covers the Jitter.video watermark in the bottom-right corner.
          Adjust width / height / bottom / right once the Jitter animation is swapped in. */}
      <View pointerEvents="none" style={styles.watermarkCover} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  animation: {
    flex: 1,
  },
  watermarkCover: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    width: 200,
    height: 80,
    backgroundColor: '#000000',
  },
});
