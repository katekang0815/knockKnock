import BouncingBall from "@/components/BouncingBall";
import { getSessions } from "@/services/beliefStore";
import {
  deleteNote,
  getNotes,
  saveNote,
  updateNote,
  getQuickPrayerCount,
  incrementQuickPrayerCount,
  QUICK_PRAYER_DAILY_LIMIT,
  type Note,
} from "@/services/notesStore";
import { sendChatMessage } from "@/services/aiService";
import type { SessionRecord, ChatEntry } from "@/types/belief";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  runOnJS,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SHAPE_SIZE = 120;

const AnimatedText = Animated.createAnimatedComponent(Text);

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCardDate(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatCardTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// The conversation to show when a card is tapped. Newer sessions store the full
// transcript; older ones fall back to their saved issue / verse / prayer.
function sessionTranscript(s: SessionRecord): ChatEntry[] {
  if (s.transcript && s.transcript.length) return s.transcript;
  const out: ChatEntry[] = [];
  if (s.issue) out.push({ role: "user", text: s.issue });
  if (s.verse) out.push({ role: "ai", text: `${s.verse.reference}  ${s.verse.text}`, kind: "verse" });
  if (s.prayer) out.push({ role: "ai", text: s.prayer, kind: "prayer" });
  return out;
}

// First sentence (or line) of a note, truncated — used as the list preview.
function firstSentence(text: string): string {
  const line = text.trim().split("\n")[0];
  const match = line.match(/^.*?[.!?](\s|$)/);
  const s = (match ? match[0] : line).trim();
  return s.length > 70 ? s.slice(0, 70).trimEnd() + "…" : s;
}

// Serif face used on the cards (matches the reference's Georgia look).
const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

// Header (title + ball) fills most of the screen at rest; the top of the first
// card peeks above the pill bar at the bottom. Dragging up scrolls the sheet
// over the header.
const HEADER_SPACE = SCREEN_H * 0.8;
// The header holds until the top card climbs to mid-screen, then fades/shrinks
// over the rest of the drag (gone by the time the card nears the top).
const FADE_START = HEADER_SPACE - SCREEN_H / 2;
const FADE_END = HEADER_SPACE - 40;
// Approximate footprint of the pill bar (its height + bottom offset), so the fade
// can end at the pill bar's top edge — keeping the card above the pill bar.
const PILL_BAR_FOOTPRINT = 70;

// One warm scheme for every card — a subtle dark warm-brown (lighter top-left →
// darker bottom-right), matching the reference "Vulnerable" card.
// Matches the quick-note popup gradient (charcoal → warm brown).
const CARD_GRADIENT: [string, string] = ["#232222", "#402614"];
const CARD_RADIUS = 28;
// Emotion-label color on the card. Negative categories (Stormy, Rain) use this
// custom color; the rest keep the warm coral (styles.emotionLabel).
const NEGATIVE_EMOTION_COLOR = "#E2BC89";
const NEGATIVE_CATEGORIES = ["Stormy", "Rain"];

// Rounded-rectangle gradient fill, drawn at the card's actual pixel size so the
// corners are always rounded (independent of overflow clipping).
function CardBackground({ id }: { id: string }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const gid = `cg-${id}`;
  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient
              id={gid}
              x1="0"
              y1="0"
              x2={size.w}
              y2={size.h}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={CARD_GRADIENT[0]} />
              <Stop offset="1" stopColor={CARD_GRADIENT[1]} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.w}
            height={size.h}
            rx={CARD_RADIUS}
            ry={CARD_RADIUS}
            fill={`url(#${gid})`}
          />
        </Svg>
      )}
    </View>
  );
}

// Quick-note card background: a vertical gradient #161616 (top) -> #251A12 (bottom).
function NoteCardBackground() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id="noteBg" x1="0" y1="0" x2="0" y2={size.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#232222" />
              <Stop offset="1" stopColor="#402614" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} rx={CARD_RADIUS} ry={CARD_RADIUS} fill="url(#noteBg)" />
        </Svg>
      )}
    </View>
  );
}

