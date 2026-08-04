import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, Dimensions, KeyboardAvoidingView, Keyboard, ScrollView } from 'react-native';
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
import { HomeStar, HOME_ACCENT } from '@/components/EmotionShape';
import BouncingOrb from '@/components/BouncingOrb';
import VibratingOrb from '@/components/VibratingOrb';
import RollingOrb from '@/components/RollingOrb';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';
import { sendChatMessage } from '@/services/aiService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHAPE_MAX = 180;
const SHAPE_MIN = 40;

// Animated major-emotion icon per category (same as the major-emotions screen).
function emotionIcon(category: EmotionCategory, size: number) {
  switch (category) {
    case 'Stormy':
      return <VibratingOrb size={size} />;
    case 'Calm':
      return <RollingOrb size={size} />;
    case 'Breezy':
      return <RollingOrb size={size} fadeBall={false} />;
    default:
      return <BouncingOrb size={size} />; // Sunny
  }
}
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

// Clean the AI text: no em/en dashes or spaced hyphens, no asterisks, no emoji.
const sanitizeAI = (s: string) =>
  s
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/ - /g, ', ')
    .replace(/\*/g, '')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

interface TagSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onSelect: (option: string) => void;
  onAdd: (option: string) => void;
  accentColor: string;
}

const VISIBLE_TAGS = 6; // chips shown before the "More" toggle

