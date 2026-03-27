import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

// Lottie canvas dimensions
const LOTTIE_W = 440;
const LOTTIE_H = 956;

// Available width for the Lottie (with padding)
const CONTAINER_PADDING = 24;
const CONTAINER_W = width - CONTAINER_PADDING * 2;
const SCALE = CONTAINER_W / LOTTIE_W;
const CONTAINER_H = LOTTIE_H * SCALE;

// Icon positions in Lottie coordinates (center x, center y, width, height)
// Mapped from the JSON analysis
const ICON_BOUNDS = [
  { label: 'Sunny',  x: 43 - 85,  y: 357 - 87,  w: 170, h: 174 },
  { label: 'Stormy', x: 225 - 85, y: 357 - 87,  w: 170, h: 174 },
  { label: 'Calm',   x: 43 - 86,  y: 541 - 86,  w: 173, h: 172 },
  { label: 'Breezy', x: 225 - 85, y: 541 - 86,  w: 170, h: 172 },
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

        {/* Single Lottie with touch overlays */}
        <View style={{ width: CONTAINER_W, height: CONTAINER_H, alignSelf: 'center' }}>
          <LottieView
            source={require('../assets/MajorEmotions.json')}
            autoPlay
            loop
            style={{ width: CONTAINER_W, height: CONTAINER_H }}
          />

          {/* Invisible tap targets over each icon */}
          {ICON_BOUNDS.map((icon) => (
            <TouchableOpacity
              key={icon.label}
              activeOpacity={0.6}
              onPress={() => router.push({ pathname: '/subemotions', params: { category: icon.label } })}
              style={{
                position: 'absolute',
                left: icon.x * SCALE,
                top: icon.y * SCALE,
                width: icon.w * SCALE,
                height: icon.h * SCALE,
              }}
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
    fontFamily: 'Jost_400Regular',
    lineHeight: 34,
    marginTop: '50%',
    marginBottom: 32,
    textAlign: 'center',
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
