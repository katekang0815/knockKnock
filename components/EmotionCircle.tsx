import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, {
  Rect,
  Circle,
  Defs,
  ClipPath,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

interface EmotionCircleProps {
  label: string;
  category: string;
  gradientStart?: string;
  gradientEnd?: string;
  size: number;
  // Position/focus props (optional — cell becomes static if omitted)
  baseX?: number;
  baseY?: number;
  translateX?: SharedValue<number>;
  translateY?: SharedValue<number>;
  focusX?: number;
  focusY?: number;
}

// --- Frost grain pre-computed once at module load ---

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// Grain positions in 0–100 viewBox space, shared by every cell
const FROST_GRAIN = Array.from({ length: 45 }, (_, i) => ({
  x: seededRandom(i * 13) * 100,
  y: seededRandom(i * 17 + 1) * 100,
  r: 0.25 + seededRandom(i * 23 + 2) * 0.7,
  opacity: 0.08 + seededRandom(i * 31 + 3) * 0.3,
  bright: seededRandom(i * 41 + 5) > 0.4,
}));

// Per-category label color
const LABEL_COLORS: Record<string, string> = {
  Sunny: '#F5D960',   // warm yellow
  Stormy: '#E85050',  // red
  Calm: '#FFFFFF',    // white (Rain)
  Breezy: '#F58A6C',  // coral (Breeze)
};

function EmotionCircleComponent({
  label,
  category,
  size,
  baseX,
  baseY,
  translateX,
  translateY,
  focusX,
  focusY,
}: EmotionCircleProps) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/emotionlog',
      params: { emotion: label, category },
    });
  }, [label, category]);

  const labelColor = useMemo(
    () => LABEL_COLORS[category] ?? '#FFFFFF',
    [category],
  );

  const isAnimated =
    baseX !== undefined &&
    baseY !== undefined &&
    translateX !== undefined &&
    translateY !== undefined &&
    focusX !== undefined &&
    focusY !== undefined;

  // Scale up at focus, shrink further away.
  // The (harmless) hook call must be unconditional — the fallback style is a no-op.
  const animatedStyle = useAnimatedStyle(() => {
    if (!isAnimated) return { transform: [{ scale: 1 }] };
    const cx = baseX! + translateX!.value;
    const cy = baseY! + translateY!.value;
    const dx = cx - focusX!;
    const dy = cy - focusY!;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scale = interpolate(
      dist,
      [0, size * 0.7, size * 1.6, size * 3],
      [1.45, 1.2, 0.85, 0.6],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: 14,
            overflow: 'hidden',
          },
          animatedStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <ClipPath id="cellClip">
              <Rect x={0} y={0} width={100} height={100} rx={14} />
            </ClipPath>
            {/* Warm dark radial gradient — brighter center fading to darker edges */}
            <RadialGradient
              id="cellBg"
              cx="0.5"
              cy="0.5"
              r="0.7"
              gradientUnits="objectBoundingBox"
            >
              <Stop offset="0" stopColor="#3A2320" />
              <Stop offset="1" stopColor="#170D0B" />
            </RadialGradient>
            {/* Frost edge vignette — subtle brighter rim */}
            <RadialGradient
              id="frostRim"
              cx="0.5"
              cy="0.5"
              r="0.75"
              gradientUnits="objectBoundingBox"
            >
              <Stop offset="0" stopColor="#5A3835" stopOpacity={0} />
              <Stop offset="0.7" stopColor="#5A3835" stopOpacity={0} />
              <Stop offset="1" stopColor="#7A4A45" stopOpacity={0.35} />
            </RadialGradient>
          </Defs>

          {/* Base warm dark gradient */}
          <Rect x={0} y={0} width={100} height={100} rx={14} fill="url(#cellBg)" />

          {/* Grainy frost texture clipped to shape */}
          <G clipPath="url(#cellClip)">
            {FROST_GRAIN.map((g, i) => (
              <Circle
                key={i}
                cx={g.x}
                cy={g.y}
                r={g.r}
                fill={g.bright ? '#9A6E68' : '#0A0403'}
                opacity={g.opacity}
              />
            ))}
          </G>

          {/* Subtle frost rim */}
          <Rect x={0} y={0} width={100} height={100} rx={14} fill="url(#frostRim)" />
        </Svg>

        {/* Label overlay */}
        <View style={styles.labelContainer}>
          <Text
            style={[styles.label, { fontSize: size * 0.14, color: labelColor }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default memo(EmotionCircleComponent);

const styles = StyleSheet.create({
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  label: {
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
  },
});
