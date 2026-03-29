import { View, Text, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmotionCircle from '@/components/EmotionCircle';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

const { width } = Dimensions.get('window');
const COLUMNS = 6;
const GAP = 6;
const HORIZONTAL_PADDING = 24;
const CIRCLE_SIZE = (width - HORIZONTAL_PADDING * 2 - GAP * (4 - 1)) / 4 + 4;

// Adjacent category pairs — left grid is the neighbor
const ADJACENT_CATEGORY: Record<EmotionCategory, EmotionCategory> = {
  Sunny: 'Stormy',
  Stormy: 'Sunny',
  Calm: 'Breezy',
  Breezy: 'Calm',
};

function buildRows(emotions: string[]): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < emotions.length; i += COLUMNS) {
    rows.push(emotions.slice(i, i + COLUMNS));
  }
  return rows;
}

export default function SubEmotionsScreen() {
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();

  const categoryKey = category as EmotionCategory;
  const data = EMOTION_DATA[categoryKey];

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  const adjacentKey = ADJACENT_CATEGORY[categoryKey];
  const adjacentData = EMOTION_DATA[adjacentKey];

  const mainRows = buildRows(data.subEmotions);
  const adjacentRows = buildRows(adjacentData.subEmotions);

  // Ensure both grids have same number of rows
  const maxRows = Math.max(mainRows.length, adjacentRows.length);
  while (mainRows.length < maxRows) mainRows.push([]);
  while (adjacentRows.length < maxRows) adjacentRows.push([]);

  const singleGridWidth = COLUMNS * CIRCLE_SIZE + (COLUMNS - 1) * GAP;
  const totalGridWidth = singleGridWidth * 2 + GAP;

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: HORIZONTAL_PADDING }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {data.subEmotions.length === 0 ? (
        <Text style={styles.emptyText}>Sub-emotions coming soon</Text>
      ) : (
        <ScrollView
          style={styles.outerScroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
            contentOffset={{ x: singleGridWidth + GAP - HORIZONTAL_PADDING, y: 0 }}
          >
            <View style={{ width: totalGridWidth }}>
              {Array.from({ length: maxRows }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {/* Adjacent (left) grid row */}
                  {adjacentRows[rowIndex].map((emotion) => (
                    <EmotionCircle
                      key={emotion}
                      label={emotion}
                      gradientStart={adjacentData.gradientStart}
                      gradientEnd={adjacentData.gradientEnd}
                      size={CIRCLE_SIZE}
                      onPress={() =>
                        router.push({
                          pathname: '/emotionlog',
                          params: { emotion, category: adjacentKey },
                        })
                      }
                    />
                  ))}
                  {/* Fill empty slots in adjacent row */}
                  {adjacentRows[rowIndex].length < COLUMNS &&
                    Array.from({ length: COLUMNS - adjacentRows[rowIndex].length }).map((_, i) => (
                      <View key={`empty-adj-${i}`} style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }} />
                    ))}

                  {/* Main (right) grid row */}
                  {mainRows[rowIndex].map((emotion) => (
                    <EmotionCircle
                      key={emotion}
                      label={emotion}
                      gradientStart={data.gradientStart}
                      gradientEnd={data.gradientEnd}
                      size={CIRCLE_SIZE}
                      onPress={() =>
                        router.push({
                          pathname: '/emotionlog',
                          params: { emotion, category: categoryKey },
                        })
                      }
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  outerScroll: {
    flex: 1,
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
  emptyText: {
    color: '#666666',
    fontSize: 18,
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
    marginTop: 48,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
    marginTop: 100,
  },
});
