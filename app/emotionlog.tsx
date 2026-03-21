import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

export default function EmotionLogScreen() {
  const insets = useSafeAreaInsets();
  const { emotion, category } = useLocalSearchParams<{ emotion: string; category: string }>();
  const [text, setText] = useState('');

  const categoryKey = category as EmotionCategory;
  const accentColor = EMOTION_DATA[categoryKey]?.accentColor ?? '#FFFFFF';

  const handleSubmit = async () => {
    try {
      const existing = await AsyncStorage.getItem('emotion_logs');
      const logs = existing ? JSON.parse(existing) : [];
      logs.push({
        emotion,
        category,
        text,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem('emotion_logs', JSON.stringify(logs));
    } catch (e) {
      // silently fail for now
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.emotionTitle, { color: accentColor }]}>
          {emotion}
        </Text>

        <TextInput
          style={styles.textInput}
          placeholder="What's making you feel this way?"
          placeholderTextColor="#666666"
          multiline
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: accentColor }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 32,
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
  emotionTitle: {
    fontSize: 28,
    fontFamily: 'Jost_700Bold',
    marginBottom: 32,
  },
  textInput: {
    minHeight: 200,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'Jost_400Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  submitButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 28,
    alignSelf: 'center',
  },
  submitText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Jost_700Bold',
    letterSpacing: 1,
  },
});
