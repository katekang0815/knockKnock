import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
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
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

function Cloud1({ scale = 1 }: { scale?: number }) {
  const w = 126 * scale;
  const h = 53 * scale;
  return (
    <Svg width={w} height={h} viewBox="0 0 126 53" fill="none">
      <Defs>
        <LinearGradient id="cloud1Grad" x1="62.4999" y1="1.5" x2="62.9999" y2="44.5" gradientUnits="userSpaceOnUse">
          <Stop offset="0.256" stopColor="#7AA2FC" />
          <Stop offset="1" stopColor="#E9E9E9" />
        </LinearGradient>
      </Defs>
      <Path
        d="M62.0632 41.7638C67.3982 44.5724 71.6077 45.5943 77.3206 43.0253C79.1895 42.1545 80.7872 40.4401 82.4378 39.237C85.9174 36.7009 91.1859 37.1099 94.7729 39.0797C97.0668 40.3397 99.3343 42.4387 101.926 42.9041C105.529 43.5511 109.786 43.8178 113.18 41.9602C116.772 40.0312 118.899 36.9741 120.407 32.5764C121.834 28.4173 121.858 21.9898 120.512 17.836C118.905 12.8804 116.516 9.98282 112.524 7.95209C107.883 5.59154 102.537 6.20954 97.6452 6.93816C95.6027 7.29338 93.4888 8.12217 91.4688 8.5088C88.6979 9.03933 85.3306 9.08516 82.5292 8.76792C79.5282 8.42802 76.2916 5.43233 73.7859 3.52206C70.212 0.797266 66.5285 0.291091 62.4427 0.566306C60.6228 0.785615 56.5585 2.02238 54.846 2.88652C51.4795 4.58508 47.2246 8.04871 43.4878 8.4182C37.5589 9.00437 31.7571 3.93541 26.0874 2.36634C23.9195 1.76641 20.267 1.73289 18.1419 2.06362C14.3772 2.62741 10.9109 4.90887 8.52692 8.62952C5.81493 12.8621 4.10702 19.9097 4.57778 25.308C5.8591 40.0023 20.6698 44.762 30.5954 43.0879C32.8712 42.704 36.0795 40.8875 38.2062 39.6959C38.5882 39.4819 39.024 39.3243 39.4166 39.1351C47.2712 34.5165 54.6089 37.2741 61.9631 41.7044C61.9965 41.7243 62.0298 41.744 62.0632 41.7638Z"
        fill="url(#cloud1Grad)"
        fillOpacity={0.3}
        stroke="#FFFEFE"
        strokeWidth={1}
      />
    </Svg>
  );
}

function Cloud2({ scale = 1 }: { scale?: number }) {
  const w = 128 * scale;
  const h = 56 * scale;
  return (
    <Svg width={w} height={h} viewBox="0 0 128 56" fill="none">
      <Defs>
        <LinearGradient id="cloud2Grad" x1="13" y1="18" x2="121" y2="47.5" gradientUnits="userSpaceOnUse">
          <Stop stopColor="white" />
          <Stop offset="1" stopColor="#7CB1FB" />
        </LinearGradient>
      </Defs>
      <Path
        d="M61.5632 44.7638C66.8982 47.5724 71.1078 48.5943 76.8207 46.0253C78.6896 45.1545 80.2873 43.4401 81.9379 42.237C85.4174 39.7009 90.686 40.1099 94.273 42.0797C96.5668 43.3397 98.8343 45.4387 101.426 45.9041C105.029 46.5511 109.286 46.8178 112.68 44.9602C116.272 43.0312 118.399 39.9741 119.907 35.5764C121.334 31.4173 121.358 24.9898 120.012 20.836C118.405 15.8804 116.016 12.9828 112.024 10.9521C107.383 8.59154 102.037 9.20954 97.1453 9.93816C95.1028 10.2934 92.9888 11.1222 90.9689 11.5088C88.198 12.0393 84.8307 12.0852 82.0293 11.7679C79.0283 11.428 75.7917 8.43233 73.286 6.52206C69.712 3.79727 66.0286 3.29109 61.9428 3.56631C60.1229 3.78561 56.0586 5.02238 54.346 5.88652C50.9795 7.58508 46.7247 11.0487 42.9879 11.4182C37.059 12.0044 31.2572 6.93541 25.5874 5.36634C23.4196 4.76641 19.767 4.73289 17.642 5.06362C13.8772 5.62741 10.4109 7.90887 8.02698 11.6295C5.31499 15.8621 3.60708 22.9097 4.07784 28.308C5.35916 43.0023 20.1698 47.762 30.0954 46.0879C32.3713 45.704 35.5796 43.8875 37.7063 42.6959C38.0883 42.4819 38.524 42.3243 38.9166 42.1351C46.7713 37.5165 54.109 40.2741 61.4632 44.7044C61.4965 44.7243 61.5299 44.744 61.5632 44.7638Z"
        fill="url(#cloud2Grad)"
      />
      <Path
        d="M63.5632 41.7638C68.8982 44.5724 73.1078 45.5943 78.8207 43.0253C80.6896 42.1545 82.2873 40.4401 83.9379 39.237C87.4174 36.7009 92.686 37.1099 96.273 39.0797C98.5668 40.3397 100.834 42.4387 103.426 42.9041C107.029 43.5511 111.286 43.8178 114.68 41.9602C118.272 40.0312 120.399 36.9741 121.907 32.5764C123.334 28.4173 123.358 21.9898 122.012 17.836C120.405 12.8804 118.016 9.98282 114.024 7.95209C109.383 5.59154 104.037 6.20954 99.1453 6.93816C97.1028 7.29338 94.9888 8.12217 92.9689 8.5088C90.198 9.03933 86.8307 9.08516 84.0293 8.76792C81.0283 8.42802 77.7917 5.43233 75.286 3.52206C71.712 0.797266 68.0286 0.291091 63.9428 0.566306C62.1229 0.785615 58.0586 2.02238 56.346 2.88652C52.9795 4.58508 48.7247 8.04871 44.9879 8.4182C39.059 9.00437 33.2572 3.93541 27.5874 2.36634C25.4196 1.76641 21.767 1.73289 19.642 2.06362C15.8772 2.62741 12.4109 4.90887 10.027 8.62952C7.31499 12.8621 5.60708 19.9097 6.07784 25.308C7.35916 40.0023 22.1698 44.762 32.0954 43.0879C34.3713 42.704 37.5796 40.8875 39.7063 39.6959C40.0883 39.4819 40.524 39.3243 40.9166 39.1351C48.7713 34.5165 56.109 37.2741 63.4632 41.7044C63.4965 41.7243 63.5299 41.744 63.5632 41.7638Z"
        stroke="#FFFEFE"
        strokeWidth={1}
      />
    </Svg>
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

      <Text style={[styles.title, { top: insets.top + 20 + 96 }]}>
        Knock Knock
      </Text>

      <Animated.View style={[styles.cloud1, cloud1Style]}>
        <Cloud1 scale={1.2} />
      </Animated.View>
      <Animated.View style={[styles.cloud2, cloud2Style]}>
        <Cloud2 scale={0.9} />
      </Animated.View>

      <View style={styles.checkinContainer}>
        <TouchableOpacity style={styles.checkinButton} activeOpacity={0.8}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.checkinLabel}>Check In</Text>
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
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 36,
    fontFamily: 'Jost_700Bold',
    letterSpacing: 3,
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
    top: '50%',
    marginTop: -36,
  },
  checkinButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '200',
    lineHeight: 36,
    marginTop: -2,
  },
  checkinLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    letterSpacing: 2,
    marginTop: 12,
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
