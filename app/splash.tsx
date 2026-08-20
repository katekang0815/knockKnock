import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { markSplashShown } from '@/utils/session';

function navigateToHome() {
  markSplashShown();
  router.replace('/(tabs)');
}

export default function SplashScreen() {
  // Grow-from-center on app open: scale + fade the content in.
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    // Auto-advance to the main screen after 3 seconds.
    const timer = setTimeout(navigateToHome, 3000);
    return () => clearTimeout(timer);
  }, []);

  const growStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animation, growStyle]}>
        <LottieView
          source={require('../assets/splash.json')}
          autoPlay
          loop={false}
          style={styles.animation}
        />
      </Animated.View>

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
