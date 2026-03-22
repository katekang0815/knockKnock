import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

const RING_SIZE = 200;
const RING_STROKE = 24;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CENTER = RING_SIZE / 2;

// Build smooth fading arc
const SEGMENT_COUNT = 80;
const ARC_DEGREES = 270;
const SEGMENT_SPAN = ARC_DEGREES / SEGMENT_COUNT;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcSegment(startAngle: number, endAngle: number) {
  const start = polarToCartesian(CENTER, CENTER, RING_RADIUS, startAngle);
  const end = polarToCartesian(CENTER, CENTER, RING_RADIUS, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RING_RADIUS} ${RING_RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
  const startAngle = i * SEGMENT_SPAN;
  const endAngle = startAngle + SEGMENT_SPAN + 1; // overlap to prevent gaps
  const progress = i / (SEGMENT_COUNT - 1);
  const opacity = Math.pow(progress, 1.5); // smooth falloff
  return { d: buildArcSegment(startAngle, endAngle), opacity };
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Back arrow */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => router.replace('/splash')}
        activeOpacity={0.7}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      <Text style={[styles.title, { top: insets.top + 20 + 96 }]}>
        Let{`'`}s check in your{'\n'}daily devotional!
      </Text>

      <View style={styles.checkinContainer}>
        {/* Animated loading ring */}
        <Animated.View style={[styles.ringContainer, rotateStyle]}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {segments.map((seg, i) => (
              <Path
                key={i}
                d={seg.d}
                stroke="#555555"
                strokeWidth={RING_STROKE}
                strokeLinecap={i === 0 || i === SEGMENT_COUNT - 1 ? 'round' : 'butt'}
                strokeOpacity={seg.opacity}
                fill="none"
              />
            ))}
          </Svg>
        </Animated.View>

        {/* Plus button centered on top of ring */}
        <TouchableOpacity style={styles.checkinButton} activeOpacity={0.8} onPress={() => router.push('/checkin')}>
          <Text style={styles.plusText}>+</Text>
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
  title: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Jost_700Bold',
    lineHeight: 34,
    textAlign: 'center',
  },
  checkinContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    marginTop: -(RING_SIZE / 2),
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringContainer: {
    position: 'absolute',
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
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
