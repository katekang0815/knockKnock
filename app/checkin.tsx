import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_SIZE = (width - 48 - CARD_GAP) / 2;

const CATEGORIES = [
  { label: 'Sunny', color: '#F5C842' },
  { label: 'Stormy', color: '#E8614D' },
  { label: 'Calm', color: '#8B7BE8' },
  { label: 'Breezy', color: '#7BC88E' },
];

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { top: insets.top + 12 }]}>MajorEmotions</Text>

      <View style={styles.content}>
        <Text style={styles.title}>
          Tap the weather of your{'\n'}mind at this moment
        </Text>

        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={styles.card}
              activeOpacity={0.7}
            >
              <View style={[styles.placeholder, { backgroundColor: cat.color }]} />
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
  header: {
    position: 'absolute',
    left: 20,
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Jost_400Regular',
    lineHeight: 34,
    marginBottom: 48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.85,
  },
});