function TagSection({ title, options, selected, onSelect, onAdd, accentColor }: TagSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);
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

            {(showAll ? options : options.slice(0, VISIBLE_TAGS)).map((option) => {
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

            {/* More / Less dropdown toggle */}
            {options.length > VISIBLE_TAGS && (
              <TouchableOpacity
                style={styles.moreToggle}
                onPress={() => setShowAll(!showAll)}
                activeOpacity={0.7}
              >
                <Text style={styles.moreText}>{showAll ? 'Less ▲' : 'More ▼'}</Text>
              </TouchableOpacity>
            )}
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

  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        (scrollViewRef.current as unknown as ScrollView)?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => sub.remove();
  }, []);

  const [doingOptions, setDoingOptions] = useState(DOING_OPTIONS);
  const [withOptions, setWithOptions] = useState(WITH_OPTIONS);
  const [whereOptions, setWhereOptions] = useState(WHERE_OPTIONS);
  const [selectedDoing, setSelectedDoing] = useState<string[]>([]);
  const [selectedWith, setSelectedWith] = useState<string[]>([]);
  const [selectedWhere, setSelectedWhere] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [aiOpenerSent, setAiOpenerSent] = useState(false);

  const allAnswered = selectedDoing.length > 0 && selectedWith.length > 0 && selectedWhere.length > 0;

  // Summary line for context display
  const contextSummary = allAnswered
    ? `${selectedDoing[0]}, ${selectedWith[0]}, ${selectedWhere[0]}`
    : '';

  // The current exchange starts at the last user message; earlier messages fade.
  const lastUserIdx = chatMessages.reduce((acc, m, i) => (m.role === 'user' ? i : acc), 0);

  // Auto-generate AI opening message when all tags are answered
  useEffect(() => {
    if (allAnswered && !aiOpenerSent) {
      setAiOpenerSent(true);
      const openingPrompt = `The user just checked in feeling ${emotion?.toLowerCase()} while ${selectedDoing[0]?.toLowerCase()} ${selectedWith[0] === 'By Myself' ? 'by themselves' : `with ${selectedWith[0]?.toLowerCase()}`} at ${selectedWhere[0]?.toLowerCase()}. Generate a warm, contextual opening message that acknowledges their specific situation and asks a gentle follow-up question. Keep it to 2-3 sentences.`;
      sendChatMessage(openingPrompt, [], {
        emotion: emotion ?? '',
        category: category ?? '',
        doing: selectedDoing[0],
        withWhom: selectedWith[0],
        where: selectedWhere[0],
      }).then((response) => {
        setChatMessages([{ role: 'ai', text: sanitizeAI(response) }]);
      });
    }
  }, [allAnswered]);

  const handleSendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const updatedMessages = [...chatMessages, { role: 'user' as const, text: trimmed }];
    setChatMessages(updatedMessages);
    setChatInput('');

    const response = await sendChatMessage(trimmed, chatMessages, {
      emotion: emotion ?? '',
      category: category ?? '',
      doing: selectedDoing[0],
      withWhom: selectedWith[0],
      where: selectedWhere[0],
    });

    setChatMessages((prev) => [...prev, { role: 'ai', text: sanitizeAI(response) }]);
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
    // Shrink by scaling (not by clipping) so the bouncing icon is never cut off.
    const scale = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [1, SHAPE_MIN / SHAPE_MAX],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  // Sequential (no overlap): the animated icon fades out fully over the first
  // 40% of the scroll, then the static cross fades in — so they never coexist.
  const circleFade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_RANGE * 0.4], [1, 0], Extrapolation.CLAMP),
  }));
  const starFade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [SCROLL_RANGE * 0.4, SCROLL_RANGE], [0, 1], Extrapolation.CLAMP),
  }));

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
          <Animated.View style={[styles.shapeLayer, styles.iconOffset, circleFade]}>
            {emotionIcon(categoryKey, SHAPE_MAX)}
          </Animated.View>
          <Animated.View style={[styles.shapeLayer, starFade]}>
            {/* Warm concentric glow behind the cross (home-screen star look) */}
            <View style={styles.starGlow} pointerEvents="none">
              {[1, 0.78, 0.56, 0.36].map((scale, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${((1 - scale) / 2) * 100}%`,
                    top: `${((1 - scale) / 2) * 100}%`,
                    width: `${scale * 100}%`,
                    height: `${scale * 100}%`,
                    borderRadius: 9999,
                    backgroundColor: '#C78E7D',
                    opacity: 0.12 + i * 0.06,
                    shadowColor: '#C78E7D',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                  }}
                />
              ))}
            </View>
            <HomeStar size={SHAPE_MAX} />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        ref={scrollViewRef}
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
          <Text style={styles.feelingText}>I{`'`}m feeling</Text>
          <Text style={[styles.emotionWord, { color: HOME_ACCENT }]}>
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
            {/* Context summary */}
            <Text style={styles.contextLine}>{contextSummary}</Text>

            {/* AI Chat */}
            <View style={styles.chatSection}>
              {chatMessages.map((msg, i) => (
                <Text
                  key={i}
                  style={[
                    msg.role === 'ai' ? styles.aiMessageText : styles.userMessageText,
                    i < lastUserIdx && msg.role === 'ai' && styles.fadedMessage, // only past AI fades
                  ]}
                >
                  {msg.text}
                </Text>
              ))}

              <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Write"
                    placeholderTextColor="#666"
                    multiline
                    onFocus={() => {
                      setTimeout(() => {
                        (scrollViewRef.current as unknown as ScrollView)?.scrollToEnd({ animated: true });
                      }, 300);
                    }}
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
    </KeyboardAvoidingView>
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
    width: SHAPE_MAX,
    height: SHAPE_MAX,
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: 'center bottom', // scale shrinks toward the bottom, staying anchored
  },
  shapeLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOffset: {
    transform: [{ translateY: 50 }], // drop the animated icon so its halo isn't clipped
  },
  starGlow: {
    position: 'absolute',
    width: SHAPE_MAX * 0.85,
    height: SHAPE_MAX * 0.85,
    top: SHAPE_MAX * 0.075,
    left: SHAPE_MAX * 0.075,
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
    fontFamily: 'Jost_400Regular',
    marginTop: -1,
  },
  moreToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  moreText: {
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
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
  contextLine: {
    color: '#6E6E6E',
    fontSize: 16,
    fontFamily: 'Jost_400Regular',
    marginBottom: 16,
  },
  chatSection: {
    marginTop: 8,
  },
  aiMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Jost_400Regular_Italic',
    lineHeight: 24,
    marginBottom: 18,
  },
  userMessageText: {
    color: '#E6C79E', // soft faded amber
    fontSize: 16,
    fontFamily: 'Jost_400Regular',
    lineHeight: 24,
    marginBottom: 18,
  },
  fadedMessage: {
    color: '#6E6E6E', // past AI responses gray out (matches the context line)
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
    fontSize: 28,
    lineHeight: 36,
    maxHeight: 160,
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
