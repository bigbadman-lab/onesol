import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import * as SecureStore from "expo-secure-store";

const CONSENT_KEY = "user_consent_given";

export default function Consent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      // Store consent
      await SecureStore.setItemAsync(CONSENT_KEY, "true");
      // Navigate to home
      router.replace("/home");
    } catch (error) {
      console.error("Error saving consent:", error);
      setIsAccepting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 30,
        }}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        bounces={true}
        nestedScrollEnabled={true}
      >
        {/* Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 20,
            marginTop: 20,
          }}
        >
          Welcome to Memecoin Market Simulator
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 16,
            color: "#CCCCCC",
            textAlign: "center",
            lineHeight: 24,
            marginBottom: 40,
          }}
        >
          An educational chart-reading game using simulated market scenarios
        </Text>

        {/* Privacy Notice Card */}
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#7B68EE",
            marginBottom: 30,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#7B68EE",
              marginBottom: 16,
            }}
          >
            📋 Privacy Notice
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#FFFFFF",
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            To provide leaderboard functionality, we need to generate and store
            a unique, anonymous device identifier on your device.
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#FFFFFF",
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontWeight: "700" }}>What we collect:</Text>
            {"\n"}• A randomly generated anonymous ID (stored securely on your
            device)
            {"\n"}• Your game scores and optional nickname
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#FFFFFF",
              lineHeight: 24,
            }}
          >
            <Text style={{ fontWeight: "700" }}>What we don't collect:</Text>
            {"\n"}• No personal information
            {"\n"}• No location data
            {"\n"}• No contact information
            {"\n"}• No device information beyond the anonymous ID
          </Text>
        </View>

        {/* Disclaimer Card */}
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#333333",
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#FFD700",
              marginBottom: 16,
            }}
          >
            ⚠️ Important Disclaimer
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#FFFFFF",
              lineHeight: 24,
            }}
          >
            This app is for{" "}
            <Text style={{ fontWeight: "700" }}>
              educational and entertainment purposes only
            </Text>
            .{"\n\n"}
            All trading activity is{" "}
            <Text style={{ fontWeight: "700" }}>fully simulated</Text> using
            virtual funds. No real cryptocurrency, money, or financial assets
            are involved.
            {"\n\n"}
            This is <Text style={{ fontWeight: "700" }}>not</Text> financial
            advice and does not constitute investment recommendations.
          </Text>
        </View>

        {/* Accept Button */}
        <TouchableOpacity
          onPress={handleAccept}
          disabled={isAccepting}
          style={{
            backgroundColor: "#7B68EE",
            paddingVertical: 18,
            borderRadius: 16,
            marginBottom: 16,
            opacity: isAccepting ? 0.6 : 1,
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            {isAccepting ? "Starting..." : "I Understand & Accept"}
          </Text>
        </TouchableOpacity>

        {/* Privacy Policy Link */}
        <Text
          style={{
            fontSize: 13,
            color: "#999999",
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          By continuing, you agree to our Privacy Policy and Terms of Service
        </Text>
      </ScrollView>
    </View>
  );
}
