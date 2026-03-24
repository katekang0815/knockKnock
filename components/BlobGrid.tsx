import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface BlobGridProps {
  emotions: string[];
  columns: number;
  cellSize: number;
  gap: number;
  colors: string[];
  onPress: (emotion: string) => void;
}

// Deterministic hash to pick color and connections per item
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function BlobGrid({ emotions, columns, cellSize, gap, colors, onPress }: BlobGridProps) {
  const rows: string[][] = [];
  for (let i = 0; i < emotions.length; i += columns) {
    rows.push(emotions.slice(i, i + columns));
  }

  const bridgeHeight = cellSize * 0.45;
  const bridgeWidth = gap + cellSize * 0.3;
  const vertBridgeWidth = cellSize * 0.45;
  const vertBridgeHeight = gap + cellSize * 0.3;

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ marginBottom: gap }}>
          {/* Circles row */}
          <View style={{ flexDirection: 'row', gap }}>
            {row.map((emotion, colIndex) => {
              const colorIndex = hash(emotion) % colors.length;
              const color = colors[colorIndex];
              const globalIndex = rowIndex * columns + colIndex;

              // Determine connections
              const hasRight = colIndex < row.length - 1 && hash(emotion + 'r') % 3 !== 0;
              const hasBottom = rowIndex < rows.length - 1 &&
                colIndex < rows[rowIndex + 1].length &&
                hash(emotion + 'b') % 3 !== 0;

              const rightColor = hasRight ? colors[hash(row[colIndex + 1]) % colors.length] : '';
              const bottomEmotion = hasBottom ? rows[rowIndex + 1][colIndex] : '';
              const bottomColor = hasBottom ? colors[hash(bottomEmotion) % colors.length] : '';

              return (
                <View key={emotion} style={{ width: cellSize, height: cellSize }}>
                  {/* Horizontal bridge to right neighbor */}
                  {hasRight && (
                    <View
                      style={{
                        position: 'absolute',
                        right: -(gap + cellSize * 0.15),
                        top: (cellSize - bridgeHeight) / 2,
                        width: bridgeWidth,
                        height: bridgeHeight,
                        borderRadius: bridgeHeight / 2,
                        backgroundColor: color,
                        zIndex: -1,
                      }}
                    />
                  )}

                  {/* Vertical bridge to bottom neighbor */}
                  {hasBottom && (
                    <View
                      style={{
                        position: 'absolute',
                        left: (cellSize - vertBridgeWidth) / 2,
                        bottom: -(gap + cellSize * 0.15),
                        width: vertBridgeWidth,
                        height: vertBridgeHeight,
                        borderRadius: vertBridgeWidth / 2,
                        backgroundColor: color,
                        zIndex: -1,
                      }}
                    />
                  )}

                  {/* Circle */}
                  <TouchableOpacity
                    onPress={() => onPress(emotion)}
                    activeOpacity={0.7}
                    style={[
                      styles.circle,
                      {
                        width: cellSize,
                        height: cellSize,
                        borderRadius: cellSize / 2,
                        backgroundColor: color,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.label, { fontSize: cellSize * 0.14 }]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      {emotion}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#000000',
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
