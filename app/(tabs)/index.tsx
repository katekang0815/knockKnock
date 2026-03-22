import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.backButton, { bottom: insets.bottom + 24 }]}
        onPress={() => router.replace('/splash')}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>Splash</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { top: insets.top + 20 + 96 }]}>
        How are you feeling{'\n'}right now?
      </Text>

      <View style={styles.checkinContainer}>
        <TouchableOpacity style={styles.checkinButton} activeOpacity={0.8} onPress={() => router.push('/checkin')}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.checkinLabel}>Check In</Text>
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
  checkinLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    letterSpacing: 2,
    marginTop: 12,
  },
  backButton: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 1,
  },
});
