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
import { EmotionCategory } from '@/constants/emotions';
import { sendChatMessage } from '@/services/aiService';
import { recordSession, extractVerse } from '@/services/beliefStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
              style={[
                styles.chip,
                isSelected && { backgroundColor: 'rgba(219,83,60,0.22)' },
              ]}
              onPress={() => onSelect(option)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && { color: accentColor }]}>{option}</Text>
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

  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);
  // Layout measurements used to focus the current chat turn at the top.
  const messageYs = useRef<number[]>([]); // y of each message, relative to chatSection
  const chatSectionY = useRef(0); // y of chatSection, relative to scroll content
  const phaseRef = useRef<'context' | 'chat'>('context');

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      // Only jump to the end for the context-phase "add tag" input; the chat
      // phase manages its own focus scroll.
      if (phaseRef.current !== 'context') return;
      setTimeout(() => {
        (scrollViewRef.current as unknown as ScrollView)?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => sub.remove();
  }, []);

  // Track keyboard visibility so the Complete button can hide behind the keyboard while typing.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const [doingOptions, setDoingOptions] = useState(DOING_OPTIONS);
  const [withOptions, setWithOptions] = useState(WITH_OPTIONS);
  const [whereOptions, setWhereOptions] = useState(WHERE_OPTIONS);
  const [selectedDoing, setSelectedDoing] = useState<string[]>([]);
  const [selectedWith, setSelectedWith] = useState<string[]>([]);
  const [selectedWhere, setSelectedWhere] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { role: 'ai' | 'user'; text: string; kind?: 'prayer' | 'verse' }[]
  >([]);
  const [aiOpenerSent, setAiOpenerSent] = useState(false);
  const [phase, setPhase] = useState<'context' | 'chat'>('context');
  const [sending, setSending] = useState(false); // a chat/prayer/verse request is in flight
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Context summary from whatever the user selected (may be partial or empty).
  const contextSummary = [selectedDoing[0], selectedWith[0], selectedWhere[0]]
    .filter(Boolean)
    .join(', ');

  // The current exchange starts at the last user message; earlier messages fade.
  const lastUserIdx = chatMessages.reduce((acc, m, i) => (m.role === 'user' ? i : acc), 0);
  // While the user is composing, the current AI reply grays out too.
  const isTyping = chatInput.trim().length > 0;
  // Show "Tap to pray" / "Look for verses" from the 2nd AI response onward
  // (i.e. once the user has replied at least once), when the AI has just spoken.
  const chatUserTurns = chatMessages.filter((m) => m.role === 'user').length;
  const lastMsg = chatMessages[chatMessages.length - 1];
  const showOptions = phase === 'chat' && chatUserTurns >= 1 && lastMsg?.role === 'ai' && !sending;

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

  // Keep phaseRef in sync for the keyboard listener closure.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Bring the newest message (the current AI reply) to the top, so only the
  // current turn's response shows — the user's message and prior turns scroll up
  // out of view (still reachable by dragging down). The ~12px gap sits inside the
  // previous message's bottom margin, so no earlier text peeks through.
  const REVEAL_PEEK = 12;
  const scrollToFocus = () => {
    const anchor = chatMessages.length - 1;
    const y = chatSectionY.current + (messageYs.current[anchor] ?? 0) - REVEAL_PEEK;
    scrollViewRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  };

  // After each new message in the chat, focus the current turn at the top.
  useEffect(() => {
    if (phase !== 'chat' || chatMessages.length === 0) return;
    const t = setTimeout(scrollToFocus, 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages.length, phase]);

  const goToChat = () => {
    setPhase('chat');
    setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: false }), 0);
  };

  const chatContext = {
    emotion: emotion ?? '',
    category: category ?? '',
    doing: selectedDoing[0],
    withWhom: selectedWith[0],
    where: selectedWhere[0],
  };

  const handleSendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || sending) return;

    setChatMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setChatInput('');
    setSending(true);

    const response = await sendChatMessage(trimmed, chatMessages, chatContext);
    setChatMessages((prev) => [...prev, { role: 'ai', text: sanitizeAI(response) }]);
    setSending(false);
  };

  // "Tap to pray" / "Look for verses" — a hidden instruction to the AI; only the
  // AI's response is shown (no user bubble), and it doesn't consume a chat turn.
  const askAI = async (instruction: string, kind: 'prayer' | 'verse') => {
    if (sending) return;
    setSending(true);
    const response = await sendChatMessage(instruction, chatMessages, chatContext);
    setChatMessages((prev) => [...prev, { role: 'ai', text: sanitizeAI(response), kind }]);
    setSending(false);
  };
  const onPray = () =>
    askAI(
      "The user tapped the pray button. Write a short, personal, first-person prayer for what they're going through right now — warm and conversational, 2 to 4 sentences, with no preamble or commentary.",
      'prayer',
    );

  // The verse comes back as two parts (verse, then reflection) separated by a
  // blank line — shown as a boxed verse plus a separate reflection message.
  const onVerse = async () => {
    if (sending) return;
    setSending(true);
    const raw = await sendChatMessage(
      "The user tapped the verses button. Reply in exactly two parts separated by a line containing only ###. PART 1: the Bible verse — its reference (e.g. Ecclesiastes 3:11) followed by the full verse text, kept together. PART 2: a warm 1 to 2 sentence reflection connecting the verse to what they're feeling. Put nothing else outside these two parts.",
      chatMessages,
      chatContext,
    );
    const [rawVerse, ...rest] = raw.split(/#{3,}/);
    const verseText = sanitizeAI(rawVerse ?? raw);
    const reflection = rest.length ? sanitizeAI(rest.join(' ')) : '';
    setChatMessages((prev) => {
      const next = [...prev, { role: 'ai' as const, text: verseText, kind: 'verse' as const }];
      if (reflection) next.push({ role: 'ai' as const, text: reflection });
      return next;
    });
    setSending(false);
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
        style={styles.scroll}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              phase === 'context'
                ? fadeTotal + 8
                : insets.bottom + Math.round(SCREEN_HEIGHT * 0.55), // room to scroll the current turn to the top
          },
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
              onSelect={(item) => setSelectedDoing((prev) => (prev[0] === item ? [] : [item]))}
              onAdd={(item) => {
                setDoingOptions((prev) => [...prev, item]);
                setSelectedDoing([item]);
              }}
              accentColor={HOME_ACCENT}
            />
            <TagSection
              title="Who are you with?"
              options={withOptions}
              selected={selectedWith}
              onSelect={(item) => setSelectedWith((prev) => (prev[0] === item ? [] : [item]))}
              onAdd={(item) => {
                setWithOptions((prev) => [...prev, item]);
                setSelectedWith([item]);
              }}
              accentColor={HOME_ACCENT}
            />
            <TagSection
              title="Where are you?"
              options={whereOptions}
              selected={selectedWhere}
              onSelect={(item) => setSelectedWhere((prev) => (prev[0] === item ? [] : [item]))}
              onAdd={(item) => {
                setWhereOptions((prev) => [...prev, item]);
                setSelectedWhere([item]);
              }}
              accentColor={HOME_ACCENT}
            />
          </>
        )}

        {/* Chat phase */}
        {phase === 'chat' && (
          <>
            {contextSummary ? <Text style={styles.contextLine}>{contextSummary}</Text> : null}

            <View
              style={styles.chatSection}
              onLayout={(e) => {
                chatSectionY.current = e.nativeEvent.layout.y;
              }}
            >
              {chatMessages.map((msg, i) => {
                // Past AI messages always fade; the current AI reply fades while typing.
                const faded = msg.role === 'ai' && (i < lastUserIdx || isTyping);

                // Prayers and verses get a bordered, grayed box to set them apart.
                if (msg.kind === 'prayer' || msg.kind === 'verse') {
                  return (
                    <View
                      key={i}
                      style={styles.verseBox}
                      onLayout={(e) => {
                        messageYs.current[i] = e.nativeEvent.layout.y;
                      }}
                    >
                      <Text style={[styles.aiMessageText, styles.boxedText, faded && styles.fadedMessage]}>
                        {msg.text}
                      </Text>
                    </View>
                  );
                }

                return (
                  <Text
                    key={i}
                    onLayout={(e) => {
                      messageYs.current[i] = e.nativeEvent.layout.y;
                    }}
                    style={[
                      msg.role === 'ai' ? styles.aiMessageText : styles.userMessageText,
                      faded && styles.fadedMessage,
                    ]}
                  >
                    {msg.text}
                  </Text>
                );
              })}

              {showOptions && (
                <View style={styles.optionRow}>
                  <TouchableOpacity style={styles.optionPill} onPress={onPray} activeOpacity={0.8}>
                    <Text style={styles.optionText}>Tap to pray</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.optionPill} onPress={onVerse} activeOpacity={0.8}>
                    <Text style={styles.optionText}>Look for verses</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </Animated.ScrollView>

      {/* Chat phase: input + Complete pinned at the bottom, above the keyboard */}
      {phase === 'chat' && (
        <View style={[styles.chatBottomBar, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Write"
              placeholderTextColor="#666"
              multiline
              onFocus={() => setTimeout(scrollToFocus, 300)}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: chatInput.trim() ? HOME_ACCENT : '#444444' },
              ]}
              onPress={handleSendChat}
              activeOpacity={0.7}
              disabled={!chatInput.trim()}
            >
              <Text style={[styles.sendButtonText, { color: chatInput.trim() ? '#000000' : '#888888' }]}>↑</Text>
            </TouchableOpacity>
          </View>

          {!keyboardVisible && (
            <TouchableOpacity
              style={[styles.completeButton, styles.completeInBar]}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.completeText}>Complete check-in</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
            <TouchableOpacity style={styles.nextBar} onPress={goToChat} activeOpacity={0.85}>
              <View style={styles.nextButton}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="#000000"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </TouchableOpacity>
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
  scroll: {
    flex: 1,
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
  verseBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#161616', // opaque dark panel, distinct from the chat flow
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  boxedText: {
    marginBottom: 0, // the box provides the spacing
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
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  optionPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Jost_700Bold',
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
  chatBottomBar: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  completeInBar: {
    marginTop: 28,
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
