import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path as SvgPath, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Gradient colors — soft pink/peach to gold
const GRAD_START = '#E8B4C8';
const GRAD_END = '#F0D090';

// Shape 1: Rounded square with concave sides (screenshot 1)
function ShapeSquish({ size }: { size: number }) {
  const s = size;
  const m = s * 0.12; // concave inset
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <LinearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={GRAD_START} />
          <Stop offset="1" stopColor={GRAD_END} />
        </LinearGradient>
      </Defs>
      <SvgPath
        d={`M ${s * 0.2},${s * 0.05}
            Q ${s * 0.5},${m} ${s * 0.8},${s * 0.05}
            Q ${s - m},${s * 0.5} ${s * 0.8},${s * 0.95}
            Q ${s * 0.5},${s - m} ${s * 0.2},${s * 0.95}
            Q ${m},${s * 0.5} ${s * 0.2},${s * 0.05} Z`}
        fill="url(#grad1)"
      />
    </Svg>
  );
}

// Shape 2: 4-pointed star (screenshot 2)
function ShapeStar({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.48;
  const inner = size * 0.12;
  let d = '';
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * i) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)} `;
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={GRAD_START} />
          <Stop offset="1" stopColor={GRAD_END} />
        </LinearGradient>
      </Defs>
      <SvgPath d={d + 'Z'} fill="url(#grad2)" />
    </Svg>
  );
}

// Shape 3: Cross / plus shape (screenshot 3)
function ShapeCross({ size }: { size: number }) {
  const s = size;
  const t = s * 0.22; // arm thickness half
  const cx = s / 2;
  const cy = s / 2;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <LinearGradient id="grad3" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={GRAD_START} />
          <Stop offset="1" stopColor={GRAD_END} />
        </LinearGradient>
      </Defs>
      <SvgPath
        d={`M ${cx - t},${s * 0.05}
            L ${cx + t},${s * 0.05}
            L ${cx + t},${cy - t}
            L ${s * 0.95},${cy - t}
            L ${s * 0.95},${cy + t}
            L ${cx + t},${cy + t}
            L ${cx + t},${s * 0.95}
            L ${cx - t},${s * 0.95}
            L ${cx - t},${cy + t}
            L ${s * 0.05},${cy + t}
            L ${s * 0.05},${cy - t}
            L ${cx - t},${cy - t} Z`}
        fill="url(#grad3)"
      />
    </Svg>
  );
}

const SHAPES = [ShapeSquish, ShapeStar, ShapeCross];

interface Props {
  size: number;
}

export default function OrbitingShapes({ size }: Props) {
  const shapePhase = useSharedValue(0);

  useEffect(() => {
    shapePhase.value = withRepeat(
      withTiming(3, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {SHAPES.map((Shape, shapeIndex) => (
        <ShapeLayer
          key={shapeIndex}
          shapeIndex={shapeIndex}
          shapePhase={shapePhase}
          shapeSize={size}
          Shape={Shape}
        />
      ))}
    </View>
  );
}

function ShapeLayer({
  shapeIndex,
  shapePhase,
  shapeSize,
  Shape,
}: {
  shapeIndex: number;
  shapePhase: Animated.SharedValue<number>;
  shapeSize: number;
  Shape: (props: { size: number }) => React.JSX.Element;
}) {
  const opacity = useDerivedValue(() => {
    const phase = shapePhase.value % 3;
    const dist = Math.min(Math.abs(phase - shapeIndex), 3 - Math.abs(phase - shapeIndex));
    return Math.max(0, 1 - dist * 3);
  });

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', width: shapeSize, height: shapeSize },
        style,
      ]}
    >
      <Shape size={shapeSize} />
    </Animated.View>
  );
}
