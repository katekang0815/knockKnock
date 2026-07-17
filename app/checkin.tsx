import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import BouncingOrb from '@/components/BouncingOrb';
import VibratingOrb from '@/components/VibratingOrb';
import RollingOrb from '@/components/RollingOrb';

const { width } = Dimensions.get('window');

const CONTAINER_PADDING = 24;
const CONTAINER_W = width - CONTAINER_PADDING * 2;

// Placeholder circle grid — two columns.
const CIRCLE_GAP = 20;
const CIRCLE_SIZE = Math.min(160, (CONTAINER_W - CIRCLE_GAP) / 2);

// The four Mood-Meter quadrants, shown as plain round placeholders for now.
//   `category` — the navigation target (subemotions depends on these keys)
//   `label`    — the quadrant caption shown inside the circle
const QUADRANTS = [
  { category: 'Stormy', label: 'High Energy\nUnpleasant' },
  { category: 'Sunny',  label: 'High Energy\nPleasant' },
  { category: 'Calm',   label: 'Low Energy\nUnpleasant' },
  { category: 'Breezy', label: 'Low Energy\nPleasant' },
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

        {/* 2×2 grid — Sunny gets the bouncing orb; the rest stay placeholders */}
        <View style={styles.grid}>
          {QUADRANTS.map((q) => (
            <TouchableOpacity
              key={q.category}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/subemotions', params: { category: q.category } })}
              style={styles.slot}
            >
              {q.category === 'Sunny' ? (
                <BouncingOrb size={CIRCLE_SIZE} />
              ) : q.category === 'Stormy' ? (
                <VibratingOrb size={CIRCLE_SIZE} />
              ) : q.category === 'Calm' ? (
                <RollingOrb size={CIRCLE_SIZE} />
              ) : q.category === 'Breezy' ? (
                <RollingOrb size={CIRCLE_SIZE} fadeBall={false} />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderLabel}>{q.label}</Text>
                </View>
              )}
            </TouchableOpacity>
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
    marginBottom: 80,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: CIRCLE_GAP,
    rowGap: CIRCLE_GAP,
  },
  slot: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  placeholder: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  placeholderLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
