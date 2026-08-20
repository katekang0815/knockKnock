import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { sendFeedback } from "@/services/feedbackService";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    const ok = await sendFeedback({
      message,
      contact,
      appVersion: Constants.expoConfig?.version ?? "",
    });
    setSending(false);
    if (ok) {
      setSent(true);
      setTimeout(() => router.back(), 1100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.title}>Feedback</Text>
        <Text style={styles.subtitle}>
          Tell us what&apos;s working, what isn&apos;t, or what you&apos;d love to see. We read every note.
        </Text>

        {/* Message */}
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Share your thoughts..."
          placeholderTextColor="#6E6A64"
          multiline
          textAlignVertical="top"
          selectionColor="#E0967D"
        />

        {/* Optional contact */}
        <TextInput
          style={styles.contact}
          value={contact}
          onChangeText={setContact}
          placeholder="Email (optional, if you'd like a reply)"
          placeholderTextColor="#6E6A64"
          autoCapitalize="none"
          keyboardType="email-address"
          selectionColor="#E0967D"
        />

        {/* Send */}
        <TouchableOpacity
          style={[styles.sendBtn, (!message.trim() || sending) && { opacity: 0.5 }]}
          onPress={onSend}
          activeOpacity={0.85}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#111111" />
          ) : (
            <Text style={styles.sendText}>{sent ? "Thank you 🙏" : "Send feedback"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  title: { color: "#FFFFFF", fontSize: 32, fontFamily: SERIF, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  subtitle: { color: "#9A938B", fontSize: 15, lineHeight: 21, fontFamily: "Jost_400Regular", marginBottom: 22 },
  input: {
    minHeight: 150,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 23,
    fontFamily: "Jost_400Regular",
  },
  contact: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Jost_400Regular",
    marginTop: 12,
  },
  sendBtn: {
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  sendText: { color: "#111111", fontSize: 17, fontFamily: "Jost_600SemiBold" },
});