// Black → transparent vertical fade, laid over the top of the peeking card so the
// list appears to fade in from the top.
// Clear at the top → full black by `blackAt` (the pill bar's top edge) → stays
// black to the bottom, so nothing shows behind or beside the pill bar.
function TopFade({ height, blackAt }: { height: number; blackAt: number }) {
  return (
    <Svg width={SCREEN_W} height={height}>
      <Defs>
        <LinearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity={0} />
          <Stop offset={blackAt} stopColor="#000000" stopOpacity={1} />
          <Stop offset="1" stopColor="#000000" stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={SCREEN_W} height={height} fill="url(#topFade)" />
    </Svg>
  );
}

// Pill-bar "sliders" icon (two rails with knobs) — opens the Settings hub.
function DotsIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      {/* top rail + knob on the left */}
      <Path d="M4 8.5 L5.7 8.5 M12.3 8.5 L20 8.5" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={9} cy={8.5} r={2.4} stroke="#FFFFFF" strokeWidth={1.6} />
      {/* bottom rail + knob on the right */}
      <Path d="M4 15.5 L11.7 15.5 M18.3 15.5 L20 15.5" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={15} cy={15.5} r={2.4} stroke="#FFFFFF" strokeWidth={1.6} />
    </Svg>
  );
}

// Pill-bar sparkle icon (4-point star) — opens the quick note.
function SparkleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 3 L13.4 10.6 L21 12 L13.4 13.4 L12 21 L10.6 13.4 L3 12 L10.6 10.6 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Quick-note popup (the star button) — a private on-device reflection.
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notePrayer, setNotePrayer] = useState<string | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(false);
  // How many quick prayers have been generated today (daily cap on AI cost).
  const [prayerCount, setPrayerCount] = useState(0);
  const prayerLimitReached = prayerCount >= QUICK_PRAYER_DAILY_LIMIT;
  // When set, the note composer is editing an existing note instead of creating one.
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const closeNote = () => {
    setNoteOpen(false);
    setNoteText("");
    setNotePrayer(null);
    setPrayerLoading(false);
    setEditingNoteId(null);
  };
  const openNote = async () => {
    setPrayerCount(await getQuickPrayerCount());
    setNoteOpen(true);
  };
  const editNote = async (n: Note) => {
    setListOpen(false);
    setPrayerCount(await getQuickPrayerCount());
    setEditingNoteId(n.id);
    setNoteText(n.text);
    setNotePrayer(null); // edit the text; keep any existing prayer via updateNote
    setNoteOpen(true);
  };
  const handleSaveNote = async () => {
    if (editingNoteId) {
      await updateNote(editingNoteId, noteText, notePrayer ?? undefined);
    } else {
      await saveNote(noteText, notePrayer ?? undefined);
    }
    closeNote();
  };
  // Quick prayer: the AI reads the current note text and writes a short prayer
  // from it — no check-in / emotion selection needed.
  const onQuickPrayer = async () => {
    const text = noteText.trim();
    if (!text || prayerLoading) return;
    if (prayerCount >= QUICK_PRAYER_DAILY_LIMIT) return; // daily cap reached
    setPrayerLoading(true);
    try {
      // (b) Front-load the most recent check-in's emotional state as the current
      // context; (a) the prompt tells the AI to draw on the recent check-ins
      // (auto-attached as the recap by sendChatMessage) plus this note.
      const latest = sessions[0];
      // The quick-note prayer follows the NOTE's language: Korean if the user wrote
      // the note in Korean, English otherwise. (The note lives inside an English
      // instruction, so we detect it here and tell the AI explicitly.)
      const isKorean = /[가-힣㄰-㆏]/.test(text);
      const langDirective = isKorean
        ? " Write this prayer in Korean, as a formal prayer (존댓말 / 기도문 형식), referring to God as 하나님, never 당신."
        : " Write this prayer in English.";
      const prayer = await sendChatMessage(
        `The user wrote this personal note: "${text}". Drawing on their recent check-ins (their recent emotional state and what they've been facing) together with this note, write a short, warm, personal first-person prayer (2 to 4 sentences) that brings where they are right now to God. No preamble, just the prayer.` +
          langDirective,
        [],
        { emotion: latest?.emotion ?? "", category: latest?.category ?? "" },
        "prayer",
      );
      setNotePrayer(prayer.trim());
      setPrayerCount(await incrementQuickPrayerCount());
    } catch {
      setNotePrayer(null);
    } finally {
      setPrayerLoading(false);
    }
  };

  // Look back (long-press the star) — a list of saved notes; tap to expand inline.
  const [listOpen, setListOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const openList = async () => {
    setNotes(await getNotes());
    setExpandedId(null);
    setPendingDeleteId(null);
    setListOpen(true);
  };
  const closeList = () => {
    setListOpen(false);
    setExpandedId(null);
    setPendingDeleteId(null);
  };
  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    setNotes(await getNotes());
    setPendingDeleteId(null);
    setExpandedId((cur) => (cur === id ? null : cur));
  };

  // Saved check-ins — the stacked list of cards at the bottom. Tapping a card
  // opens its detail page (/session/[id]).
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSessions().then((list) => {
        if (active) setSessions(list);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // "Knock Knock" — each word taps like a hand hitting a door, with a rest between pairs.
  const knock1 = useSharedValue(0);
  const knock2 = useSharedValue(0);

  // Only buzz while the home screen is actually focused (the loop keeps running
  // in the background when navigated away, so gate the haptic on focus).
  const isFocused = useIsFocused();
  const focusedSV = useSharedValue(1);
  useEffect(() => {
    focusedSV.value = isFocused ? 1 : 0;
  }, [isFocused, focusedSV]);

  useEffect(() => {
    // Synced to BouncingBall: it loops every 2500ms and lands on a stair every
    // 625ms (4 contacts). The two "Knock" taps fire on the first two contacts so
    // the text knocks exactly when the ball hits the stairs.
    const CYCLE = 2500;  // matches BouncingBall's climb loop
    const LAND = 625;    // interval between stair contacts (CYCLE / 4)
    const HIT = 80;      // fist meeting the door
    const RELEASE = 200; // pulling back
    const TAP = HIT + RELEASE;

    const knockHit = () =>
      withSequence(
        withTiming(1, { duration: HIT, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: RELEASE, easing: Easing.out(Easing.quad) }),
      );

    // Knock 1 — taps on the ball's first contact, then waits out the loop.
    knock1.value = withRepeat(
      withSequence(knockHit(), withTiming(0, { duration: CYCLE - TAP })),
      -1,
      false,
    );

    // Knock 2 — taps on the ball's next contact (one stair later), same loop.
    knock2.value = withDelay(
      LAND,
      withRepeat(
        withSequence(knockHit(), withTiming(0, { duration: CYCLE - TAP })),
        -1,
        false,
      ),
    );
  }, []);

  // Medium impact haptic on each knock — i.e. when the ball hits a stair.
  useAnimatedReaction(
    () => knock1.value > 0.5,
    (cur, prev) => {
      if (cur && !prev && focusedSV.value === 1) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
  );
  useAnimatedReaction(
    () => knock2.value > 0.5,
    (cur, prev) => {
      if (cur && !prev && focusedSV.value === 1) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
  );

  const knock1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -knock1.value * 5 },
      { scale: 1 + knock1.value * 0.08 },
    ],
  }));

  const knock2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -knock2.value * 5 },
      { scale: 1 + knock2.value * 0.08 },
    ],
  }));

  // Scroll position drives the header collapse: drag the card sheet up and the
  // title + ball shrink and fade; drag down and they come back.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const headerAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [FADE_START, FADE_END], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [FADE_START, FADE_END], [0, -70], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [FADE_START, FADE_END], [1, 0.82], Extrapolation.CLAMP) },
    ],
  }));
  // Fade spans from the peek card's top all the way to the screen bottom: clear
  // at the top, full black by the pill bar's top edge, black underneath it.
  const fadeTotalH = SCREEN_H - HEADER_SPACE;
  const pillTop = SCREEN_H - insets.bottom - PILL_BAR_FOOTPRINT;
  const fadeBlackAt = Math.min(0.9, Math.max(0.1, (pillTop - HEADER_SPACE) / fadeTotalH));

  return (
    <View style={styles.container}>
      {/* Collapsing header (title + ball) — pinned behind the sheet, fades on drag */}
      <Animated.View style={[StyleSheet.absoluteFill, headerAnim]} pointerEvents="none">
        <View style={[styles.titleContainer, { top: insets.top + 20 + 96 }]}>
          <View style={styles.titleLine}>
            <Animated.View style={knock1Style}>
              <Text style={styles.titleKnock}>Knock</Text>
            </Animated.View>
            <Text style={styles.titleKnock}>{' '}</Text>
            <Animated.View style={knock2Style}>
              <Text style={styles.titleKnock}>Knock</Text>
            </Animated.View>
          </View>
          <WhisperGradientText id="whisperGrad" />
        </View>

        <Text style={[styles.tapText, { top: insets.top + 20 + 96 + 130 }]}>
          Tap anywhere to start
        </Text>

        <View style={[styles.shapeContainer, { bottom: 280 }]}>
          <BouncingBall size={SHAPE_SIZE * 2} />
        </View>
      </Animated.View>

      {/* Foreground sheet — transparent spacer over the header, then the cards */}
      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 90, // clear the pill bar
          minHeight: SCREEN_H + HEADER_SPACE,
        }}
      >
        {/* Tapping the header area starts a check-in */}
        <TouchableWithoutFeedback onPress={() => router.push("/checkin")}>
          <View style={{ height: HEADER_SPACE }} />
        </TouchableWithoutFeedback>

        <View style={styles.cardListContent}>
          {sessions.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              style={styles.card}
              onPress={() => router.push(`/session/${s.id}`)}
            >
              <CardBackground id={s.id} />
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.cardDate}>{formatCardDate(s.date)}</Text>
                  <Text style={styles.cardTime}>{formatCardTime(s.date)}</Text>
                </View>
                <Text
                  style={[
                    styles.emotionLabel,
                    NEGATIVE_CATEGORIES.includes(s.category) && {
                      color: NEGATIVE_EMOTION_COLOR,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {s.emotion}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Fixed fade just above the pill bar — cards fade into black here as they
          scroll behind the bar, no matter where the stack top is. */}
      <View style={[styles.topFade, { top: HEADER_SPACE }]} pointerEvents="none">
        <TopFade height={fadeTotalH} blackAt={fadeBlackAt} />
      </View>

      {/* Bottom pill bar — ··· (settings) on the left, + (quick note) on the right */}
      <View style={[styles.pillBarWrap, { bottom: insets.bottom }]} pointerEvents="box-none">
        <View style={styles.pillBar}>
          <TouchableOpacity
            style={styles.pillIconBox}
            activeOpacity={0.7}
            onPress={() => router.push("/settings")}
          >
            <DotsIcon />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.pillIconBox}
            activeOpacity={0.7}
            onPress={openNote}
            onLongPress={openList}
            delayLongPress={350}
          >
            <SparkleIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick-note popup (star button) — a private reflection saved on-device. */}
      <Modal
        visible={noteOpen}
        transparent
        animationType="fade"
        onRequestClose={closeNote}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.noteBackdrop, { paddingTop: insets.top + 30 }]}
        >
          <View style={styles.noteCard}>
            <NoteCardBackground />
            {prayerLoading ? (
              <View style={styles.notePrayerBox}>
                <ActivityIndicator color="#E0E0E0" />
              </View>
            ) : notePrayer ? (
              // Once the prayer is generated, the note is locked (not editable).
              <View style={styles.notePrayerBox}>
                <Text style={styles.notePrayerText}>{notePrayer}</Text>
              </View>
            ) : (
              <TextInput
                style={styles.noteInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="What's in your mind? Quick note for this moment..."
                placeholderTextColor="#8A8074"
                selectionColor="#FFFFFF"
                cursorColor="#FFFFFF"
                multiline
                autoFocus
                textAlignVertical="top"
              />
            )}
            {/* Actions: quick prayer (once per session), with save on the right */}
            <View style={styles.noteActions}>
              <View style={styles.notePills}>
                {!notePrayer && !prayerLoading && (
                  prayerLimitReached ? (
                    <Text style={styles.notePillLimit}>Daily prayer limit reached</Text>
                  ) : (
                    <TouchableOpacity style={styles.notePill} onPress={onQuickPrayer} activeOpacity={0.8}>
                      <Text style={styles.notePillText}>Quick Prayer</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
              <TouchableOpacity style={styles.noteSave} onPress={handleSaveNote} activeOpacity={0.8}>
                <Svg width={26} height={26} viewBox="0 0 24 24">
                  <Path
                    d="M5 13 l4 4 L19 7"
                    stroke="#E0E0E0"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Look-back list (long-press the star) — saved notes; tap one to read it. */}
      <Modal
        visible={listOpen}
        transparent
        animationType="fade"
        onRequestClose={closeList}
        statusBarTranslucent
      >
        <View style={[styles.noteBackdrop, { paddingTop: insets.top + 30 }]}>
          <View style={styles.noteCard}>
            <NoteCardBackground />

            {/* Close */}
            <TouchableOpacity style={styles.noteListClose} onPress={closeList} activeOpacity={0.7}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path d="M6 6 L18 18 M18 6 L6 18" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.noteListTitle}>Your notes</Text>
            {notes.length === 0 ? (
              <Text style={styles.noteEmpty}>No notes yet. Tap the star to write one.</Text>
            ) : (
              <ScrollView style={styles.noteListScroll} contentContainerStyle={{ paddingBottom: 16 }}>
                {notes.map((n) => {
                  const expanded = expandedId === n.id;
                  const pending = pendingDeleteId === n.id;
                  return (
                    <View key={n.id} style={styles.noteItem}>
                      <TouchableOpacity
                        onPress={() => {
                          setPendingDeleteId(null);
                          setExpandedId(expanded ? null : n.id);
                        }}
                        onLongPress={() => setPendingDeleteId(n.id)}
                        delayLongPress={350}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.noteItemDate}>
                          {formatCardDate(n.date)}  ·  {formatCardTime(n.date)}
                        </Text>
                        {/* Collapsed: first sentence. Expanded: the full note, spread down. */}
                        <Text style={styles.noteItemPreview} numberOfLines={expanded ? undefined : 1}>
                          {expanded ? n.text : firstSentence(n.text)}
                        </Text>
                        {/* Expanded: the saved quick prayer, if any. */}
                        {expanded && n.prayer ? (
                          <Text style={styles.noteItemPrayer}>{n.prayer}</Text>
                        ) : null}
                      </TouchableOpacity>

                      {pending && (
                        <View style={styles.noteDeleteRow}>
                          <TouchableOpacity onPress={() => handleDeleteNote(n.id)} activeOpacity={0.7}>
                            <Text style={styles.noteDeleteText}>Delete</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => editNote(n)} activeOpacity={0.7}>
                            <Text style={styles.noteEditText}>Edit</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Renders "whenever you're ready" with a vertical gradient matching BouncingBall's
// warmGrad: coral (#DB533C) → dusty rose (#C78E7D) → cream (#FFF7CE).
function WhisperGradientText({ id }: { id: string }) {
  return (
    <Svg width={320} height={32} viewBox="0 0 320 32">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DB533C" />
          <Stop offset="0.5" stopColor="#C78E7D" />
          <Stop offset="1" stopColor="#FFF7CE" />
        </LinearGradient>
      </Defs>
      <SvgText
        x={160}
        y={23}
        fontSize={24}
        fontFamily="Jost_700Bold"
        textAnchor="middle"
        fill={`url(#${id})`}
      >
        whenever you&apos;re ready
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  titleContainer: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 35,
    gap: 8,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleKnock: {
    color: "#FFFFFF",
    fontSize: 44,
    fontFamily: "Jost_700Bold",
    lineHeight: 52,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  tapText: {
    position: "absolute",
    alignSelf: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontFamily: "Jost_400Regular",
    letterSpacing: 1,
  },
  shapeContainer: {
    position: "absolute",
    alignSelf: "center",
  },
  topFade: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
  },
  pillBarWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 80,
  },
  pillBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 32,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pillIcon: {
    padding: 4,
  },
  pillIconBox: {
    padding: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  noteBackdrop: {
    flex: 1,
    backgroundColor: "#000000", // dark frame around the floating card
    paddingHorizontal: 20, // 20px on both side edges
    // NOTE: no paddingBottom here — KeyboardAvoidingView overrides it with the
    // keyboard height. The 20px keyboard gap lives on the card's marginBottom.
  },
  noteCard: {
    flex: 1,
    marginBottom: 20, // 20px gap above the keyboard (KAV-safe)
    borderRadius: 28,
    overflow: "hidden",
    padding: 24,
  },
  noteInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 26,
    fontFamily: "Jost_400Regular",
    paddingTop: 2,
    marginBottom: 50, // shorten the typing area so it clears the bottom / save button
  },
  notePrayerBox: {
    flex: 1,
    marginBottom: 50,
    paddingTop: 2,
    justifyContent: "center",
  },
  notePrayerText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 27,
    fontFamily: "Jost_400Regular_Italic",
  },
  noteItemPrayer: {
    color: "#C9BCA9",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Jost_400Regular_Italic",
    marginTop: 8,
  },
  noteActions: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notePills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  notePill: {
    height: 52, // match the save button height
    borderRadius: 26,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)", // match the pill-bar star button
  },
  notePillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Jost_600SemiBold",
  },
  notePillLimit: {
    color: "#8A8074",
    fontSize: 13,
    fontFamily: "Jost_400Regular",
  },
  noteSave: {
    width: 52,
    height: 52,
    borderRadius: 26, // round
    backgroundColor: "rgba(255,255,255,0.06)", // match the pill-bar star button
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  noteListClose: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  noteListTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Jost_700Bold",
    marginTop: 4,
    marginBottom: 14,
    paddingRight: 44,
  },
  noteEmpty: {
    color: "#8A8074",
    fontSize: 15,
    fontFamily: "Jost_400Regular",
    marginTop: 6,
  },
  noteListScroll: {
    flex: 1,
  },
  noteItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  noteItemDate: {
    color: "#B8AC9E",
    fontSize: 13,
    fontFamily: "Jost_400Regular",
    marginBottom: 5,
  },
  noteItemPreview: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Jost_400Regular",
  },
  noteDeleteRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 24,
  },
  noteDeleteText: {
    color: "#E8614D",
    fontSize: 15,
    fontFamily: "Jost_600SemiBold",
  },
  noteEditText: {
    color: "#E0967D",
    fontSize: 15,
    fontFamily: "Jost_600SemiBold",
  },
  cardListContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: 75,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardDate: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: SERIF,
    fontWeight: "600",
  },
  cardTime: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: SERIF,
    marginTop: 2,
  },
  emotionLabel: {
    color: "#FF9A7B",
    fontSize: 24,
    fontFamily: SERIF,
    fontStyle: "italic",
    maxWidth: "55%",
    textAlign: "right",
  },
  verseText: {
    color: "#EFE7DC",
    fontSize: 15,
    fontFamily: "Jost_400Regular",
    lineHeight: 22,
    marginTop: 24,
  },
  verseRef: {
    fontFamily: "Jost_700Bold",
  },

  /* Inline expanded transcript inside a card */
  cardTranscript: { marginTop: 16 },
  txButtons: { flexDirection: "row", marginTop: 8, marginBottom: 4 },
  dotsBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Session detail modal (unused after inline expansion, kept for styles) */
  sessionBackdrop: { flex: 1, backgroundColor: "#000000" },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  sessionDate: { color: "#FFFFFF", fontSize: 15, fontFamily: "Jost_600SemiBold" },
  sessionEmotion: { color: "#E0967D", fontSize: 26, fontFamily: SERIF, fontStyle: "italic", marginTop: 2 },
  sessionClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
  },
  tUserRow: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  tUserBubble: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 25,
    fontFamily: "Jost_400Regular_Italic",
  },
  tAiText: {
    color: "#EFE7DC",
    fontSize: 15,
    lineHeight: 23,
    fontFamily: "Jost_400Regular",
    marginVertical: 8,
    paddingRight: "10%",
  },
  tVerseCard: {
    backgroundColor: "#1A1512",
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
  },
  tVerseRef: { color: "#E0967D", fontSize: 15, fontFamily: "Jost_700Bold", marginBottom: 6 },
  tVerseText: { color: "#EFE7DC", fontSize: 15, lineHeight: 23, fontFamily: "Jost_400Regular" },
  tPrayerCard: {
    backgroundColor: "#2B2018",
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
  },
  tPrayer: {
    color: "#EFE7DC",
    fontSize: 16,
    lineHeight: 25,
    fontFamily: "Jost_400Regular_Italic",
  },
});

