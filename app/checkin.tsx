import { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import BouncingOrb from '@/components/BouncingOrb';
import VibratingOrb from '@/components/VibratingOrb';
import RollingOrb from '@/components/RollingOrb';

const { height: SCREEN_H } = Dimensions.get('window');

const ICON_SIZE = 180;

// The four major emotions, ordered unpleasant → pleasant around the arc.
// `render` draws the icon (each keeps its own ball + base-text animation).
const EMOTIONS: { category: string; render: (s: number) => React.ReactNode }[] = [
  { category: 'Stormy', render: (s) => <VibratingOrb size={s} /> },
  { category: 'Calm',   render: (s) => <RollingOrb size={s} /> },
  { category: 'Breezy', render: (s) => <RollingOrb size={s} fadeBall={false} /> },
  { category: 'Sunny',  render: (s) => <BouncingOrb size={s} /> },
];

const SECTIONS = EMOTIONS.length;
// Breeze is the default selection when the screen opens.
const DEFAULT_INDEX = EMOTIONS.findIndex((e) => e.category === 'Breezy');

// Circular track geometry.
const RING_R = ICON_SIZE / 2 + 16;      // arc radius, just outside the icon
const STROKE = 3;                        // arc thickness
const THUMB = 22;                        // dot diameter
const HALO = 44;                         // glow diameter behind the dot
const CANVAS = (RING_R + 30) * 2;        // square that holds the ring + thumb
const C = CANVAS / 2;                     // center of the canvas
const SWEEP = 280;                        // arc sweep in degrees (80° gap at bottom)
const RAD = Math.PI / 180;

// A point on the arc for parameter t ∈ [0,1] (0 = bottom-left end, 1 = bottom-right).
function arcPoint(t: number) {
  const a = (t - 0.5) * SWEEP * RAD; // angle from the top, clockwise
  return { x: C + RING_R * Math.sin(a), y: C - RING_R * Math.cos(a) };
}
const P0 = arcPoint(0);
const P1 = arcPoint(1);
const ARC_D = `M ${P0.x.toFixed(2)} ${P0.y.toFixed(2)} A ${RING_R} ${RING_R} 0 1 1 ${P1.x.toFixed(2)} ${P1.y.toFixed(2)}`;

function clampWorklet(v: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(DEFAULT_INDEX);

  // Position along the arc, 0..1. Starts at the center of the default section.
  const t = useSharedValue((DEFAULT_INDEX + 0.5) / SECTIONS);

  const pan = Gesture.Pan()
    .onBegin((e) => {
      const deg = Math.atan2(e.x - C, C - e.y) / RAD; // 0 = top, + clockwise
      t.value = clampWorklet(deg / SWEEP + 0.5, 0, 1);
    })
    .onUpdate((e) => {
      const deg = Math.atan2(e.x - C, C - e.y) / RAD;
      t.value = clampWorklet(deg / SWEEP + 0.5, 0, 1);
    })
    .onEnd(() => {
      const idx = clampWorklet(Math.floor(t.value * SECTIONS), 0, SECTIONS - 1);
      t.value = withTiming((idx + 0.5) / SECTIONS, { duration: 160 });
    });

  // Which section the thumb is over (live, while dragging).
  const index = useDerivedValue(() =>
    clampWorklet(Math.floor(t.value * SECTIONS), 0, SECTIONS - 1),
  );

  useAnimatedReaction(
    () => index.value,
    (cur, prev) => {
      if (cur !== prev) runOnJS(setActive)(cur);
    },
  );

  const thumbStyle = useAnimatedStyle(() => {
    const a = (t.value - 0.5) * SWEEP * RAD;
    const x = C + RING_R * Math.sin(a);
    const y = C - RING_R * Math.cos(a);
    return { transform: [{ translateX: x - THUMB / 2 }, { translateY: y - THUMB / 2 }] };
  });

  const haloStyle = useAnimatedStyle(() => {
    const a = (t.value - 0.5) * SWEEP * RAD;
    const x = C + RING_R * Math.sin(a);
    const y = C - RING_R * Math.cos(a);
    return { transform: [{ translateX: x - HALO / 2 }, { translateY: y - HALO / 2 }] };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Back arrow */}
      <TouchableOpacity
        style={[styles.backArrow, { top: insets.top + 16 }]}
        onPress={() => router.back()}
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

      <Text style={[styles.title, { top: insets.top + 80 }]}>How are you today?</Text>

      {/* Circular track + draggable thumb, centered on the icon */}
      <GestureDetector gesture={pan}>
        <View style={[styles.ring, { top: SCREEN_H * 0.42 - CANVAS / 2 }]}>
          <Svg width={CANVAS} height={CANVAS}>
            <Defs>
              <LinearGradient id="ringGrad" x1="0" y1={C} x2={CANVAS} y2={C} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#C78E7D" />
                <Stop offset="0.5" stopColor="#FFF7CE" />
                <Stop offset="1" stopColor="#DB533C" />
              </LinearGradient>
            </Defs>
            <Path
              d={ARC_D}
              stroke="url(#ringGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          {/* soft glow halo behind the dot */}
          <Animated.View style={[styles.halo, haloStyle]} />
          {/* the dot */}
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>

      {/* Selected emotion icon — centered inside the ring */}
      <TouchableOpacity
        style={[styles.iconArea, { top: SCREEN_H * 0.42 - ICON_SIZE / 2 }]}
        activeOpacity={0.85}
        onPress={() =>
          router.push({ pathname: '/subemotions', params: { category: EMOTIONS[active].category } })
        }
      >
        {EMOTIONS[active].render(ICON_SIZE)}
      </TouchableOpacity>
    </GestureHandlerRootView>
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
    fontSize: 24,
    fontFamily: 'Jost_700Bold',
    lineHeight: 34,
    textAlign: 'center',
  },
  ring: {
    position: 'absolute',
    alignSelf: 'center',
    width: CANVAS,
    height: CANVAS,
  },
  iconArea: {
    position: 'absolute',
    alignSelf: 'center',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  halo: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: 'rgba(199,142,125,0.22)',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#DB533C',
    shadowColor: '#DB533C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
