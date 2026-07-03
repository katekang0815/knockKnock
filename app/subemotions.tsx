import { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, InteractionManager, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  withDecay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import EmotionCircle from '@/components/EmotionCircle';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLUMNS = 6;
const GAP = 6;
const HORIZONTAL_PADDING = 24;
const CIRCLE_SIZE = (SCREEN_W - HORIZONTAL_PADDING * 2 - GAP * (4 - 1)) / 4 + 4;
const CELL_STEP = CIRCLE_SIZE + GAP; // horizontal / vertical step between circle centers

// Fixed grid layout:
// Sunny (top-left)  | Stormy (top-right)
// Calm  (bottom-left) | Breezy (bottom-right)
const FIXED_GRID: { left: EmotionCategory; right: EmotionCategory }[] = [
  { left: 'Sunny', right: 'Stormy' },
  { left: 'Calm',  right: 'Breezy' },
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

// Fire a subtle "selection" tick — feels like balls clicking into a slot.
function triggerHaptic() {
  Haptics.selectionAsync();
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

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

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
  const topSectionHeight = sections[0].rowCount * CELL_STEP;
  const totalGridHeight = sections.reduce((h, s) => h + s.rowCount * CELL_STEP, 0);

  // Header height (back button area) — grid begins below this
  const headerHeight = insets.top + 16 + 40 + 24;
  const viewportH = SCREEN_H - headerHeight;

  // Focus point in the grid container's local frame
  // (roughly the center of the visible viewport)
  const focusX = SCREEN_W / 2;
  const focusY = viewportH / 2;

  // Clamp bounds
  const minX = -(totalGridWidth - SCREEN_W + HORIZONTAL_PADDING);
  const maxX = HORIZONTAL_PADDING;
  const minY = -(totalGridHeight - viewportH + insets.bottom + 24);
  const maxY = 0;

  // Initial offset — center the selected category's quadrant
  const startOffsets: Record<EmotionCategory, { x: number; y: number }> = {
    Sunny:  { x: maxX, y: maxY },
    Stormy: { x: -(singleGridWidth + GAP - HORIZONTAL_PADDING), y: maxY },
    Calm:   { x: maxX, y: -topSectionHeight },
    Breezy: { x: -(singleGridWidth + GAP - HORIZONTAL_PADDING), y: -topSectionHeight },
  };

  useEffect(() => {
    translateX.value = startOffsets[categoryKey].x;
    translateY.value = startOffsets[categoryKey].y;
  }, []);

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

  // Which grid cell is currently at the focus point?
  // Encoded as `col * 1000 + row` for cheap comparison.
  const focusedCell = useDerivedValue(() => {
    const focusGridX = focusX - translateX.value;
    const focusGridY = focusY - translateY.value;
    const col = Math.round(focusGridX / CELL_STEP);
    const row = Math.round(focusGridY / CELL_STEP);
    return col * 10000 + row;
  });

  // Fire haptic every time the focused cell transitions to a new one
  useAnimatedReaction(
    () => focusedCell.value,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(triggerHaptic)();
      }
    },
    [],
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: HORIZONTAL_PADDING }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, overflow: 'hidden' }}>
        {!ready ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666666" />
          </View>
        ) : (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[{ width: totalGridWidth }, animatedStyle]}>
            {sections.map((section, sectionIndex) => {
              // Vertical offset of this section within the grid
              const sectionOffsetY =
                sectionIndex === 0
                  ? 0
                  : sections
                      .slice(0, sectionIndex)
                      .reduce((h, s) => h + s.rowCount * CELL_STEP, 0);

              return (
                <View key={sectionIndex}>
                  {Array.from({ length: section.rowCount }).map((_, rowIndex) => {
                    // Center Y of any circle in this row (grid frame)
                    const rowCenterY =
                      sectionOffsetY + rowIndex * CELL_STEP + CIRCLE_SIZE / 2;

                    return (
                      <View key={`${sectionIndex}-${rowIndex}`} style={styles.row}>
                        {/* Left grid row */}
                        {section.leftRows[rowIndex].map((emotion, colIndex) => {
                          const cellCenterX = colIndex * CELL_STEP + CIRCLE_SIZE / 2;
                          return (
                            <EmotionCircle
                              key={emotion}
                              label={emotion}
                              category={section.leftKey}
                              gradientStart={section.leftData.gradientStart}
                              gradientEnd={section.leftData.gradientEnd}
                              size={CIRCLE_SIZE}
                              baseX={cellCenterX}
                              baseY={rowCenterY}
                              translateX={translateX}
                              translateY={translateY}
                              focusX={focusX}
                              focusY={focusY}
                            />
                          );
                        })}
                        {section.leftRows[rowIndex].length < COLUMNS &&
                          Array.from({ length: COLUMNS - section.leftRows[rowIndex].length }).map((_, i) => (
                            <View
                              key={`empty-l-${i}`}
                              style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
                            />
                          ))}

                        {/* Right grid row */}
                        {section.rightRows[rowIndex].map((emotion, colIndex) => {
                          const cellCenterX =
                            singleGridWidth + GAP + colIndex * CELL_STEP + CIRCLE_SIZE / 2;
                          return (
                            <EmotionCircle
                              key={emotion}
                              label={emotion}
                              category={section.rightKey}
                              gradientStart={section.rightData.gradientStart}
                              gradientEnd={section.rightData.gradientEnd}
                              size={CIRCLE_SIZE}
                              baseX={cellCenterX}
                              baseY={rowCenterY}
                              translateX={translateX}
                              translateY={translateY}
                              focusX={focusX}
                              focusY={focusY}
                            />
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </Animated.View>
        </GestureDetector>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
