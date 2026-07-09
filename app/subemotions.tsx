import { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, InteractionManager, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
const COLUMNS = 4;
const GAP = 6;
const HORIZONTAL_PADDING = 24;
const CIRCLE_SIZE = (SCREEN_W - HORIZONTAL_PADDING * 2 - GAP * (4 - 1)) / 4 + 4;

// Fixed grid layout:
// Stormy (top-left)    | Sunny (top-right)
// Breezy (bottom-left) | Calm (bottom-right)
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

export default function SubEmotionsScreen() {
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const categoryKey = category as EmotionCategory;

  // All hooks must be called before any early return
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  // Pop-and-part is dormant until the user first drags — cells sit at uniform size on entry.
  const dragActive = useSharedValue(false);

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
  const totalGridHeight = sections.reduce((h, s) => h + s.rowCount * (CIRCLE_SIZE + GAP), 0);

  // Header height (back button area)
  const headerHeight = insets.top + 16 + 40 + 24;
  const viewportH = SCREEN_H - headerHeight;

  // Focus point + cell math (shared with the focusedCell derived value below)
  const focusX = SCREEN_W / 2;
  const focusY = viewportH / 2;
  const cellStep = CIRCLE_SIZE + GAP;
  const totalCols = 2 * COLUMNS;
  const totalRows = sections.reduce((n, s) => n + s.rowCount, 0);

  // Translate value needed to place cell (col, row) at a target viewport position.
  const positionAt = (col: number, row: number, targetX: number, targetY: number) => ({
    x: targetX - col * cellStep - CIRCLE_SIZE / 2,
    y: targetY - row * cellStep - CIRCLE_SIZE / 2,
  });

  // Clamp bounds — allow any cell (including corners) to be dragged to the focus point.
  const maxX = positionAt(0, 0, focusX, focusY).x;
  const minX = positionAt(totalCols - 1, 0, focusX, focusY).x;
  const maxY = positionAt(0, 0, focusX, focusY).y;
  const minY = positionAt(0, totalRows - 1, focusX, focusY).y;

  // Initial offset: each category's grid sits in a distinct band of the viewport.
  // Section 0 (Sunny / Stormy) → category CENTER lands at 2/3 of viewport height
  //   (grid fills the lower half; upper half is empty).
  // Section 1 (Calm / Breezy) → category CENTER lands at 1/3 of viewport height
  //   (grid fills the upper-middle band; section-0 rows peek in from above).
  const quadCol = { left: (COLUMNS - 1) / 2, right: COLUMNS + (COLUMNS - 1) / 2 };
  const quadRow = {
    top:    (sections[0].rowCount - 1) / 2,
    bottom: sections[0].rowCount + (sections[1].rowCount - 1) / 2,
  };
  const sec0TargetY = viewportH * 2 / 3;
  const sec1TargetY = viewportH * 1 / 3;
  const startOffsets: Record<EmotionCategory, { x: number; y: number }> = {
    Sunny:  positionAt(quadCol.left,  quadRow.top,    focusX, sec0TargetY),
    Stormy: positionAt(quadCol.right, quadRow.top,    focusX, sec0TargetY),
    Calm:   positionAt(quadCol.left,  quadRow.bottom, focusX, sec1TargetY),
    Breezy: positionAt(quadCol.right, quadRow.bottom, focusX, sec1TargetY),
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
      dragActive.value = true;
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

  // Which cell is currently at the focus point?
  // Encoded as `col * 10000 + row` so we can detect transitions with one comparison.
  const focusedCell = useDerivedValue(() => {
    const focusGridX = focusX - translateX.value;
    const focusGridY = focusY - translateY.value;
    const col = Math.round(focusGridX / cellStep);
    const row = Math.round(focusGridY / cellStep);
    return col * 10000 + row;
  });

  // Fire a subtle "tick" every time the focused cell transitions
  useAnimatedReaction(
    () => focusedCell.value,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(Haptics.selectionAsync)();
      }
    },
    [],
  );

  return (
    <GestureHandlerRootView style={styles.container}>
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

      <View style={{ flex: 1, overflow: 'hidden', paddingTop: insets.top + 80 }}>
        {!ready ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666666" />
          </View>
        ) : (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[{ width: totalGridWidth }, animatedStyle]}>
            {sections.map((section, sectionIndex) => {
              const rowsBefore = sections
                .slice(0, sectionIndex)
                .reduce((acc, s) => acc + s.rowCount, 0);
              return (
              <View key={sectionIndex}>
                {Array.from({ length: section.rowCount }).map((_, rowIndex) => {
                  const globalRow = rowsBefore + rowIndex;
                  return (
                  <View key={`${sectionIndex}-${rowIndex}`} style={styles.row}>
                    {/* Left grid row */}
                    {section.leftRows[rowIndex].map((emotion, cIdx) => (
                      <EmotionCircle
                        key={emotion}
                        label={emotion}
                        category={section.leftKey}
                        gradientStart={section.leftData.gradientStart}
                        gradientEnd={section.leftData.gradientEnd}
                        size={CIRCLE_SIZE}
                        col={cIdx}
                        row={globalRow}
                        focusedCell={focusedCell}
                        dragActive={dragActive}
                      />
                    ))}
                    {section.leftRows[rowIndex].length < COLUMNS &&
                      Array.from({ length: COLUMNS - section.leftRows[rowIndex].length }).map((_, i) => (
                        <View key={`empty-l-${i}`} style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }} />
                      ))}

                    {/* Right grid row */}
                    {section.rightRows[rowIndex].map((emotion, cIdx) => (
                      <EmotionCircle
                        key={emotion}
                        label={emotion}
                        category={section.rightKey}
                        gradientStart={section.rightData.gradientStart}
                        gradientEnd={section.rightData.gradientEnd}
                        size={CIRCLE_SIZE}
                        col={COLUMNS + cIdx}
                        row={globalRow}
                        focusedCell={focusedCell}
                        dragActive={dragActive}
                      />
                    ))}
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
  backArrow: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
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
