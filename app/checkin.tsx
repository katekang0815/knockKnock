import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import WalkingIcon from '@/components/WalkingIcon';
import CalmBeachIcon from '@/components/CalmBeachIcon';

const { width } = Dimensions.get('window');

const CONTAINER_PADDING = 24;
const CARD_GAP = 12;
const CARD_SIZE = (width - CONTAINER_PADDING * 2 - CARD_GAP) / 2;

const CATEGORIES = [
  { label: 'Sunny' },
  { label: 'Stormy' },
  { label: 'Calm' },
  { label: 'Breezy' },
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
          How are you feeling today?
        </Text>

        {/* 2x2 grid of placeholder buttons */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={[styles.card, cat.label === 'Calm' && styles.cardNoBorder]}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/subemotions', params: { category: cat.label } })}
            >
              {cat.label === 'Sunny' && <WalkingIcon size={CARD_SIZE * 0.7} />}
              {cat.label === 'Calm' && (
                <View style={[StyleSheet.absoluteFill, styles.cardClip]}>
                  <CalmBeachIcon size={CARD_SIZE} borderRadius={24} />
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
    marginTop: '30%',
    marginBottom: 96,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    justifyContent: 'center',
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNoBorder: {
    borderWidth: 0,
  },
  cardClip: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
