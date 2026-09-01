import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  getDisplayName,
  getPhotoUri,
  setDisplayName,
  setPhotoUri,
} from "@/services/profileStore";

const { width: SCREEN_W } = Dimensions.get("window");

const STROKE = "#FFFFFF";
const SW = 1.6;

/* ---------- Icons ---------- */
function BellIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16 L6 10.5 C6 7.2 8.7 5 12 5 C15.3 5 18 7.2 18 10.5 L18 16 L20 18.5 L4 18.5 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M10 20 C10.5 21 11.2 21.5 12 21.5 C12.8 21.5 13.5 21 14 20" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function FriendsIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7.5" r="3" stroke={STROKE} strokeWidth={SW} />
      <Path d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <Circle cx="16.9" cy="9" r="2.3" stroke={STROKE} strokeWidth={SW} />
      <Path d="M16.9 13.9c2.6 0 4.6 1.9 4.6 4.6" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function FeedbackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6 L6 6 M4 12 L6 12 M4 18 L6 18" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <Path d="M9 6 L20 6 M9 12 L20 12 M9 18 L20 18" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function InfoIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.2} stroke={STROKE} strokeWidth={SW} />
      <Path d="M12 11 L12 16.5" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <Circle cx={12} cy={7.8} r={0.5} fill={STROKE} stroke={STROKE} strokeWidth={1} />
    </Svg>
  );
}
function LockIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10.5} width={14} height={9.5} rx={2} stroke={STROKE} strokeWidth={SW} />
      <Path d="M8 10.5 L8 8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 L16 10.5" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function LifebuoyIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.2} stroke={STROKE} strokeWidth={SW} />
      <Circle cx={12} cy={12} r={3.3} stroke={STROKE} strokeWidth={SW} />
      <Path d="M14.4 9.6 L18 6 M9.6 9.6 L6 6 M14.4 14.4 L18 18 M9.6 14.4 L6 18" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function PencilIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20 L4 16 L15 5 L19 9 L8 20 Z" stroke="#FFFFFF" strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M13 7 L17 11" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const AVATAR = 150;
const MENU_W = 180;

