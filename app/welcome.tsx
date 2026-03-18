import { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, G, Ellipse } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const { width, height } = Dimensions.get('window');

// Door dimensions
const DOOR_WIDTH = 160;
const DOOR_HEIGHT = 240;
const ARCH_RADIUS = DOOR_WIDTH / 2;
const CX = width / 2;
const CY = height / 2;

// Door path: arch top + straight sides
// Starts at bottom-left, goes up left side, arcs over top, down right side, back to bottom-right
const LEFT_X = CX - DOOR_WIDTH / 2;
const RIGHT_X = CX + DOOR_WIDTH / 2;
const BOTTOM_Y = CY + DOOR_HEIGHT / 2;
const STRAIGHT_TOP_Y = CY - DOOR_HEIGHT / 2 + ARCH_RADIUS;

const DOOR_PATH = `
  M ${LEFT_X} ${BOTTOM_Y}
  L ${LEFT_X} ${STRAIGHT_TOP_Y}
  A ${ARCH_RADIUS} ${ARCH_RADIUS} 0 0 1 ${RIGHT_X} ${STRAIGHT_TOP_Y}
  L ${RIGHT_X} ${BOTTOM_Y}
`;

// Approximate total path length for stroke animation
// Left side + half arc + right side
const SIDE_LENGTH = STRAIGHT_TOP_Y - BOTTOM_Y; // negative, but use absolute
const ARC_LENGTH = Math.PI * ARCH_RADIUS;
const TOTAL_LENGTH = Math.abs(SIDE_LENGTH) * 2 + ARC_LENGTH + 20;

// Cloud positions
const CLOUDS = [
  { cx: CX - 30, cy: CY - 20, rx: 28, ry: 14, delay: 3200 },
  { cx: CX + 10, cy: CY + 30, rx: 22, ry: 11, delay: 3500 },
  { cx: CX - 10, cy: CY + 60, rx: 18, ry: 9, delay: 3800 },
];

function navigateToTabs() {
  AsyncStorage.setItem('hasLaunched', 'true').then(() => {
    router.replace('/(tabs)');
  });
}

export default function WelcomeScreen() {
  // Phase 1 & 2: stroke draw animation (0 → full path)
  const strokeOffset = useSharedValue(TOTAL_LENGTH);
  // Phase 3: glow fill opacity
  const glowOpacity = useSharedValue(0);
  // Phase 3: clouds translate Y and opacity
  const cloud1Y = useSharedValue(0);
  const cloud2Y = useSharedValue(0);
  const cloud3Y = useSharedValue(0);
  const cloudOpacity = useSharedValue(0);
  // Transition: screen fade out
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // Phase 1 + 2: draw the door outline over 3s
    strokeOffset.value = withTiming(0, { duration: 3000 });

    // Phase 3: glow appears at 3s
    glowOpacity.value = withDelay(3000, withTiming(0.55, { duration: 600 }));

    // Phase 3: clouds float up
    cloudOpacity.value = withDelay(3200, withTiming(1, { duration: 400 }));
    cloud1Y.value = withDelay(3200, withTiming(-80, { duration: 1200 }));
    cloud2Y.value = withDelay(3500, withTiming(-70, { duration: 1100 }));
    cloud3Y.value = withDelay(3800, withTiming(-60, { duration: 1000 }));

    // Transition: fade out at 4.5s, then navigate
    screenOpacity.value = withDelay(4500, withTiming(0, { duration: 600 }, (finished) => {
      if (finished) runOnJS(navigateToTabs)();
    }));
  }, []);

  const doorAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeOffset.value,
  }));

  const glowAnimatedProps = useAnimatedProps(() => ({
    fillOpacity: glowOpacity.value,
  }));

  const cloud1AnimatedProps = useAnimatedProps(() => ({
    translateY: cloud1Y.value,
    opacity: cloudOpacity.value,
  }));
  const cloud2AnimatedProps = useAnimatedProps(() => ({
    translateY: cloud2Y.value,
    opacity: cloudOpacity.value,
  }));
  const cloud3AnimatedProps = useAnimatedProps(() => ({
    translateY: cloud3Y.value,
    opacity: cloudOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Svg width={width} height={height}>
        {/* Glow fill inside door */}
        <AnimatedPath
          d={DOOR_PATH}
          fill="#00E5CC"
          animatedProps={glowAnimatedProps}
          stroke="none"
        />

        {/* Door outline — drawn with stroke animation */}
        <AnimatedPath
          d={DOOR_PATH}
          fill="none"
          stroke="#00E5CC"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={TOTAL_LENGTH}
          animatedProps={doorAnimatedProps}
        />

        {/* Clouds */}
        <AnimatedG animatedProps={cloud1AnimatedProps}>
          <Ellipse cx={CLOUDS[0].cx} cy={CLOUDS[0].cy} rx={CLOUDS[0].rx} ry={CLOUDS[0].ry} fill="white" opacity={0.9} />
          <Ellipse cx={CLOUDS[0].cx - 14} cy={CLOUDS[0].cy + 4} rx={14} ry={9} fill="white" opacity={0.9} />
          <Ellipse cx={CLOUDS[0].cx + 14} cy={CLOUDS[0].cy + 4} rx={14} ry={9} fill="white" opacity={0.9} />
        </AnimatedG>

        <AnimatedG animatedProps={cloud2AnimatedProps}>
          <Ellipse cx={CLOUDS[1].cx} cy={CLOUDS[1].cy} rx={CLOUDS[1].rx} ry={CLOUDS[1].ry} fill="white" opacity={0.75} />
          <Ellipse cx={CLOUDS[1].cx - 10} cy={CLOUDS[1].cy + 3} rx={11} ry={7} fill="white" opacity={0.75} />
          <Ellipse cx={CLOUDS[1].cx + 10} cy={CLOUDS[1].cy + 3} rx={11} ry={7} fill="white" opacity={0.75} />
        </AnimatedG>

        <AnimatedG animatedProps={cloud3AnimatedProps}>
          <Ellipse cx={CLOUDS[2].cx} cy={CLOUDS[2].cy} rx={CLOUDS[2].rx} ry={CLOUDS[2].ry} fill="white" opacity={0.6} />
          <Ellipse cx={CLOUDS[2].cx - 8} cy={CLOUDS[2].cy + 3} rx={10} ry={6} fill="white" opacity={0.6} />
          <Ellipse cx={CLOUDS[2].cx + 8} cy={CLOUDS[2].cy + 3} rx={10} ry={6} fill="white" opacity={0.6} />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
