import { memo, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, {
  Rect,
  Circle,
  Defs,
  ClipPath,
  RadialGradient,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

interface EmotionCircleProps {
  label: string;
  category: string;
  gradientStart?: string;
  gradientEnd?: string;
  size: number;
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

function EmotionCircleComponent({
  label,
  category,
  size,
}: EmotionCircleProps) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/emotionlog',
      params: { emotion: label, category },
    });
  }, [label, category]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ width: size, height: size }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          overflow: 'hidden',
        }}
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
            style={[styles.label, { fontSize: size * 0.14 }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </View>
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
    color: '#FFFFFF',
  },
});