export default function SettingsHubScreen() {
  const insets = useSafeAreaInsets();

  // Profile
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  useFocusEffect(
    useCallback(() => {
      getDisplayName().then(setName);
      getPhotoUri().then(setPhoto);
    }, []),
  );

  // Edit menu (popover anchored to the pencil)
  const pencilRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const openMenu = () => {
    pencilRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setMenuOpen(true);
    });
  };

  // Edit name modal
  const [nameOpen, setNameOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const saveName = async () => {
    const trimmed = draft.trim();
    if (trimmed) {
      setName(trimmed);
      await setDisplayName(trimmed);
    }
    setNameOpen(false);
  };

  // The actual actions (run only after the edit menu has fully dismissed — iOS
  // can't present the picker / another modal while one is still animating out).
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      await setPhotoUri(uri);
    }
  };
  const startNameEdit = () => {
    setDraft(name);
    setNameOpen(true);
  };

  // Menu -> pick an action; it fires when the menu modal is gone (see onDismiss).
  const [pending, setPending] = useState<null | "photo" | "name">(null);
  const runPending = (action: "photo" | "name") => {
    if (action === "photo") pickImage();
    else startNameEdit();
  };
  const chooseAction = (action: "photo" | "name") => {
    if (Platform.OS === "ios") {
      setPending(action); // onDismiss will run it once the menu closes
      setMenuOpen(false);
    } else {
      setMenuOpen(false);
      runPending(action);
    }
  };
  const changePhoto = () => chooseAction("photo");
  const openNameEdit = () => chooseAction("name");

  const menuTop = anchor.y + anchor.h + 6;
  const menuLeft = Math.max(12, Math.min(anchor.x + anchor.w - MENU_W, SCREEN_W - MENU_W - 12));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <TouchableOpacity style={styles.close} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M6 6 L18 18 M18 6 L6 18" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>

        {/* Profile header */}
        <View style={styles.profile}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <Image
                  source={require("@/assets/images/donate-gift.png")}
                  style={styles.avatarPlaceholder}
                  resizeMode="contain"
                />
              )}
            </View>
            <TouchableOpacity
              ref={pencilRef}
              style={styles.editBadge}
              onPress={openMenu}
              activeOpacity={0.85}
            >
              <PencilIcon />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{name}</Text>
        </View>

        {/* Notifications + Invite friends (moved out of Settings) */}
        <View style={styles.list}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => router.push("/settings/about")}
          >
            <View style={styles.rowIcon}>
              <InfoIcon />
            </View>
            <Text style={styles.rowLabel}>About</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => router.push("/settings/notifications")}
          >
            <View style={styles.rowIcon}>
              <BellIcon />
            </View>
            <Text style={styles.rowLabel}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={() => router.push("/settings/friends")}>
            <View style={styles.rowIcon}>
              <FriendsIcon />
            </View>
            <Text style={styles.rowLabel}>Invite friends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => router.push("/settings/feedback")}
          >
            <View style={styles.rowIcon}>
              <FeedbackIcon />
            </View>
            <Text style={styles.rowLabel}>Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => router.push("/settings/security")}
          >
            <View style={styles.rowIcon}>
              <LockIcon />
            </View>
            <Text style={styles.rowLabel}>Security &amp; data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => router.push("/settings/hotlines")}
          >
            <View style={styles.rowIcon}>
              <LifebuoyIcon />
            </View>
            <Text style={styles.rowLabel}>Mental health hotlines</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit menu — small popover anchored to the pencil. */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        onDismiss={() => {
          if (pending) {
            runPending(pending);
            setPending(null);
          }
        }}
      >
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={{ flex: 1 }}>
            <View style={[styles.menuCard, { top: menuTop, left: menuLeft }]}>
              <TouchableOpacity style={styles.menuItem} onPress={changePhoto} activeOpacity={0.7}>
                <Text style={styles.menuText}>Change photo</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={openNameEdit} activeOpacity={0.7}>
                <Text style={styles.menuText}>Edit name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit name modal. */}
      <Modal visible={nameOpen} transparent animationType="fade" onRequestClose={() => setNameOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setNameOpen(false)}>
          <View style={styles.nameBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.nameCard}>
                <Text style={styles.nameCardTitle}>Edit name</Text>
                <TextInput
                  style={styles.nameInput}
                  value={draft}
                  onChangeText={setDraft}
                  autoFocus
                  selectionColor="#FFFFFF"
                  placeholder="Your name"
                  placeholderTextColor="#6E6A64"
                  onSubmitEditing={saveName}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.nameSaveBtn} onPress={saveName} activeOpacity={0.85}>
                  <Text style={styles.nameSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000", paddingHorizontal: 22 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },

  /* Profile header */
  profile: { alignItems: "center", marginTop: 10, marginBottom: 40 },
  avatarWrap: { width: AVATAR, height: AVATAR },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: "#D2A896",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarPlaceholder: { width: "58%", height: "58%" },
  editBadge: {
    position: "absolute",
    right: 2,
    bottom: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2A2A2A",
    borderWidth: 3,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 30,
    fontFamily: "Jost_400Regular",
    marginTop: 16,
  },

  /* Rows */
  list: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowIcon: { width: 44, height: 44, justifyContent: "center", alignItems: "center", marginRight: 14 },
  rowLabel: { flex: 1, color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular" },

  /* Edit menu popover */
  menuCard: {
    position: "absolute",
    width: MENU_W,
    backgroundColor: "#1E1C1A",
    borderRadius: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  menuItem: { paddingVertical: 14, paddingHorizontal: 18 },
  menuText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Jost_400Regular" },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.12)", marginHorizontal: 12 },

  /* Edit name modal */
  nameBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  nameCard: {
    width: "100%",
    backgroundColor: "#1E1C1A",
    borderRadius: 24,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  nameCardTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Jost_600SemiBold", marginBottom: 14 },
  nameInput: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Jost_400Regular",
    backgroundColor: "#2A2622",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nameSaveBtn: {
    backgroundColor: "#DB533C",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  nameSaveText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Jost_600SemiBold" },
});
