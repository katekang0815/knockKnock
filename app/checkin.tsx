import { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

const { width, height: SCREEN_H } = Dimensions.get('window');

const CONTAINER_PADDING = 24;
const ICON_SIZE = 180;

// The four major emotions, ordered unpleasant → pleasant across the bar.
// `render` draws the icon (each keeps its own ball + base-text animation).
const EMOTIONS: { category: EmotionCategory; render: (s: number) => React.ReactNode }[] = [
  { category: 'Stormy', render: (s) => <VibratingOrb size={s} /> },
  { category: 'Calm',   render: (s) => <RollingOrb size={s} /> },
  { category: 'Breezy', render: (s) => <RollingOrb size={s} fadeBall={false} /> },
  { category: 'Sunny',  render: (s) => <BouncingOrb size={s} /> },
];

const SECTIONS = EMOTIONS.length;
// Breeze is the default selection when the screen opens.
const DEFAULT_INDEX = EMOTIONS.findIndex((e) => e.category === 'Breezy');
// Twice the side space of CONTAINER_PADDING (24 → 48 on each side).
const BAR_W = ((width - CONTAINER_PADDING * 4) * 2) / 3;
const SECTION_W = BAR_W / SECTIONS;
const LINE_H = 3;   // track line thickness
const THUMB = 22;   // dot diameter
const HALO = 56;    // soft glow diameter behind the dot

// Sub-emotion grid — 3 columns × 5 rows, fitted between the icon and the track.
const GRID_PAD = 44;
const GRID_COL_GAP = 12;
const GRID_ROW_GAP = 8;
const GRID_W = width - GRID_PAD * 2;
const CARD_W = (GRID_W - GRID_COL_GAP * 2) / 3 - 1; // −1 for sub-pixel 3-column fit
const GRID_TOP = SCREEN_H * 0.42 + ICON_SIZE / 2 + 16; // just below the icon (unchanged)
const TRACK_TOP = SCREEN_H * 0.82 - 6; // the track's top on screen (bottom: 0.18H−50, height HALO)
const CARD_H = (TRACK_TOP - 16 - GRID_TOP - GRID_ROW_GAP * 4) / 5; // fit 5 rows in the gap

function clampWorklet(v: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(DEFAULT_INDEX);

  const category = EMOTIONS[active].category;
  // 3 columns × 5 rows = 15 sub-emotions of the selected category.
  const subEmotions = EMOTION_DATA[category].subEmotions.slice(0, 15);

  // Thumb center X within the bar. Starts at the center of the default section.
  const thumbC = useSharedValue((DEFAULT_INDEX + 0.5) * SECTION_W);

  const minC = THUMB / 2;
  const maxC = BAR_W - THUMB / 2;

  const pan = Gesture.Pan()
    .onBegin((e) => {
      thumbC.value = clampWorklet(e.x, minC, maxC);
    })
    .onUpdate((e) => {
      thumbC.value = clampWorklet(e.x, minC, maxC);
    })
    .onEnd(() => {
      const idx = clampWorklet(Math.floor(thumbC.value / SECTION_W), 0, SECTIONS - 1);
      thumbC.value = withTiming((idx + 0.5) * SECTION_W, { duration: 160 });
    });

  // Which section the thumb is over (live, while dragging).
  const index = useDerivedValue(() =>
    clampWorklet(Math.floor(thumbC.value / SECTION_W), 0, SECTIONS - 1),
  );

  useAnimatedReaction(
    () => index.value,
    (cur, prev) => {
      if (cur !== prev) runOnJS(setActive)(cur);
    },
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbC.value - THUMB / 2 }],
  }));

  // Filled portion of the line, left of the dot.
  const activeStyle = useAnimatedStyle(() => ({
    width: thumbC.value,
  }));

  // Soft glow behind the dot, riding with it.
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbC.value - HALO / 2 }],
  }));

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

      {/* Selected emotion icon — a bit above center, scaling with screen height */}
      <TouchableOpacity
        style={[styles.iconArea, { top: SCREEN_H * 0.42 - ICON_SIZE / 2 }]}
        activeOpacity={0.85}
        onPress={() =>
          router.push({ pathname: '/subemotions', params: { category: EMOTIONS[active].category } })
        }
      >
        {EMOTIONS[active].render(ICON_SIZE)}
      </TouchableOpacity>

      {/* Sub-emotions of the selected category — 3 × 5 outlined cards */}
      <View style={styles.grid}>
        {subEmotions.map((word) => (
          <TouchableOpacity
            key={word}
            style={styles.card}
            activeOpacity={0.6}
            onPress={() =>
              router.push({ pathname: '/emotionlog', params: { emotion: word, category } })
            }
          >
            <Text numberOfLines={1} style={styles.cardText}>
              {word}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Thin line + glowing dot; drag anywhere to move, snaps to four sections */}
      <GestureDetector gesture={pan}>
        <View style={[styles.barWrap, { bottom: SCREEN_H * 0.18 - 50 }]}>
          {/* faded dotted line (inactive, right of the dot) */}
          <View style={styles.trackBase} />
          {/* solid line (active, left of the dot) */}
          <Animated.View style={[styles.trackActive, activeStyle]} />
          {/* soft glow halo behind the dot */}
          <Animated.View style={[styles.halo, haloStyle]} />
          {/* the dot */}
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
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
  iconArea: {
    position: 'absolute',
    alignSelf: 'center',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  grid: {
    position: 'absolute',
    top: GRID_TOP,
    left: GRID_PAD,
    width: GRID_W,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_COL_GAP,
    rowGap: GRID_ROW_GAP,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Jost_700Bold',
    textAlign: 'center',
  },
  barWrap: {
    position: 'absolute',
    alignSelf: 'center',
    width: BAR_W,
    height: HALO,
    justifyContent: 'center',
  },
  trackBase: {
    position: 'absolute',
    left: 0,
    width: BAR_W,
    top: HALO / 2 - 1,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dotted',
    borderColor: 'rgba(219,83,60,0.4)',
  },
  trackActive: {
    position: 'absolute',
    left: 0,
    top: (HALO - LINE_H) / 2,
    height: LINE_H,
    borderRadius: LINE_H / 2,
    backgroundColor: '#DB533C',
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
    top: (HALO - THUMB) / 2,
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
