import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle as SvgCircle, Path as SvgPath } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const COLOR = '#ECDA96';
const ARC_DEGREES = 360;
const SEGMENT_COUNT = 120;

// --- 4 Shape renderers ---

function ShapeCircle({ size }: { size: number }) {
  const r = size * 0.35;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <SvgCircle cx={size / 2} cy={size / 2} r={r} fill={COLOR} />
    </Svg>
  );
}

function ShapeSun({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const points = 8;
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.7;
    d += `${i === 0 ? 'M' : 'L'}${(cx + rad * Math.cos(angle)).toFixed(1)},${(cy + rad * Math.sin(angle)).toFixed(1)} `;
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <SvgPath d={d + 'Z'} fill={COLOR} />
    </Svg>
  );
}

function ShapeStarLarge({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.45;
  const inner = size * 0.15;
  let d = '';
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * i) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)} `;
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <SvgPath d={d + 'Z'} fill={COLOR} />
    </Svg>
  );
}

function ShapeStarSmall({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.38;
  const inner = size * 0.12;
  let d = '';
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * i) / 4 - Math.PI / 4;
    const r = i % 2 === 0 ? outer : inner;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)} `;
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <SvgPath d={d + 'Z'} fill={COLOR} />
    </Svg>
  );
}

const SHAPES = [ShapeCircle, ShapeSun, ShapeStarLarge, ShapeStarSmall];

// --- Arc segments (trailing behind the shape) ---

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const PARTICLE_COUNT = 150;

// Seeded pseudo-random for consistent render
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function buildParticles(center: number, radius: number) {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const progress = i / (PARTICLE_COUNT - 1); // 0 = tail, 1 = head
    const angle = ARC_DEGREES * progress;

    // Scatter: more spread at the tail, tight at the head
    const scatter = (1 - progress) * 18;
    const offsetR = (seededRandom(i * 3) - 0.5) * scatter;
    const offsetAngle = (seededRandom(i * 7) - 0.5) * scatter * 0.4;

    const pos = polarToCartesian(center, center, radius + offsetR, angle + offsetAngle);

    // Size: head particles are larger
    const baseSize = 0.4 + progress * 2.2;
    const sizeVariation = seededRandom(i * 13) * 0.8;
    const dotRadius = Math.max(0.3, baseSize + sizeVariation * (1 - progress));

    // Opacity: dense and bright at head, sparse and dim at tail
    const baseOpacity = progress * progress * progress;
    const opacityVariation = seededRandom(i * 17) * 0.3;
    const opacity = Math.min(1, baseOpacity + opacityVariation * progress);

    return { cx: pos.x, cy: pos.y, r: dotRadius, opacity };
  });
}

// --- Main component ---

interface Props {
  size: number;
  orbitRadius: number;
  shapeSize: number;
}

export default function OrbitingShapes({ size, orbitRadius, shapeSize }: Props) {
  const rotation = useSharedValue(0);
  const shapePhase = useSharedValue(0);

  useEffect(() => {
    // Full orbit rotation — continuous
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
    // Cycle through 4 shapes, one every 8s = 32s total cycle
    shapePhase.value = withRepeat(
      withTiming(4, { duration: 16000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Particle trail along the orbit path
  const particles = buildParticles(size / 2, orbitRadius);

  // Shape position at the head of the arc (270° = end of arc)
  const headPos = polarToCartesian(size / 2, size / 2, orbitRadius, 0);

  return (
    <Animated.View style={[{ width: size, height: size, position: 'absolute' }, rotateStyle]}>
      {/* Particle trail */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {particles.map((p, i) => (
          <SvgCircle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="#FFFFFF"
            opacity={p.opacity}
          />
        ))}
      </Svg>

      {/* Shape at the head of the arc — one at a time, cycling */}
      {SHAPES.map((Shape, shapeIndex) => (
        <ShapeLayer
          key={shapeIndex}
          shapeIndex={shapeIndex}
          shapePhase={shapePhase}
          shapeSize={shapeSize}
          left={headPos.x - shapeSize / 2}
          top={headPos.y - shapeSize / 2}
          Shape={Shape}
        />
      ))}
    </Animated.View>
  );
}

function ShapeLayer({
  shapeIndex,
  shapePhase,
  shapeSize,
  left,
  top,
  Shape,
}: {
  shapeIndex: number;
  shapePhase: Animated.SharedValue<number>;
  shapeSize: number;
  left: number;
  top: number;
  Shape: (props: { size: number }) => React.JSX.Element;
}) {
  const opacity = useDerivedValue(() => {
    const phase = shapePhase.value % 4;
    const dist = Math.min(Math.abs(phase - shapeIndex), 4 - Math.abs(phase - shapeIndex));
    // Sharp transition: fully visible when active, invisible otherwise
    return Math.max(0, 1 - dist * 3);
  });

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', left, top, width: shapeSize, height: shapeSize },
        style,
      ]}
    >
      <Shape size={shapeSize} />
    </Animated.View>
  );
}
