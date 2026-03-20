import { useRef, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { markSplashShown } from '@/utils/session';

function navigateToHome() {
  markSplashShown();
  router.replace('/(tabs)');
}

export default function SplashScreen() {
  const lottieRef = useRef<LottieView>(null);

  const handleReplay = useCallback(() => {
    lottieRef.current?.reset();
    lottieRef.current?.play();
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        source={require('../assets/splash-animation.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />

      {/* Buttons overlay */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
          <Text style={styles.buttonText}>Replay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={navigateToHome}>
          <Text style={styles.nextButtonText}>Next</Text>
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
  buttonsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  replayButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#5B9BD5',
  },
  nextButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: '#5B9BD5',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
