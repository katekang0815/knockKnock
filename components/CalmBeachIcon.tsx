import { useEffect } from 'react';
import Svg, {
  Path,
  G,
  Defs,
  ClipPath,
  Rect,
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

const SKY = '#DCE7DC';
const SAND_LIGHT = '#F5EAD0';
const SAND_MID = '#E8D5A8';
const CLOUD_CORAL = '#F2A48A';
const CLOUD_CORAL_SHADOW = '#E0866C';
const CLOUD_PINK = '#F5C5B0';
const BIRD_COLOR = '#1F2D44';

/**
 * Generate a V-shape bird (gull silhouette) at given center,
 * with horizontal width `w` and slight upward arc.
 */
function birdPath(cx: number, cy: number, w: number): string {
  'worklet';
  return `M ${(cx - w).toFixed(1)} ${cy.toFixed(1)} Q ${cx.toFixed(1)} ${(cy - w * 0.7).toFixed(1)} ${(cx + w).toFixed(1)} ${cy.toFixed(1)}`;
}

export default function CalmBeachIcon({ size, borderRadius = 24 }: Props) {
  const birdT = useSharedValue(0);

  useEffect(() => {
    // Loops 0 → 1 every 9s — birds drift across the sky
    birdT.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // Bird 1 — smaller, leading. Travels from off-screen-left to off-screen-right.
  const bird1Props = useAnimatedProps(() => ({
    d: birdPath(-15 + birdT.value * 135, 22, 2.5),
  }));

  // Bird 2 — larger, slightly behind. Offset start.
  const bird2Props = useAnimatedProps(() => ({
    d: birdPath(-30 + birdT.value * 135, 17, 3.5),
  }));

  // Bird 3 — small mid-scene bird, slower drift in the middle area.
  const bird3Props = useAnimatedProps(() => ({
    d: birdPath(-20 + birdT.value * 130 * 0.85, 50, 2),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="calmBeachClip">
          <Rect x={0} y={0} width={100} height={100} rx={borderRadius} />
        </ClipPath>
      </Defs>

      {/* Mint sky background */}
      <Rect x={0} y={0} width={100} height={100} rx={borderRadius} fill={SKY} />

      <G clipPath="url(#calmBeachClip)">
        {/* Coral/salmon main cloud */}
        <Path
          d="M 25 46
             C 22 33 32 31 36 37
             C 38 29 50 29 53 36
             C 56 31 68 33 65 43
             C 70 41 75 45 72 50
             L 25 50 Z"
          fill={CLOUD_CORAL}
        />

        {/* Cloud darker shadow underneath */}
        <Path
          d="M 25 50
             L 72 50
             Q 70 52 65 51
             Q 50 53 35 51
             Q 28 52 25 50 Z"
          fill={CLOUD_CORAL_SHADOW}
          opacity={0.55}
        />

        {/* Smaller pink cloud on right */}
        <Path
          d="M 78 50
             Q 80 45 84 47
             Q 88 44 90 50
             L 78 50 Z"
          fill={CLOUD_PINK}
        />

        {/* Animated birds — fly left → right */}
        <AnimatedPath
          animatedProps={bird1Props}
          stroke={BIRD_COLOR}
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={bird2Props}
          stroke={BIRD_COLOR}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={bird3Props}
          stroke={BIRD_COLOR}
          strokeWidth={1.0}
          fill="none"
          strokeLinecap="round"
        />

        {/* Sand dunes — back wave (lighter cream) */}
        <Path
          d="M 0 78
             Q 30 72 60 80
             Q 80 76 100 78
             L 100 100
             L 0 100 Z"
          fill={SAND_LIGHT}
        />

        {/* Sand dunes — front wave (warmer tan) */}
        <Path
          d="M 0 88
             Q 25 84 50 90
             Q 75 86 100 88
             L 100 100
             L 0 100 Z"
          fill={SAND_MID}
        />
      </G>
    </Svg>
  );
}
