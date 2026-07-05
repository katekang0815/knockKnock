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
const COLUMNS = 4;
const GAP = 6;
const HORIZONTAL_PADDING = 24;
// Bigger circles — 4 columns fit the screen width comfortably
const CIRCLE_SIZE = (SCREEN_W - HORIZONTAL_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

function buildRows(emotions: string[], columns: number): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < emotions.length; i += columns) {
    rows.push(emotions.slice(i, i + columns));
  }
  return rows;
}

export default function SubEmotionsScreen() {
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const categoryKey = category as EmotionCategory;

  // Reanimated shared values (must always be created, regardless of category validity)
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

  const data = EMOTION_DATA[categoryKey];
  const rows = buildRows(data.subEmotions, COLUMNS);
  const rowCount = rows.length;

  const gridWidth = COLUMNS * CIRCLE_SIZE + (COLUMNS - 1) * GAP;
  const gridHeight = rowCount * (CIRCLE_SIZE + GAP);

  // Header height — the back button area at the top
  const headerHeight = insets.top + 16 + 40 + 24;
  const viewportH = SCREEN_H - headerHeight;

  // Focus point in the viewport frame (roughly center of visible area)
  const focusX = SCREEN_W / 2;
  const focusY = viewportH / 2;
  const cellStep = CIRCLE_SIZE + GAP;

  // Pan clamp bounds
  const maxX = HORIZONTAL_PADDING;
  const minX = Math.min(maxX, -(gridWidth - SCREEN_W + HORIZONTAL_PADDING));
  const maxY = 0;
  const minY = Math.min(maxY, -(gridHeight - viewportH + insets.bottom + 24));

  useEffect(() => {
    // Start with the grid pinned to the top-left padding
    translateX.value = HORIZONTAL_PADDING;
    translateY.value = 0;
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

  // Which cell is currently under the focus point?
  // Encoded as `col * 10000 + row` so we can compare with a single int.
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
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: HORIZONTAL_PADDING }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{categoryKey}</Text>
      </View>

      <View style={{ flex: 1, overflow: 'hidden' }}>
        {!ready ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666666" />
          </View>
        ) : (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[{ width: gridWidth }, animatedStyle]}>
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((emotion) => (
                    <EmotionCircle
                      key={emotion}
                      label={emotion}
                      category={categoryKey}
                      gradientStart={data.gradientStart}
                      gradientEnd={data.gradientEnd}
                      size={CIRCLE_SIZE}
                    />
                  ))}
                  {/* Pad the last row with empty slots so widths stay consistent */}
                  {row.length < COLUMNS &&
                    Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                      <View
                        key={`empty-${i}`}
                        style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
                      />
                    ))}
                </View>
              ))}
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
    marginBottom: 12,
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
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Jost_700Bold',
    marginBottom: 12,
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
