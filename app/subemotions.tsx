import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withDecay } from 'react-native-reanimated';
import EmotionCircle from '@/components/EmotionCircle';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLUMNS = 6;
const GAP = 6;
const HORIZONTAL_PADDING = 24;
const CIRCLE_SIZE = (SCREEN_W - HORIZONTAL_PADDING * 2 - GAP * (4 - 1)) / 4 + 4;

// Fixed grid layout:
// Stormy (top-left)    | Sunny (top-right)
// Breezy (bottom-left) | Calm (bottom-right)
const FIXED_GRID: { left: EmotionCategory; right: EmotionCategory }[] = [
  { left: 'Stormy', right: 'Sunny' },
  { left: 'Breezy', right: 'Calm' },
];

function buildRows(emotions: string[]): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < emotions.length; i += COLUMNS) {
    rows.push(emotions.slice(i, i + COLUMNS));
  }
  return rows;
}

function equalizeRows(a: string[][], b: string[][]) {
  const max = Math.max(a.length, b.length);
  while (a.length < max) a.push([]);
  while (b.length < max) b.push([]);
}

export default function SubEmotionsScreen() {
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const categoryKey = category as EmotionCategory;

  // All hooks must be called before any early return
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  if (!EMOTION_DATA[categoryKey]) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  // Build fixed grid sections
  const sections = FIXED_GRID.map((section) => {
    const leftData = EMOTION_DATA[section.left];
    const rightData = EMOTION_DATA[section.right];
    const leftRows = buildRows(leftData.subEmotions);
    const rightRows = buildRows(rightData.subEmotions);
    equalizeRows(leftRows, rightRows);
    return {
      leftKey: section.left,
      leftData,
      leftRows,
      rightKey: section.right,
      rightData,
      rightRows,
      rowCount: leftRows.length,
    };
  });

  const singleGridWidth = COLUMNS * CIRCLE_SIZE + (COLUMNS - 1) * GAP;
  const totalGridWidth = singleGridWidth * 2 + GAP;
  const topSectionHeight = sections[0].rowCount * (CIRCLE_SIZE + GAP);
  const totalGridHeight = sections.reduce((h, s) => h + s.rowCount * (CIRCLE_SIZE + GAP), 0);

  // Header height (back button area)
  const headerHeight = insets.top + 16 + 40 + 24;
  const viewportH = SCREEN_H - headerHeight;

  // Clamp bounds
  const minX = -(totalGridWidth - SCREEN_W + HORIZONTAL_PADDING);
  const maxX = HORIZONTAL_PADDING;
  const minY = -(totalGridHeight - viewportH + insets.bottom + 24);
  const maxY = 0;

  // Initial offset to show the selected category's quadrant
  const startOffsets: Record<EmotionCategory, { x: number; y: number }> = {
    Stormy: { x: maxX, y: maxY },
    Sunny:  { x: -(singleGridWidth + GAP - HORIZONTAL_PADDING), y: maxY },
    Breezy: { x: maxX, y: -topSectionHeight },
    Calm:   { x: -(singleGridWidth + GAP - HORIZONTAL_PADDING), y: -topSectionHeight },
  };

  translateX.value = startOffsets[categoryKey].x;
  translateY.value = startOffsets[categoryKey].y;

  const clamp = (val: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(val, min), max);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = clamp(contextX.value + e.translationX, minX, maxX);
      translateY.value = clamp(contextY.value + e.translationY, minY, maxY);
    })
    .onEnd((e) => {
      translateX.value = withDecay({
        velocity: e.velocityX,
        clamp: [minX, maxX],
      });
      translateY.value = withDecay({
        velocity: e.velocityY,
        clamp: [minY, maxY],
      });
    });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: HORIZONTAL_PADDING }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, overflow: 'hidden' }}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[{ width: totalGridWidth }, animatedStyle]}>
            {sections.map((section, sectionIndex) => (
              <View key={sectionIndex}>
                {Array.from({ length: section.rowCount }).map((_, rowIndex) => (
                  <View key={`${sectionIndex}-${rowIndex}`} style={styles.row}>
                    {/* Left grid row */}
                    {section.leftRows[rowIndex].map((emotion) => (
                      <EmotionCircle
                        key={emotion}
                        label={emotion}
                        gradientStart={section.leftData.gradientStart}
                        gradientEnd={section.leftData.gradientEnd}
                        size={CIRCLE_SIZE}
                        onPress={() =>
                          router.push({
                            pathname: '/emotionlog',
                            params: { emotion, category: section.leftKey },
                          })
                        }
                      />
                    ))}
                    {section.leftRows[rowIndex].length < COLUMNS &&
                      Array.from({ length: COLUMNS - section.leftRows[rowIndex].length }).map((_, i) => (
                        <View key={`empty-l-${i}`} style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }} />
                      ))}

                    {/* Right grid row */}
                    {section.rightRows[rowIndex].map((emotion) => (
                      <EmotionCircle
                        key={emotion}
                        label={emotion}
                        gradientStart={section.rightData.gradientStart}
                        gradientEnd={section.rightData.gradientEnd}
                        size={CIRCLE_SIZE}
                        onPress={() =>
                          router.push({
                            pathname: '/emotionlog',
                            params: { emotion, category: section.rightKey },
                          })
                        }
                      />
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    marginBottom: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
    marginTop: 100,
  },
});
