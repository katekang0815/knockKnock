import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import OrbitingShapes from '@/components/OrbitingShapes';

const { height: SCREEN_H } = Dimensions.get('window');
const SHAPE_SIZE = 120;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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

      {/* Morphing shapes — centered above the button */}
      <View style={[styles.shapeContainer, { bottom: SCREEN_H / 3 + 40 }]}>
        <OrbitingShapes size={SHAPE_SIZE} />
      </View>

      {/* Plus button — 1/3 from bottom */}
      <View style={[styles.buttonContainer, { bottom: insets.bottom + SCREEN_H / 3 - 60 }]}>
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
  shapeContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
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
