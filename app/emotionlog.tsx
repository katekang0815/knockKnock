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
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { HomeStar, HOME_ACCENT } from '@/components/EmotionShape';
import BouncingOrb from '@/components/BouncingOrb';
import VibratingOrb from '@/components/VibratingOrb';
import RollingOrb from '@/components/RollingOrb';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';
import { sendChatMessage } from '@/services/aiService';
import { recordSession, extractVerse } from '@/services/beliefStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHAPE_MAX = 180;
const SHAPE_MIN = 40;
const NEXT_BAR_H = 62; // bottom "next" pill bar height

// Animated major-emotion icon per category (same as the major-emotions screen).
function emotionIcon(category: EmotionCategory, size: number) {
  switch (category) {
    case 'Stormy':
      return <VibratingOrb size={size} />;
    case 'Rain':
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

const VISIBLE_TAGS = 9; // chips shown before the "More" toggle

// Always-open tag list: title, then a wrap of tags (+ add, first N, "More" toggle).
function TagSection({ title, options, selected, onSelect, onAdd, accentColor }: TagSectionProps) {
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewTag('');
      setAdding(false);
    }
  };

  const visible = showAll ? options : options.slice(0, VISIBLE_TAGS);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tagsWrap}>
        {/* Add new button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setAdding(!adding)} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        {visible.map((option) => {
          const isSelected = selected[0] === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, isSelected && { backgroundColor: accentColor }]}
              onPress={() => onSelect(option)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option}</Text>
            </TouchableOpacity>
          );
        })}

        {options.length > VISIBLE_TAGS && (
          <TouchableOpacity style={styles.moreToggle} onPress={() => setShowAll(!showAll)} activeOpacity={0.7}>
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
  const [phase, setPhase] = useState<'context' | 'chat'>('context');

  // Context summary from whatever the user selected (may be partial or empty).
  const contextSummary = [selectedDoing[0], selectedWith[0], selectedWhere[0]]
    .filter(Boolean)
    .join(', ');

  // The current exchange starts at the last user message; earlier messages fade.
  const lastUserIdx = chatMessages.reduce((acc, m, i) => (m.role === 'user' ? i : acc), 0);

  // Start the AI chat when entering the chat phase — regardless of whether any
  // context tags were selected.
  useEffect(() => {
    if (phase !== 'chat' || aiOpenerSent) return;
    setAiOpenerSent(true);

    const doing = selectedDoing[0];
    const withWhom = selectedWith[0];
    const where = selectedWhere[0];
    const parts: string[] = [];
    if (doing) parts.push(`while ${doing.toLowerCase()}`);
    if (withWhom) parts.push(withWhom === 'By Myself' ? 'by themselves' : `with ${withWhom.toLowerCase()}`);
    if (where) parts.push(`at ${where.toLowerCase()}`);
    const ctx = parts.length ? ' ' + parts.join(' ') : '';
    const openingPrompt = `The user just checked in feeling ${emotion?.toLowerCase()}${ctx}. Generate a warm, contextual opening message that acknowledges how they're feeling and asks a gentle follow-up question.`;

    sendChatMessage(openingPrompt, [], {
      emotion: emotion ?? '',
      category: category ?? '',
      doing,
      withWhom,
      where,
    }).then((response) => {
      setChatMessages([{ role: 'ai', text: sanitizeAI(response) }]);
    });
  }, [phase]);

  const goToChat = () => {
    setPhase('chat');
    setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: false }), 0);
  };

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

    // Save a check-in recap — captured for free (no AI call): the emotion + context,
    // the user's own words (the issue), and the verse the AI shared (pulled from the
    // chat via regex). Only when the user actually chatted (≥1 user message).
    const userMsgs = chatMessages.filter((m) => m.role === 'user');
    if (userMsgs.length >= 1) {
      try {
        let verse: ReturnType<typeof extractVerse> = null;
        for (let i = chatMessages.length - 1; i >= 0; i--) {
          if (chatMessages[i].role === 'ai') {
            const v = extractVerse(chatMessages[i].text);
            if (v) {
              verse = v;
              break;
            }
          }
        }
        await recordSession({
          emotion: emotion ?? '',
          category: category ?? '',
          context: contextSummary || null,
          issue: userMsgs[0].text.slice(0, 200),
          verse,
        });
      } catch (e) {
        // best-effort — recap is not critical to the check-in flow
      }
    }

    router.replace('/(tabs)');
  };

  // Bottom fade + "next" pill sit above the safe area on the context phase.
  const fadeGrad = 110; // transparent → black region above the pill
  const fadeTotal = insets.bottom + NEXT_BAR_H + 24 + fadeGrad;
  const fadeBlackAt = fadeGrad / fadeTotal;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Fixed header with shrinking shape */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity
          style={[styles.backArrow, { top: insets.top + 12 }]}
          onPress={() => (phase === 'chat' ? setPhase('context') : router.back())}
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
          { paddingBottom: phase === 'context' ? fadeTotal + 8 : insets.bottom + 24 },
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

        {/* Context phase — full always-open tag lists */}
        {phase === 'context' && (
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

        {/* Chat phase */}
        {phase === 'chat' && (
          <>
            {contextSummary ? <Text style={styles.contextLine}>{contextSummary}</Text> : null}

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

            <View style={styles.completeSection}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleComplete}
                activeOpacity={0.8}
              >
                <Text style={styles.completeText}>Complete check-in</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.ScrollView>

      {/* Context phase: bottom fade + "next" pill bar (→ starts the AI chat) */}
      {phase === 'context' && (
        <>
          <View style={[styles.bottomFade, { height: fadeTotal }]} pointerEvents="none">
            <Svg width={SCREEN_WIDTH} height={fadeTotal}>
              <Defs>
                <LinearGradient id="logFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#000000" stopOpacity={0} />
                  <Stop offset={fadeBlackAt} stopColor="#000000" stopOpacity={1} />
                  <Stop offset="1" stopColor="#000000" stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={SCREEN_WIDTH} height={fadeTotal} fill="url(#logFade)" />
            </Svg>
          </View>

          <View style={[styles.nextBarWrap, { bottom: insets.bottom + 12 }]}>
            <View style={styles.nextBar}>
              <TouchableOpacity style={styles.nextButton} onPress={goToChat} activeOpacity={0.85}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="#000000"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
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
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Jost_400Regular',
    marginBottom: 16,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
  },
  chipTextSelected: {
    color: '#000000',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Jost_400Regular',
    marginTop: -1,
  },
  moreToggle: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  moreText: {
    color: '#888888',
    fontSize: 15,
    fontFamily: 'Jost_400Regular',
  },
  addInputRow: {
    marginTop: 10,
  },
  addInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontFamily: 'Jost_400Regular',
    fontSize: 15,
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
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  nextBarWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  nextBar: {
    height: NEXT_BAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#141414',
    borderRadius: 32,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  nextButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
