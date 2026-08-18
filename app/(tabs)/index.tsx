import BouncingBall from "@/components/BouncingBall";
import { getSessions } from "@/services/beliefStore";
import type { SessionRecord } from "@/types/belief";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
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
const CARD_GRADIENT: [string, string] = ["#372A1C", "#211710"];
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
              {s.verse && (
                <Text style={styles.verseText}>
                  <Text style={styles.verseRef}>{s.verse.reference}  </Text>
                  {s.verse.text}
                </Text>
              )}
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
          <TouchableOpacity style={styles.pillIcon} activeOpacity={0.7} onPress={() => {}}>
            <SettingsIcon />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.pillIconBox} activeOpacity={0.7} onPress={() => {}}>
            <SparkleIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillIcon, { marginLeft: 18 }]}
            activeOpacity={0.7}
            onPress={() => {}}
          >
            <FriendsIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* Back arrow — always on top and tappable */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => router.replace("/splash")}
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

