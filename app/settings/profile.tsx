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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

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
});
