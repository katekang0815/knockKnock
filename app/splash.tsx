import { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, withDelay, runOnJS, Easing, useAnimatedStyle } from 'react-native-reanimated';
import {
  Canvas,
  Path,
  Oval,
  Group,
  LinearGradient,
  RadialGradient,
  BlurMask,
  Skia,
  FillType,
  vec,
  useDerivedValue as useSkiaValue,
} from '@shopify/react-native-skia';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { markSplashShown } from '@/utils/session';

const { width, height } = Dimensions.get('window');

// Door geometry
const DOOR_WIDTH = 160;
const DOOR_HEIGHT = 240;
const ARCH_RADIUS = DOOR_WIDTH / 2;
const CX = width / 2;
const CY = height / 2;
const HINGE_X = CX - DOOR_WIDTH / 2;
const BOTTOM_Y = CY + DOOR_HEIGHT / 2;
const STRAIGHT_TOP_Y = CY - DOOR_HEIGHT / 2 + ARCH_RADIUS;
const ARCH_TOP_Y = STRAIGHT_TOP_Y - ARCH_RADIUS;
const WALL_DEPTH = 18;

// Pre-build static paths
function buildArchOpeningPath(): ReturnType<typeof Skia.Path.Make> {
  const p = Skia.Path.Make();
  p.moveTo(HINGE_X, BOTTOM_Y);
  p.lineTo(HINGE_X, STRAIGHT_TOP_Y);
  p.arcTo(
    { x: HINGE_X, y: ARCH_TOP_Y, width: DOOR_WIDTH, height: DOOR_WIDTH },
    180, 180, false
  );
  p.lineTo(HINGE_X + DOOR_WIDTH, BOTTOM_Y);
  p.close();
  return p;
}

function buildWallMaskPath(): ReturnType<typeof Skia.Path.Make> {
  const p = Skia.Path.Make();
  // Outer rect
  p.addRect({ x: 0, y: 0, width, height });
  // Inner arch cutout (same winding as above)
  p.moveTo(HINGE_X, BOTTOM_Y);
  p.lineTo(HINGE_X, STRAIGHT_TOP_Y);
  p.arcTo(
    { x: HINGE_X, y: ARCH_TOP_Y, width: DOOR_WIDTH, height: DOOR_WIDTH },
    180, 180, false
  );
  p.lineTo(HINGE_X + DOOR_WIDTH, BOTTOM_Y);
  p.close();
  p.setFillType(FillType.EvenOdd);
  return p;
}

function navigateToHome() {
  markSplashShown();
  router.replace('/(tabs)');
}

