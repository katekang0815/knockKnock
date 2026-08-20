import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  getDisplayName,
  getPhotoUri,
  setDisplayName,
  setPhotoUri,
} from "@/services/profileStore";

function AppleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M16.365 1.43c0 1.14-.44 2.23-1.16 3.02-.78.86-2.05 1.53-3.13 1.44-.13-1.1.42-2.27 1.1-3.02.77-.85 2.13-1.48 3.19-1.44zM20.5 17.2c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.39 3.53-4.12 3.54-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.79-4.04-3.36-2.77-4.4-3.06-9.56-1.35-12.3 1.21-1.95 3.13-3.09 4.93-3.09 1.83 0 2.98 1.01 4.49 1.01 1.47 0 2.36-1.01 4.48-1.01 1.6 0 3.3.87 4.51 2.38-3.96 2.17-3.32 7.82.25 9.86z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function GoogleIcon() {
  // Monochrome grey "G" to match the reference.
  const c = "#9AA0A6";
  return (
    <Svg width={22} height={22} viewBox="0 0 48 48">
      <Path fill={c} d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill={c} d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill={c} d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill={c} d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.99 35.61 44 30.334 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  // UI-only for now (no auth backend wired yet).
  const [appleOn, setAppleOn] = useState(true);
  const [googleOn, setGoogleOn] = useState(false);

  useEffect(() => {
    getDisplayName().then(setName);
    getPhotoUri().then(setPhoto);
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true, // built-in crop/edit
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      await setPhotoUri(uri);
    }
  };

  const startEdit = () => {
    setDraft(name);
    setEditing(true);
  };
  const saveName = async () => {
    const trimmed = draft.trim();
    if (trimmed) {
      setName(trimmed);
      await setDisplayName(trimmed);
    }
    setEditing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>

      {/* Avatar + Edit */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImg} contentFit="cover" />
          ) : null}
        </View>
        <TouchableOpacity style={styles.editPhoto} onPress={pickImage} activeOpacity={0.85}>
          <Text style={styles.editPhotoText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Edit display name */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>Edit display name</Text>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={draft}
              onChangeText={setDraft}
              autoFocus
              selectionColor="#FFFFFF"
              onSubmitEditing={saveName}
              onBlur={saveName}
              returnKeyType="done"
              placeholder="Your name"
              placeholderTextColor="#6E6A64"
            />
          ) : (
            <Text style={styles.rowValue}>{name}</Text>
          )}
        </View>
        <TouchableOpacity onPress={editing ? saveName : startEdit} activeOpacity={0.7} hitSlop={12}>
          {editing ? (
            <Text style={styles.doneText}>Done</Text>
          ) : (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M4 20 L4 16 L15 5 L19 9 L8 20 Z" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
              <Path d="M13 7 L17 11" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
            </Svg>
          )}
        </TouchableOpacity>
      </View>

      {/* Login options */}
      <Text style={styles.sectionHeader}>Login options</Text>

      <View style={styles.loginRow}>
        <AppleIcon />
        <View style={styles.loginText}>
          <Text style={styles.loginTitle}>Apple</Text>
          {appleOn && <Text style={styles.loginSub}>You&apos;re signed in with Apple</Text>}
        </View>
        <Switch
          value={appleOn}
          onValueChange={setAppleOn}
          trackColor={{ true: "#34C759", false: "#3A3A3C" }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#3A3A3C"
        />
      </View>

      <View style={styles.loginRow}>
        <GoogleIcon />
        <View style={styles.loginText}>
          <Text style={styles.loginTitle}>Google</Text>
        </View>
        <Switch
          value={googleOn}
          onValueChange={setGoogleOn}
          trackColor={{ true: "#34C759", false: "#3A3A3C" }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#3A3A3C"
        />
      </View>
    </View>
  );
}

const AVATAR = 150;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000", paddingHorizontal: 22 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  avatarWrap: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: "#2A2A2A",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  editPhoto: {
    marginTop: -22,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 26,
  },
  editPhotoText: { color: "#111111", fontSize: 15, fontFamily: "Jost_600SemiBold" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  rowLabel: { color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_600SemiBold" },
  rowValue: { color: "#9A938B", fontSize: 15, fontFamily: "Jost_400Regular", marginTop: 4 },
  nameInput: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Jost_400Regular",
    marginTop: 4,
    padding: 0,
  },
  doneText: { color: "#E0967D", fontSize: 15, fontFamily: "Jost_600SemiBold" },
  sectionHeader: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Jost_700Bold",
    marginTop: 30,
    marginBottom: 6,
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  loginText: { flex: 1, marginLeft: 16 },
  loginTitle: { color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular" },
  loginSub: { color: "#9A938B", fontSize: 13, fontFamily: "Jost_400Regular", marginTop: 2 },
});
