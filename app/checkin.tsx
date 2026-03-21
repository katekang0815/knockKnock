import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import SunnyIcon from '@/components/SunnyIcon';
import StormyIcon from '@/components/StormyIcon';
import RainIcon from '@/components/RainIcon';
import BreezeIcon from '@/components/BreezeIcon';

const { width } = Dimensions.get('window');
const CARD_GAP = 8;
const CARD_SIZE = (width - 48 - CARD_GAP) / 2;

const CATEGORIES = [
  { label: 'Sunny', color: '#F5C842' },
  { label: 'Stormy', color: '#E8614D' },
  { label: 'Calm', color: '#8B7BE8' },
  { label: 'Breezy', color: '#7BC88E' },
];

export default function CheckInScreen() {
  return (
    <View style={styles.container}>
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
              onPress={() => router.push({ pathname: '/subemotions', params: { category: cat.label } })}
            >
              {cat.label === 'Sunny' ? (
                <SunnyIcon size={CARD_SIZE * 0.7} />
              ) : cat.label === 'Stormy' ? (
                <StormyIcon size={CARD_SIZE * 0.7} />
              ) : cat.label === 'Calm' ? (
                <RainIcon size={CARD_SIZE * 0.7} />
              ) : (
                <BreezeIcon size={CARD_SIZE * 0.7} />
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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Jost_400Regular',
    lineHeight: 34,
    marginBottom: 42,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
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
