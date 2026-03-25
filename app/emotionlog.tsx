import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import EmotionShape from '@/components/EmotionShape';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

const TAGS = ['Pets', 'Friends', 'Husband'];

export default function EmotionLogScreen() {
  const insets = useSafeAreaInsets();
  const { emotion, category } = useLocalSearchParams<{ emotion: string; category: string }>();

  const categoryKey = category as EmotionCategory;
  const data = EMOTION_DATA[categoryKey];
  const accentColor = data?.accentColor ?? '#FFFFFF';
  const gradientStart = data?.gradientStart ?? '#FFFFFF';
  const gradientEnd = data?.gradientEnd ?? '#FFFFFF';

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
      // silently fail for now
    }
    router.replace('/(tabs)');
  };

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

      {/* Shape + text centered */}
      <View style={styles.content}>
        <EmotionShape
          emotion={emotion ?? ''}
          gradientStart={gradientStart}
          gradientEnd={gradientEnd}
          size={180}
        />

        <View style={styles.textContainer}>
          <Text style={styles.feelingText}>I'm feeling</Text>
          <Text style={[styles.emotionWord, { color: accentColor }]}>
            {emotion}
          </Text>
        </View>
      </View>

      {/* Bottom section: tags + button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
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
    </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
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
    paddingHorizontal: 24,
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
