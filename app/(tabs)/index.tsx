import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

function CloudShape({ scale = 1 }: { scale?: number }) {
  const s = scale;
  return (
    <View style={{ position: 'relative', width: 100 * s, height: 50 * s }}>
      <View style={[styles.cloudBody, { width: 60 * s, height: 30 * s, left: 20 * s, top: 20 * s, borderRadius: 15 * s }]} />
      <View style={[styles.cloudPuff, { width: 40 * s, height: 40 * s, left: 10 * s, top: 8 * s }]} />
      <View style={[styles.cloudPuff, { width: 35 * s, height: 35 * s, left: 47 * s, top: 10 * s }]} />
      <View style={[styles.cloudPuffSm, { width: 28 * s, height: 28 * s, left: 0, top: 18 * s }]} />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const cloud1X = useSharedValue(-120);
  const cloud2X = useSharedValue(-200);

  useEffect(() => {
    cloud1X.value = withRepeat(
      withTiming(width + 120, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    cloud2X.value = withDelay(
      3000,
      withRepeat(
        withTiming(width + 200, { duration: 6000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [cloud1X, cloud2X]);

  const cloud1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: cloud1X.value }],
  }));
  const cloud2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: cloud2X.value }],
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => router.replace('/splash')}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Splash</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { top: insets.top + 20 }]}>
        Knock Knock
      </Text>

      <Animated.View style={[styles.cloud1, cloud1Style]}>
        <CloudShape scale={1.2} />
      </Animated.View>
      <Animated.View style={[styles.cloud2, cloud2Style]}>
        <CloudShape scale={0.9} />
      </Animated.View>

      <View style={[styles.checkinContainer, { bottom: insets.bottom + height * 0.15 }]}>
        <TouchableOpacity style={styles.checkinButton} activeOpacity={0.8}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.checkinLabel}>Check in</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  title: {
    position: 'absolute',
    right: 28,
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: Platform.select({ ios: 'ui-serif', default: 'serif' }),
    fontWeight: '300',
    letterSpacing: 2,
  },
  cloud1: {
    position: 'absolute',
    top: height * 0.28,
  },
  cloud2: {
    position: 'absolute',
    top: height * 0.38,
  },
  checkinContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
  },
  checkinButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '200',
    lineHeight: 36,
    marginTop: -2,
  },
  checkinLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 1.5,
    marginTop: 10,
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  cloudBody: {
    position: 'absolute',
    backgroundColor: 'white',
    opacity: 0.9,
  },
  cloudPuff: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 999,
    opacity: 0.9,
  },
  cloudPuffSm: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 999,
    opacity: 0.85,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 1,
  },
});
