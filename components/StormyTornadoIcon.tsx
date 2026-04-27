import { useEffect } from 'react';
import Svg, {
  Path,
  G,
  Defs,
  ClipPath,
  Rect,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  size: number;
  borderRadius?: number;
}

const SKY_TOP = '#9DB3C4';
const SKY_BOTTOM = '#C0CFD9';
const GROUND = '#D9E2E8';
const TORNADO_DARK = '#1F2D44';
const TORNADO_MID = '#3A4D6E';
const SPIRAL_LIGHT = '#A0B5C8';
const SPIRAL_DARK = '#2A3A55';
const DEBRIS = '#4A5B70';
const STORM_CLOUD = '#3A4D6E';

const TORNADO_PATH = `
  M 18 12
  Q 50 6 82 12
  C 78 18 70 22 64 26
  C 60 36 56 48 52 60
  C 51 70 50 80 49 92
  L 51 92
  C 52 80 53 70 54 60
  C 56 48 60 36 64 26
  C 70 22 78 18 82 12
  Z
`;

/**
 * Generate a wavy band path at given y, with horizontal offset baked in.
 * Period 25 units → seamless loop when offset cycles 0 → 25.
 */
function makeBandPath(y: number, offset: number, amplitude: number): string {
  'worklet';
  const startX = -50;
  const endX = 150;
  const step = 12.5;
  let d = `M ${startX} ${y.toFixed(1)}`;
  for (let x = startX + step; x <= endX; x += step) {
    const phase = ((x + offset) / 25) * Math.PI * 2;
    const cpX = x - step / 2;
    const cpPhase = ((cpX + offset) / 25) * Math.PI * 2;
    const targetY = y + Math.sin(phase) * amplitude;
    const cpY = y + Math.sin(cpPhase) * amplitude * 1.4;
    d += ` Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${x.toFixed(1)} ${targetY.toFixed(1)}`;
  }
  return d;
}

const BANDS = [
  { y: 14, color: SPIRAL_LIGHT, opacity: 0.6, width: 1.2, amp: 2.0 },
  { y: 22, color: SPIRAL_DARK, opacity: 0.6, width: 1.0, amp: 2.2 },
  { y: 32, color: SPIRAL_LIGHT, opacity: 0.7, width: 1.1, amp: 2.4 },
  { y: 44, color: SPIRAL_DARK, opacity: 0.65, width: 1.0, amp: 2.4 },
  { y: 56, color: SPIRAL_LIGHT, opacity: 0.75, width: 0.9, amp: 2.2 },
  { y: 68, color: SPIRAL_DARK, opacity: 0.65, width: 0.8, amp: 1.8 },
  { y: 80, color: SPIRAL_LIGHT, opacity: 0.7, width: 0.7, amp: 1.5 },
];

