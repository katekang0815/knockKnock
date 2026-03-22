import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

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

      <View style={styles.checkinContainer}>
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
    fontSize: 24,
    fontFamily: 'Jost_400Regular',
    lineHeight: 34,
    textAlign: 'center',
  },
  checkinContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    top: '50%',
    marginTop: -56,
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
