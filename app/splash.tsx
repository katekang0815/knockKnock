import { useRef, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { markSplashShown } from '@/utils/session';

function navigateToHome() {
  markSplashShown();
  router.replace('/(tabs)');
}

export default function SplashScreen() {
  const lottieRef = useRef<LottieView>(null);
  const insets = useSafeAreaInsets();

  const handleReplay = useCallback(() => {
    lottieRef.current?.reset();
    lottieRef.current?.play();
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        source={require('../assets/splash.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />

      {/* Knock Knock text */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Knock Knock</Text>
      </View>

      {/* Icon buttons overlay */}
      <View style={[styles.buttonsContainer, { bottom: insets.bottom + 60 }]}>
        {/* Replay icon */}
        <TouchableOpacity style={styles.iconButton} onPress={handleReplay}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
              fill="#FFFFFF"
            />
          </Svg>
        </TouchableOpacity>

        {/* Next arrow icon */}
        <TouchableOpacity style={styles.iconButton} onPress={navigateToHome}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
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
  titleContainer: {
    position: 'absolute',
    bottom: '18%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontFamily: 'Jost_700Bold',
    letterSpacing: 2,
  },
  buttonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