export default function SplashScreen() {
  const doorOpenProgress = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const floorLightProgress = useSharedValue(0);
  const cloudOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    doorOpenProgress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    glowIntensity.value = withDelay(400, withTiming(1, { duration: 600 }));
    floorLightProgress.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    cloudOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    screenOpacity.value = withDelay(2200, withTiming(0, { duration: 500 }, (finished) => {
      if (finished) runOnJS(navigateToHome)();
    }));
  }, []);

  // --- Skia derived values ---

  const doorPanelPath = useSkiaValue(() => {
    const cosA = Math.cos(doorOpenProgress.value * Math.PI / 2);
    const panelWidth = DOOR_WIDTH * cosA;
    const pf = panelWidth * 0.15;
    const p = Skia.Path.Make();
    p.moveTo(HINGE_X, STRAIGHT_TOP_Y + pf);
    p.lineTo(HINGE_X + panelWidth, STRAIGHT_TOP_Y - pf);
    p.lineTo(HINGE_X + panelWidth, BOTTOM_Y + pf * 0.5);
    p.lineTo(HINGE_X, BOTTOM_Y - pf * 0.5);
    p.close();
    return p;
  }, [doorOpenProgress]);

  const floorTrianglePath = useSkiaValue(() => {
    const spread = floorLightProgress.value;
    const fanHalfWidth = width * 0.45 * spread;
    const p = Skia.Path.Make();
    p.moveTo(CX, BOTTOM_Y);
    p.lineTo(CX - fanHalfWidth, height);
    p.lineTo(CX + fanHalfWidth, height);
    p.close();
    return p;
  }, [floorLightProgress]);

  const sideWallPath = useSkiaValue(() => {
    const p = Skia.Path.Make();
    p.moveTo(HINGE_X - WALL_DEPTH, STRAIGHT_TOP_Y - 8);
    p.lineTo(HINGE_X, STRAIGHT_TOP_Y);
    p.lineTo(HINGE_X, BOTTOM_Y);
    p.lineTo(HINGE_X - WALL_DEPTH, BOTTOM_Y + 4);
    p.close();
    return p;
  }, []);

  const sideWallOpacity = useSkiaValue(() => doorOpenProgress.value, [doorOpenProgress]);
  const glowOpacity = useSkiaValue(() => glowIntensity.value, [glowIntensity]);
  const cloudAlpha = useSkiaValue(() => cloudOpacity.value, [cloudOpacity]);

  const archOpeningPath = buildArchOpeningPath();
  const wallMaskPath = buildWallMaskPath();

  const fadeStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
      <Canvas style={{ flex: 1, backgroundColor: '#000000' }}>

        {/* 1. Floor triangle fan */}
        <Path path={floorTrianglePath}>
          <LinearGradient
            start={vec(CX, BOTTOM_Y)}
            end={vec(CX, height)}
            colors={['#00E5CC', 'rgba(0,229,204,0.25)', 'rgba(0,0,0,0)']}
          />
        </Path>

        {/* 2. Interior arch glow */}
        <Group opacity={glowOpacity} clip={archOpeningPath}>
          <Path path={archOpeningPath}>
            <RadialGradient
              c={vec(CX, CY - 20)}
              r={DOOR_WIDTH * 0.8}
              colors={['#00E5CC', '#00B5A0', '#003330']}
              positions={[0, 0.5, 1]}
            />
          </Path>
        </Group>

        {/* 3. Door panel (trapezoid) */}
        <Path path={doorPanelPath} color="#050505" />

        {/* 4. Left side wall depth */}
        <Group opacity={sideWallOpacity}>
          <Path path={sideWallPath} color="#003330" />
        </Group>

        {/* 5. Wall mask (black with arch cutout) */}
        <Path path={wallMaskPath} color="#000000" />

        {/* 6. Arch outline with glow */}
        <Path
          path={archOpeningPath}
          style="stroke"
          strokeWidth={3}
          color="#00E5CC"
        >
          <BlurMask blur={8} style="outer" respectCTM={false} />
        </Path>

        {/* 7. Clouds */}
        <Group opacity={cloudAlpha}>
          {/* Cloud 1 */}
          <Oval rect={{ x: CX - 42, y: CY - 44, width: 64, height: 32 }} color="white" opacity={0.9} />
          <Oval rect={{ x: CX - 56, y: CY - 36, width: 36, height: 22 }} color="white" opacity={0.9} />
          <Oval rect={{ x: CX - 10, y: CY - 36, width: 40, height: 24 }} color="white" opacity={0.9} />

          {/* Cloud 2 */}
          <Oval rect={{ x: CX - 14, y: CY + 2, width: 48, height: 24 }} color="white" opacity={0.75} />
          <Oval rect={{ x: CX - 26, y: CY + 9, width: 28, height: 18 }} color="white" opacity={0.75} />
          <Oval rect={{ x: CX + 22, y: CY + 9, width: 32, height: 18 }} color="white" opacity={0.75} />

          {/* Cloud 3 */}
          <Oval rect={{ x: CX - 54, y: CY + 32, width: 36, height: 18 }} color="white" opacity={0.6} />
          <Oval rect={{ x: CX - 64, y: CY + 39, width: 22, height: 14 }} color="white" opacity={0.6} />
          <Oval rect={{ x: CX - 34, y: CY + 39, width: 24, height: 14 }} color="white" opacity={0.6} />
        </Group>

      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
