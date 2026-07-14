import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import EmotionCircle from '@/components/EmotionCircle';

const { width } = Dimensions.get('window');

const CONTAINER_PADDING = 24;
const CONTAINER_W = width - CONTAINER_PADDING * 2;

// Circle grid layout — two columns, gap between.
const CIRCLE_GAP = 20;
const CIRCLE_SIZE = Math.min(160, (CONTAINER_W - CIRCLE_GAP) / 2);

// The four Mood-Meter quadrants, rendered with the same frosted EmotionCircle
// used on the sub-emotions screen for visual continuity.
//   `seed`     — an emotion word whose palette/hotspot the circle reproduces
//   `category` — drives the color palette AND the navigation target (subemotions
//                depends on these keys)
//   `label`    — the quadrant caption shown inside the circle
type Quadrant = { seed: string; category: string; label: string };

const QUADRANTS: Quadrant[] = [
  // High Energy Unpleasant (red/steel — Worried's look)
  { seed: 'Worried',    category: 'Stormy', label: 'High Energy\nUnpleasant' },
  // High Energy Pleasant (coral/cream — Successful's look)
  { seed: 'Successful', category: 'Sunny',  label: 'High Energy\nPleasant' },
  // Low Energy Unpleasant (teal/coral — Depressed's look)
  { seed: 'Depressed',  category: 'Calm',   label: 'Low Energy\nUnpleasant' },
  // Low Energy Pleasant (teal/mint — Thankful's look)
  { seed: 'Thankful',   category: 'Breezy', label: 'Low Energy\nPleasant' },
];

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
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

      <View style={styles.content}>
        <Text style={styles.title}>
          How are you today?
        </Text>

        {/* 2×2 grid — one frosted circle per Mood-Meter quadrant */}
        <View style={styles.grid}>
          {QUADRANTS.map((q) => (
            <EmotionCircle
              key={q.category}
              label={q.seed}
              displayLabel={q.label}
              labelLines={2}
              category={q.category}
              size={CIRCLE_SIZE}
              onPress={() => router.push({ pathname: '/subemotions', params: { category: q.category } })}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: CONTAINER_PADDING,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Jost_700Bold',
    lineHeight: 34,
    marginTop: '40%',
    marginBottom: 40,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: CIRCLE_GAP,
    rowGap: CIRCLE_GAP,
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
