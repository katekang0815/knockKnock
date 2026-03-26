import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, Dimensions } from 'react-native';
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

const SHAPE_MAX = 180;
const SHAPE_MIN = 40;
const HEADER_MAX = 240;
const HEADER_MIN = 80;
const SCROLL_RANGE = HEADER_MAX - HEADER_MIN;

const DOING_OPTIONS = [
  'Resting', 'Planning family trip', 'Fitness', 'Eating',
  'Creating app', 'Driving', 'Hobbies', 'Hanging Out', 'Praying',
];

const WITH_OPTIONS = [
  'By Myself', 'Family', 'Co-Workers', 'Pets', 'Friends', 'Husband',
];

const WHERE_OPTIONS = [
  'Home', 'Work', 'Outside', 'Commuting', 'School',
];

interface TagSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onSelect: (option: string) => void;
  onAdd: (option: string) => void;
  accentColor: string;
}

function TagSection({ title, options, selected, onSelect, onAdd, accentColor }: TagSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewTag('');
      setAdding(false);
      setExpanded(false);
    }
  };

  const handleSelect = (option: string) => {
    onSelect(option);
    setExpanded(false);
  };

  return (
    <View style={styles.section}>
      {/* Dropdown header — tap to expand/collapse */}
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownHeaderLeft}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {selected.length > 0 && (
            <Text style={styles.summaryText} numberOfLines={1}>
              {selected[0]}
            </Text>
          )}
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Expanded dropdown — all options */}
      {expanded && (
        <View style={styles.dropdownContent}>
          <View style={styles.tagsWrap}>
            {/* Add new button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setAdding(!adding)}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>

            {options.map((option) => {
              const isSelected = selected[0] === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    isSelected && { backgroundColor: accentColor },
                  ]}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {adding && (
            <View style={styles.addInputRow}>
              <TextInput
                style={styles.addInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Type new option..."
                placeholderTextColor="#666"
                autoFocus
                onSubmitEditing={handleAdd}
                returnKeyType="done"
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function EmotionLogScreen() {
  const insets = useSafeAreaInsets();
  const { emotion, category } = useLocalSearchParams<{ emotion: string; category: string }>();

  const categoryKey = category as EmotionCategory;
  const data = EMOTION_DATA[categoryKey];
  const accentColor = data?.accentColor ?? '#FFFFFF';
  const gradientStart = data?.gradientStart ?? '#FFFFFF';
  const gradientEnd = data?.gradientEnd ?? '#FFFFFF';

  const scrollY = useSharedValue(0);

  const [doingOptions, setDoingOptions] = useState(DOING_OPTIONS);
  const [withOptions, setWithOptions] = useState(WITH_OPTIONS);
  const [whereOptions, setWhereOptions] = useState(WHERE_OPTIONS);
  const [selectedDoing, setSelectedDoing] = useState<string[]>([]);
  const [selectedWith, setSelectedWith] = useState<string[]>([]);
  const [selectedWhere, setSelectedWhere] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [editingField, setEditingField] = useState<'doing' | 'with' | 'where' | null>(null);

  const allAnswered = selectedDoing.length > 0 && selectedWith.length > 0 && selectedWhere.length > 0;

  // Summary sentence from selections
  const summaryText = allAnswered
    ? `I am ${selectedDoing[0]?.toLowerCase()} ${selectedWith[0] === 'By Myself' ? 'by myself' : `with ${selectedWith[0]?.toLowerCase()}`} at ${selectedWhere[0]?.toLowerCase()}.`
    : '';

  // AI opening question for chat
  const aiQuestion = `What do you think is driving your ${emotion?.toLowerCase()} today?`;

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChatMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setChatInput('');
    // Placeholder AI response — will be replaced with real AI later
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Thank you for sharing. Take a moment to sit with that feeling — it tells you something important about what matters to you.' },
      ]);
    }, 1000);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const headerHeight = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [HEADER_MAX + insets.top, HEADER_MIN + insets.top],
      Extrapolation.CLAMP,
    );
    return { height: headerHeight };
  });

  const shapeStyle = useAnimatedStyle(() => {
    const size = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [SHAPE_MAX, SHAPE_MIN],
      Extrapolation.CLAMP,
    );
    return { width: size, height: size };
  });

  const handleComplete = async () => {
    try {
      const existing = await AsyncStorage.getItem('emotion_logs');
      const logs = existing ? JSON.parse(existing) : [];
      logs.push({
        emotion,
        category,
        doing: selectedDoing,
        withWhom: selectedWith,
        where: selectedWhere,
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

        <Animated.View style={[styles.shapeWrapper, shapeStyle]}>
          <EmotionShape
            emotion={emotion ?? ''}
            gradientStart={gradientStart}
            gradientEnd={gradientEnd}
            size={SHAPE_MAX}
          />
        </Animated.View>
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* I'm feeling text */}
        <View style={styles.textContainer}>
          <Text style={styles.feelingText}>I'm feeling</Text>
          <Text style={[styles.emotionWord, { color: accentColor }]}>
            {emotion}
          </Text>
        </View>

        {/* Questions (not all answered yet) */}
        {!allAnswered && (
          <>
            <TagSection
              title="What are you doing?"
              options={doingOptions}
              selected={selectedDoing}
              onSelect={(item) => setSelectedDoing([item])}
              onAdd={(item) => {
                setDoingOptions((prev) => [...prev, item]);
                setSelectedDoing([item]);
              }}
              accentColor={accentColor}
            />
            <TagSection
              title="Who are you with?"
              options={withOptions}
              selected={selectedWith}
              onSelect={(item) => setSelectedWith([item])}
              onAdd={(item) => {
                setWithOptions((prev) => [...prev, item]);
                setSelectedWith([item]);
              }}
              accentColor={accentColor}
            />
            <TagSection
              title="Where are you?"
              options={whereOptions}
              selected={selectedWhere}
              onSelect={(item) => setSelectedWhere([item])}
              onAdd={(item) => {
                setWhereOptions((prev) => [...prev, item]);
                setSelectedWhere([item]);
              }}
              accentColor={accentColor}
            />
          </>
        )}

        {/* Summary with tappable words + Chat */}
        {allAnswered && (
          <>
            {/* Summary — tap each underlined word to edit */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryLine}>
                {'I am '}
                <Text
                  style={[styles.summaryHighlight, { color: accentColor }]}
                  onPress={() => setEditingField(editingField === 'doing' ? null : 'doing')}
                >
                  {selectedDoing[0]?.toLowerCase()}
                </Text>
                {'\n'}
                {'with '}
                <Text
                  style={[styles.summaryHighlight, { color: accentColor }]}
                  onPress={() => setEditingField(editingField === 'with' ? null : 'with')}
                >
                  {selectedWith[0] === 'By Myself' ? 'myself' : selectedWith[0]?.toLowerCase()}
                </Text>
                {'\n'}
                {'at '}
                <Text
                  style={[styles.summaryHighlight, { color: accentColor }]}
                  onPress={() => setEditingField(editingField === 'where' ? null : 'where')}
                >
                  {selectedWhere[0]?.toLowerCase()}
                </Text>
              </Text>
            </View>

            {/* Inline dropdown for editing a field */}
            {editingField === 'doing' && (
              <TagSection
                title="What are you doing?"
                options={doingOptions}
                selected={selectedDoing}
                onSelect={(item) => { setSelectedDoing([item]); setEditingField(null); }}
                onAdd={(item) => {
                  setDoingOptions((prev) => [...prev, item]);
                  setSelectedDoing([item]);
                  setEditingField(null);
                }}
                accentColor={accentColor}
              />
            )}
            {editingField === 'with' && (
              <TagSection
                title="Who are you with?"
                options={withOptions}
                selected={selectedWith}
                onSelect={(item) => { setSelectedWith([item]); setEditingField(null); }}
                onAdd={(item) => {
                  setWithOptions((prev) => [...prev, item]);
                  setSelectedWith([item]);
                  setEditingField(null);
                }}
                accentColor={accentColor}
              />
            )}
            {editingField === 'where' && (
              <TagSection
                title="Where are you?"
                options={whereOptions}
                selected={selectedWhere}
                onSelect={(item) => { setSelectedWhere([item]); setEditingField(null); }}
                onAdd={(item) => {
                  setWhereOptions((prev) => [...prev, item]);
                  setSelectedWhere([item]);
                  setEditingField(null);
                }}
                accentColor={accentColor}
              />
            )}

            {/* AI Chat */}
            <View style={styles.chatSection}>
              <View style={styles.chatDivider} />

              {chatMessages.map((msg, i) => (
                <View
                  key={i}
                  style={msg.role === 'ai' ? styles.aiMessageBubble : styles.userMessageBubble}
                >
                  <Text style={msg.role === 'ai' ? styles.aiMessageText : styles.userMessageText}>
                    {msg.text}
                  </Text>
                </View>
              ))}

              <View style={styles.chatInputBlock}>
                <Text style={styles.chatInputLabel}>{aiQuestion}</Text>
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Write"
                    placeholderTextColor="#666"
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      { backgroundColor: chatInput.trim() ? accentColor : '#444444' },
                    ]}
                    onPress={handleSendChat}
                    activeOpacity={0.7}
                    disabled={!chatInput.trim()}
                  >
                    <Text style={[
                      styles.sendButtonText,
                      { color: chatInput.trim() ? '#000000' : '#888888' },
                    ]}>↑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Complete button */}
        <View style={styles.completeSection}>
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
    marginBottom: 32,
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
  section: {
    marginBottom: 20,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Jost_700Bold',
  },
  summaryText: {
    color: '#AAAAAA',
    fontSize: 13,
    fontFamily: 'Jost_400Regular',
    marginTop: 2,
  },
  summaryPlaceholder: {
    color: '#555555',
  },
  chevron: {
    color: '#888888',
    fontSize: 12,
  },
  dropdownContent: {
    backgroundColor: '#111111',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginTop: -14,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
  },
  chipTextSelected: {
    color: '#000000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300',
    marginTop: -1,
  },
  addInputRow: {
    marginTop: 8,
  },
  addInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryLine: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Jost_400Regular',
    lineHeight: 36,
  },
  summaryHighlight: {
    textDecorationLine: 'underline',
    fontFamily: 'Jost_700Bold',
  },
  chatSection: {
    marginTop: 8,
  },
  chatDivider: {
    height: 1,
    backgroundColor: '#222222',
    marginBottom: 20,
  },
  aiMessageBubble: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    marginBottom: 12,
    marginRight: 40,
  },
  aiMessageText: {
    color: '#DDDDDD',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
    lineHeight: 22,
  },
  userMessageBubble: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 16,
    marginBottom: 12,
    marginLeft: 40,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
    lineHeight: 22,
  },
  chatInputBlock: {
    backgroundColor: '#1A1200',
    borderRadius: 16,
    padding: 16,
  },
  chatInputLabel: {
    color: '#CCCCCC',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
    lineHeight: 22,
    marginBottom: 16,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    fontFamily: 'Jost_400Regular',
    fontSize: 16,
    maxHeight: 100,
    padding: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  completeSection: {
    marginTop: 24,
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
