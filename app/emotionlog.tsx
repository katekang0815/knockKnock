import { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import EmotionShape from '@/components/EmotionShape';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAGS = ['Pets', 'Friends', 'Husband'];

const SHAPE_MAX = 180;
const SHAPE_MIN = 40;
const HEADER_MAX = 240;
const HEADER_MIN = 80;
const SCROLL_RANGE = HEADER_MAX - HEADER_MIN;

export default function EmotionLogScreen() {
  const insets = useSafeAreaInsets();
  const { emotion, category } = useLocalSearchParams<{ emotion: string; category: string }>();

  const categoryKey = category as EmotionCategory;
  const data = EMOTION_DATA[categoryKey];
  const accentColor = data?.accentColor ?? '#FFFFFF';
  const gradientStart = data?.gradientStart ?? '#FFFFFF';
  const gradientEnd = data?.gradientEnd ?? '#FFFFFF';

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated header height
  const headerStyle = useAnimatedStyle(() => {
    const headerHeight = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [HEADER_MAX + insets.top, HEADER_MIN + insets.top],
      Extrapolation.CLAMP,
    );
    return { height: headerHeight };
  });

  // Animated shape scale
  const shapeStyle = useAnimatedStyle(() => {
    const size = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [SHAPE_MAX, SHAPE_MIN],
      Extrapolation.CLAMP,
    );
    return {
      width: size,
      height: size,
    };
  });

  const handleComplete = async () => {
    try {
      const existing = await AsyncStorage.getItem('emotion_logs');
      const logs = existing ? JSON.parse(existing) : [];
      logs.push({
        emotion,
        category,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem('emotion_logs', JSON.stringify(logs));
    } catch (e) {
      // silently fail
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Fixed header with shrinking shape */}
      <Animated.View style={[styles.header, headerStyle]}>
        {/* Back arrow */}
        <TouchableOpacity
          style={[styles.backArrow, { top: insets.top + 12 }]}
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

        {/* Shape centered in header */}
        <Animated.View style={[styles.shapeWrapper, shapeStyle]}>
          <EmotionShape
            emotion={emotion ?? ''}
            gradientStart={gradientStart}
            gradientEnd={gradientEnd}
            size={SHAPE_MAX}
          />
        </Animated.View>
      </Animated.View>

      {/* Scrollable content underneath */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Text section */}
        <View style={styles.textContainer}>
          <Text style={styles.feelingText}>I'm feeling</Text>
          <Text style={[styles.emotionWord, { color: accentColor }]}>
            {emotion}
          </Text>
        </View>

        {/* Spacer to allow scrolling */}
        <View style={{ height: SCREEN_HEIGHT * 0.5 }} />

        {/* Tags + Complete button */}
        <View style={styles.bottomSection}>
          <View style={styles.tagsRow}>
            {TAGS.map((tag) => (
              <Text key={tag} style={styles.tag}>{tag}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.completeText}>Complete check-in</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
    zIndex: 10,
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    padding: 8,
  },
  shapeWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  feelingText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  emotionWord: {
    fontSize: 28,
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontStyle: 'italic',
    letterSpacing: 1,
    marginTop: 4,
  },
  bottomSection: {
    paddingHorizontal: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  tag: {
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    letterSpacing: 1,
  },
  completeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
  },
  completeText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Jost_700Bold',
    letterSpacing: 1,
  },
});