export default function StormyTornadoIcon({ size, borderRadius = 24 }: Props) {
  const spiralT = useSharedValue(0);

  useEffect(() => {
    // Cycle through one full band period (25 units) every 1.5s — seamless loop
    spiralT.value = withRepeat(
      withTiming(25, { duration: 1500, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // Each band gets its own animated 'd' prop derived from spiralT
  const band0Props = useAnimatedProps(() => ({
    d: makeBandPath(BANDS[0].y, spiralT.value, BANDS[0].amp),
  }));
  const band1Props = useAnimatedProps(() => ({
    d: makeBandPath(BANDS[1].y, spiralT.value, BANDS[1].amp),
  }));
  const band2Props = useAnimatedProps(() => ({
    d: makeBandPath(BANDS[2].y, spiralT.value, BANDS[2].amp),
  }));
  const band3Props = useAnimatedProps(() => ({
    d: makeBandPath(BANDS[3].y, spiralT.value, BANDS[3].amp),
  }));
  const band4Props = useAnimatedProps(() => ({
    d: makeBandPath(BANDS[4].y, spiralT.value, BANDS[4].amp),
  }));
  const band5Props = useAnimatedProps(() => ({
    d: makeBandPath(BANDS[5].y, spiralT.value, BANDS[5].amp),
  }));
  const band6Props = useAnimatedProps(() => ({
    d: makeBandPath(BANDS[6].y, spiralT.value, BANDS[6].amp),
  }));

  const bandPropsList = [
    band0Props,
    band1Props,
    band2Props,
    band3Props,
    band4Props,
    band5Props,
    band6Props,
  ];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="cardClip">
          <Rect x={0} y={0} width={100} height={100} rx={borderRadius} />
        </ClipPath>
        <ClipPath id="tornadoClip">
          <Path d={TORNADO_PATH} />
        </ClipPath>
        <LinearGradient id="skyGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={SKY_TOP} />
          <Stop offset="1" stopColor={SKY_BOTTOM} />
        </LinearGradient>
        <LinearGradient id="tornadoGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={TORNADO_DARK} />
          <Stop offset="0.6" stopColor={TORNADO_MID} />
          <Stop offset="1" stopColor={DEBRIS} />
        </LinearGradient>
      </Defs>

      {/* Sky background */}
      <Rect
        x={0}
        y={0}
        width={100}
        height={100}
        rx={borderRadius}
        fill="url(#skyGrad)"
      />

      <G clipPath="url(#cardClip)">
        {/* Storm cloud at top */}
        <G fill={STORM_CLOUD} opacity={0.9}>
          <Path d="M 0 -2 Q 18 6 34 4 Q 50 10 70 6 Q 88 2 100 8 L 100 18 Q 80 16 60 18 Q 40 20 20 16 Q 8 14 0 18 Z" />
          <Path
            d="M 12 8 Q 28 14 46 12 Q 64 10 82 14 L 82 22 Q 60 18 40 22 Q 20 20 12 16 Z"
            opacity={0.6}
          />
        </G>

        {/* Distant horizon / ground */}
        <Path d="M 0 78 Q 50 74 100 78 L 100 100 L 0 100 Z" fill={GROUND} />

        {/* Tornado funnel base fill */}
        <Path d={TORNADO_PATH} fill="url(#tornadoGrad)" />

        {/* Animated spiral bands clipped to tornado shape */}
        <G clipPath="url(#tornadoClip)">
          {BANDS.map((band, i) => (
            <AnimatedPath
              key={i}
              animatedProps={bandPropsList[i]}
              stroke={band.color}
              strokeWidth={band.width}
              fill="none"
              strokeLinecap="round"
              opacity={band.opacity}
            />
          ))}
        </G>

        {/* Debris swirl at tornado base */}
        <G fill={DEBRIS} opacity={0.75}>
          <Path d="M 30 80 Q 42 76 55 80 Q 68 78 74 84 Q 62 88 50 86 Q 38 88 28 84 Z" />
          <Path
            d="M 38 86 L 44 82 L 50 86 L 56 82 L 62 86 L 56 90 L 48 90 Z"
            opacity={0.5}
          />
        </G>

        {/* Flying debris pieces */}
        <G fill={TORNADO_DARK}>
          <Path d="M 70 70 l 2 -1 l 1 2 z" opacity={0.7} />
          <Path d="M 28 68 l -2 -1 l 1 2 z" opacity={0.6} />
          <Path d="M 78 60 l 2 -1 l -1 2 z" opacity={0.5} />
          <Path d="M 18 76 l 2 -1 l -1 2 z" opacity={0.6} />
        </G>

        {/* Rain streaks */}
        <G stroke="#FFFFFF" strokeWidth={0.4} strokeLinecap="round" opacity={0.55}>
          <Path d="M 10 70 l 1 4" />
          <Path d="M 16 78 l 1 4" />
          <Path d="M 80 75 l 1 4" />
          <Path d="M 88 72 l 1 4" />
          <Path d="M 92 82 l 1 4" />
          <Path d="M 6 86 l 1 4" />
          <Path d="M 14 92 l 1 4" />
          <Path d="M 84 90 l 1 4" />
        </G>

        {/* Birds */}
        <G stroke={TORNADO_DARK} strokeWidth={0.7} fill="none" strokeLinecap="round">
          <Path d="M 78 30 l 1.5 -1 l 1.5 1" />
          <Path d="M 84 40 l 1.2 -0.8 l 1.2 0.8" />
          <Path d="M 14 36 l 1.4 -0.9 l 1.4 0.9" />
          <Path d="M 22 50 l 1.3 -0.8 l 1.3 0.8" />
        </G>
      </G>
    </Svg>
  );
}
