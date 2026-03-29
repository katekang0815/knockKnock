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

// Grid layout: Stormy (top-left) | Sunny (top-right)
//              Calm (bottom-left) | Breezy (bottom-right)

// Adjacent category (left extension)
const ADJACENT_CATEGORY: Record<EmotionCategory, EmotionCategory> = {
  Sunny: 'Stormy',
  Stormy: 'Sunny',
  Calm: 'Breezy',
  Breezy: 'Calm',
};

// Below category (vertical extension)
const BELOW_CATEGORY: Record<EmotionCategory, EmotionCategory> = {
  Sunny: 'Breezy',
  Stormy: 'Calm',
  Calm: 'Stormy',
  Breezy: 'Sunny',
};

function buildRows(emotions: string[]): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < emotions.length; i += COLUMNS) {
    rows.push(emotions.slice(i, i + COLUMNS));
  }
  return rows;
}

function equalizeRows(a: string[][], b: string[][], columns: number) {
  const max = Math.max(a.length, b.length);
  while (a.length < max) a.push([]);
  while (b.length < max) b.push([]);
}

interface GridSection {
  leftKey: EmotionCategory;
  leftData: typeof EMOTION_DATA[EmotionCategory];
  leftRows: string[][];
  rightKey: EmotionCategory;
  rightData: typeof EMOTION_DATA[EmotionCategory];
  rightRows: string[][];
  rowCount: number;
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

  // Build the grid sections: top (main + adjacent) and bottom (below + below-adjacent)
  const adjacentKey = ADJACENT_CATEGORY[categoryKey];
  const adjacentData = EMOTION_DATA[adjacentKey];
  const belowKey = BELOW_CATEGORY[categoryKey];
  const belowData = EMOTION_DATA[belowKey];
  const belowAdjacentKey = BELOW_CATEGORY[adjacentKey];
  const belowAdjacentData = EMOTION_DATA[belowAdjacentKey];

  // Top section: adjacent (left) | main (right)
  const topLeftRows = buildRows(adjacentData.subEmotions);
  const topRightRows = buildRows(data.subEmotions);
  equalizeRows(topLeftRows, topRightRows, COLUMNS);

  // Bottom section: below-adjacent (left) | below (right)
  const bottomLeftRows = buildRows(belowAdjacentData.subEmotions);
  const bottomRightRows = buildRows(belowData.subEmotions);
  equalizeRows(bottomLeftRows, bottomRightRows, COLUMNS);

  const sections: GridSection[] = [
    {
      leftKey: adjacentKey,
      leftData: adjacentData,
      leftRows: topLeftRows,
      rightKey: categoryKey,
      rightData: data,
      rightRows: topRightRows,
      rowCount: topLeftRows.length,
    },
  ];

  // Only add bottom section if it has emotions
  if (belowData.subEmotions.length > 0 || belowAdjacentData.subEmotions.length > 0) {
    sections.push({
      leftKey: belowAdjacentKey,
      leftData: belowAdjacentData,
      leftRows: bottomLeftRows,
      rightKey: belowKey,
      rightData: belowData,
      rightRows: bottomRightRows,
      rowCount: bottomLeftRows.length,
    });
  }

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
