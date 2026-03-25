import Svg, { Path, Defs, LinearGradient, Stop, Circle as SvgCircle } from 'react-native-svg';

interface EmotionShapeProps {
  emotion: string;
  gradientStart: string;
  gradientEnd: string;
  size: number;
}

function GinkgoLeaf({ gradientStart, gradientEnd, size }: Omit<EmotionShapeProps, 'emotion'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 220" fill="none">
      <Defs>
        <LinearGradient id="ginkgoGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={gradientStart} />
          <Stop offset="1" stopColor={gradientEnd} />
        </LinearGradient>
      </Defs>
      {/* Ginkgo leaf: heart-like shape with notch at top and stem at bottom */}
      <Path
        d="M100 10
           C60 10, 15 50, 15 100
           C15 140, 50 170, 90 180
           L90 180 Q95 185, 95 210
           L105 210 Q105 185, 110 180
           L110 180 C150 170, 185 140, 185 100
           C185 50, 140 10, 100 10Z
           M100 10 C98 60, 96 120, 90 180
           M100 10 C102 60, 104 120, 110 180"
        fill="url(#ginkgoGrad)"
      />
      {/* Center notch */}
      <Path
        d="M100 10 C98 50, 92 100, 90 180
           M100 10 C102 50, 108 100, 110 180"
        stroke="#000000"
        strokeWidth={3}
        strokeOpacity={0.3}
        fill="none"
      />
    </Svg>
  );
}

function StarBurst({ gradientStart, gradientEnd, size }: Omit<EmotionShapeProps, 'emotion'>) {
  const cx = 100;
  const cy = 100;
  const outerR = 90;
  const innerR = 55;
  const points = 6;

  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? 'M' : 'L'}${x},${y} `;
  }
  d += 'Z';

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Defs>
        <LinearGradient id="starGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={gradientStart} />
          <Stop offset="1" stopColor={gradientEnd} />
        </LinearGradient>
      </Defs>
      <Path d={d} fill="url(#starGrad)" />
    </Svg>
  );
}

function DefaultCircle({ gradientStart, gradientEnd, size }: Omit<EmotionShapeProps, 'emotion'>) {
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <Defs>
        <LinearGradient id="circleGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={gradientStart} />
          <Stop offset="1" stopColor={gradientEnd} />
        </LinearGradient>
      </Defs>
      <SvgCircle cx={r} cy={r} r={r} fill="url(#circleGrad)" />
    </Svg>
  );
}

export default function EmotionShape({ emotion, gradientStart, gradientEnd, size }: EmotionShapeProps) {
  const shapeMap: Record<string, string> = {
    Wishful: 'ginkgo',
    Surprised: 'starburst',
  };

  const shape = shapeMap[emotion] || 'circle';

  switch (shape) {
    case 'ginkgo':
      return <GinkgoLeaf gradientStart={gradientStart} gradientEnd={gradientEnd} size={size} />;
    case 'starburst':
      return <StarBurst gradientStart={gradientStart} gradientEnd={gradientEnd} size={size} />;
    default:
      return <DefaultCircle gradientStart={gradientStart} gradientEnd={gradientEnd} size={size} />;
  }
}
