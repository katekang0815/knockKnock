import Svg, {
  Path,
  G,
  Defs,
  ClipPath,
  Rect,
  Circle,
  Ellipse,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface Props {
  size: number;
  borderRadius?: number;
}

export default function CalmMountainIcon({ size, borderRadius = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="calmCardClip">
          <Rect x={0} y={0} width={100} height={100} rx={borderRadius} />
        </ClipPath>

        {/* Sky — soft warm peach gradient */}
        <LinearGradient id="calmSkyGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#F0C098" />
          <Stop offset="0.5" stopColor="#F5C8A8" />
          <Stop offset="1" stopColor="#EAA888" />
        </LinearGradient>

        {/* Main mountain — illuminated side */}
        <LinearGradient id="calmMountainLit" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#F0AC80" />
          <Stop offset="0.5" stopColor="#D8845C" />
          <Stop offset="1" stopColor="#B05838" />
        </LinearGradient>

        {/* Main mountain — shadow side */}
        <LinearGradient id="calmMountainShadow" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#B05838" />
          <Stop offset="1" stopColor="#6A2F22" />
        </LinearGradient>

        {/* Sun glow */}
        <RadialGradient
          id="calmSunGlow"
          cx="0.5"
          cy="0.5"
          r="0.5"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#FFEDD5" stopOpacity={1} />
          <Stop offset="1" stopColor="#FFEDD5" stopOpacity={0} />
        </RadialGradient>

        {/* Vignette — dark burgundy frame */}
        <RadialGradient
          id="calmVignette"
          cx="0.5"
          cy="0.5"
          r="0.75"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#5A2520" stopOpacity={0} />
          <Stop offset="0.75" stopColor="#5A2520" stopOpacity={0} />
          <Stop offset="1" stopColor="#3A1818" stopOpacity={0.55} />
        </RadialGradient>
      </Defs>

      {/* Sky background */}
      <Rect
        x={0}
        y={0}
        width={100}
        height={100}
        rx={borderRadius}
        fill="url(#calmSkyGrad)"
      />

      <G clipPath="url(#calmCardClip)">
        {/* Sun glow */}
        <Circle cx={50} cy={28} r={14} fill="url(#calmSunGlow)" />
        {/* Sun disc */}
        <Circle cx={50} cy={28} r={5} fill="#FFEDD5" opacity={0.95} />

        {/* Distant mountains (back layer, hazy) */}
        <Path
          d="M 0 65 L 12 56 L 24 62 L 40 52 L 55 58 L 72 50 L 88 56 L 100 62 L 100 80 L 0 80 Z"
          fill="#C57860"
          opacity={0.45}
        />

        {/* Mid-distance peaks behind main mountain */}
        <Path
          d="M 8 70 L 22 58 L 32 70 Z"
          fill="#A85838"
          opacity={0.7}
        />
        <Path
          d="M 65 72 L 76 60 L 90 72 Z"
          fill="#A85838"
          opacity={0.7}
        />

        {/* Main mountain — shadow side (left) */}
        <Path
          d="M 25 74 L 50 32 L 50 74 Z"
          fill="url(#calmMountainShadow)"
        />

        {/* Main mountain — illuminated side (right) */}
        <Path
          d="M 50 32 L 78 74 L 50 74 Z"
          fill="url(#calmMountainLit)"
        />

        {/* Snow highlight ridges */}
        <Path
          d="M 50 32 L 52 42 L 55 52 L 52 58"
          stroke="#FFD5B0"
          strokeWidth={0.6}
          fill="none"
          opacity={0.85}
          strokeLinecap="round"
        />
        <Path
          d="M 50 32 L 48 44 L 45 56"
          stroke="#F0A880"
          strokeWidth={0.4}
          fill="none"
          opacity={0.6}
          strokeLinecap="round"
        />
        {/* Snow-cap triangle at peak */}
        <Path
          d="M 47 40 L 50 32 L 53 40 L 50 44 Z"
          fill="#FFE5C8"
          opacity={0.8}
        />

        {/* Lake / horizon — bright reflective band */}
        <Rect x={0} y={74} width={100} height={2.5} fill="#F8C898" opacity={0.95} />

        {/* Foreground hills */}
        <Path
          d="M 0 86 L 22 78 L 42 84 L 60 80 L 85 82 L 100 78 L 100 100 L 0 100 Z"
          fill="#7A3528"
        />

        {/* Cypress / pointed trees */}
        <Ellipse cx={16} cy={75} rx={3.5} ry={12} fill="#2A1815" />
        <Ellipse cx={24} cy={80} rx={3} ry={10} fill="#2A1815" />
        <Ellipse cx={72} cy={76} rx={3.5} ry={11} fill="#2A1815" />
        <Ellipse cx={80} cy={82} rx={2.8} ry={9} fill="#2A1815" />

        {/* Foreground bush */}
        <Ellipse cx={42} cy={94} rx={4.5} ry={2.8} fill="#4A2520" />
        <Ellipse cx={45} cy={92} rx={2.5} ry={2} fill="#5A2820" opacity={0.8} />

        {/* Subtle vignette overlay for the framed look */}
        <Rect
          x={0}
          y={0}
          width={100}
          height={100}
          rx={borderRadius}
          fill="url(#calmVignette)"
        />
      </G>
    </Svg>
  );
}
