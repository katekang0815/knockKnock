import BouncingBall from "@/components/BouncingBall";
import { getSessions } from "@/services/beliefStore";
import { deleteNote, getNotes, saveNote, type Note } from "@/services/notesStore";
import type { SessionRecord } from "@/types/belief";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
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

// Friend invite. TODO: swap INVITE_URL for the App Store link once the app is live.
const INVITE_URL = "https://katekang0815.github.io/knockKnock/";
const INVITE_MESSAGE = `Join me on KnockKnock — a daily prayer & reflection space. 🙏\n${INVITE_URL}`;

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

// Placeholder settings icon (hexagon).
function SettingsIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2 L20.5 7 L20.5 17 L12 22 L3.5 17 L3.5 7 Z"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M12 7 L16.3 9.5 L16.3 14.5 L12 17 L7.7 14.5 L7.7 9.5 Z"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Placeholder sparkle icon (4-point star).
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

// Placeholder "Friends" icon (two people, outline).
function FriendsIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7.5" r="3" stroke="#FFFFFF" strokeWidth={1.7} />
      <Path
        d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2"
        stroke="#FFFFFF"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Circle cx="16.9" cy="9" r="2.3" stroke="#FFFFFF" strokeWidth={1.7} />
      <Path
        d="M16.9 13.9c2.6 0 4.6 1.9 4.6 4.6"
        stroke="#FFFFFF"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Quick-note popup (the star button) — a private on-device reflection.
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const closeNote = () => {
    setNoteOpen(false);
    setNoteText("");
  };
  const handleSaveNote = async () => {
    await saveNote(noteText);
    closeNote();
  };
  // TODO: wire these — e.g. generate a prayer / find a verse from the note text.
  const onQuickPrayer = () => {};
  const onLookVerses = () => {};

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

  // Invite a friend (Friends button) — share the invite link or copy it. No backend.
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeFriends = () => {
    setFriendsOpen(false);
    setCopied(false);
  };
  const handleShareInvite = async () => {
    try {
      await Share.share({ message: INVITE_MESSAGE, url: INVITE_URL });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };
  const handleCopyInvite = async () => {
    await Clipboard.setStringAsync(INVITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Saved check-ins — the stacked list of cards at the bottom.
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
            <TouchableOpacity key={s.id} activeOpacity={1} style={styles.card}>
              <CardBackground id={s.id} />
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.cardDate}>{formatCardDate(s.date)}</Text>
                  <Text style={styles.cardTime}>{formatCardTime(s.date)}</Text>
                </View>
                <Text style={styles.emotionLabel} numberOfLines={1}>
                  {s.emotion}
                </Text>
              </View>
              {s.verse ? (
                <Text style={styles.verseText}>
                  <Text style={styles.verseRef}>{s.verse.reference}  </Text>
                  {s.verse.text}
                </Text>
              ) : s.prayer ? (
                <Text style={styles.verseText}>{s.prayer}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Fixed fade just above the pill bar — cards fade into black here as they
          scroll behind the bar, no matter where the stack top is. */}
      <View style={[styles.topFade, { top: HEADER_SPACE }]} pointerEvents="none">
        <TopFade height={fadeTotalH} blackAt={fadeBlackAt} />
      </View>

      {/* Bottom pill bar — Friends + placeholders (settings, sparkle) */}
      <View style={[styles.pillBarWrap, { bottom: insets.bottom }]} pointerEvents="box-none">
        <View style={styles.pillBar}>
          <TouchableOpacity
            style={styles.pillIcon}
            activeOpacity={0.7}
            onPress={() => router.push("/settings")}
          >
            <SettingsIcon />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.pillIconBox}
            activeOpacity={0.7}
            onPress={() => setNoteOpen(true)}
            onLongPress={openList}
            delayLongPress={350}
          >
            <SparkleIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillIcon, { marginLeft: 18 }]}
            activeOpacity={0.7}
            onPress={() => setFriendsOpen(true)}
          >
            <FriendsIcon />
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
            {/* Actions: quick prayer / look for verses, with save on the right */}
            <View style={styles.noteActions}>
              <View style={styles.notePills}>
                <TouchableOpacity style={styles.notePill} onPress={onQuickPrayer} activeOpacity={0.8}>
                  <Text style={styles.notePillText}>Quick prayer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.notePill} onPress={onLookVerses} activeOpacity={0.8}>
                  <Text style={styles.notePillText}>Look for verses</Text>
                </TouchableOpacity>
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
                      </TouchableOpacity>

                      {pending && (
                        <View style={styles.noteDeleteRow}>
                          <TouchableOpacity onPress={() => handleDeleteNote(n.id)} activeOpacity={0.7}>
                            <Text style={styles.noteDeleteText}>Delete</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setPendingDeleteId(null)} activeOpacity={0.7}>
                            <Text style={styles.noteCancelText}>Cancel</Text>
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

      {/* Invite a friend (Friends button) — share or copy the invite link. */}
      <Modal
        visible={friendsOpen}
        transparent
        animationType="fade"
        onRequestClose={closeFriends}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeFriends}>
          <View style={styles.friendsBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.friendsCard}>
                <Text style={styles.friendsTitle}>Invite a friend</Text>
                <Text style={styles.friendsSubtitle}>
                  Share KnockKnock with someone you care about.
                </Text>

                <TouchableOpacity
                  style={styles.friendsShareBtn}
                  onPress={handleShareInvite}
                  activeOpacity={0.85}
                >
                  <Text style={styles.friendsShareText}>Share invite link</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.friendsCopyBtn}
                  onPress={handleCopyInvite}
                  activeOpacity={0.7}
                >
                  <Text style={styles.friendsCopyText}>
                    {copied ? "Link copied ✓" : "Copy link"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  notePillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Jost_600SemiBold",
  },
  noteSave: {
    width: 52,
    height: 52,
    borderRadius: 26, // round
    backgroundColor: "#2E2A26", // opaque fill (no border)
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
  noteCancelText: {
    color: "#9A9A9A",
    fontSize: 15,
    fontFamily: "Jost_400Regular",
  },
  friendsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  friendsCard: {
    width: "100%",
    backgroundColor: "#1E1C1A",
    borderRadius: 24,
    paddingTop: 26,
    paddingBottom: 22,
    paddingHorizontal: 22,
  },
  friendsTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: "Jost_700Bold",
    textAlign: "center",
  },
  friendsSubtitle: {
    color: "#B8AC9E",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Jost_400Regular",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },
  friendsShareBtn: {
    backgroundColor: "#DB533C",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  friendsShareText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Jost_600SemiBold",
  },
  friendsCopyBtn: {
    backgroundColor: "#2E2A26",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  friendsCopyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Jost_600SemiBold",
  },
  cardListContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: 150,
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
    fontSize: 28,
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
});

