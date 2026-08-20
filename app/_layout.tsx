import {
  Jost_400Regular,
  Jost_400Regular_Italic,
  Jost_600SemiBold,
  Jost_700Bold,
  useFonts,
} from "@expo-google-fonts/jost";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

// The app is always dark, so force a black-backed theme regardless of the device's
// light/dark setting — prevents white flashes behind screens and during transitions.
const AppTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: "#000000" },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jost_700Bold,
    Jost_400Regular,
    Jost_400Regular_Italic,
    Jost_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={AppTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="checkin" options={{ headerShown: false }} />
        <Stack.Screen name="emotionlog" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/profile" options={{ headerShown: false }} />
        <Stack.Screen name="settings/donate" options={{ headerShown: false }} />
        <Stack.Screen name="settings/[slug]" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: "simple_push", // right → left slide whose duration IS customizable
            animationTypeForReplace: "push", // so replace() slides in (not a pop)
            animationDuration: 300, // slide duration; unlike slide_from_right, this honors the value
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
