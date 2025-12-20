import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  BackHandler,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  ExternalLink,
  Trash2,
  Home,
} from "lucide-react-native";
import * as Linking from "expo-linking";
import useDeviceId from "../utils/useDeviceId";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { Image } from "expo-image";

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useDeviceId();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Nickname state - minimal
  const [nickname, setNickname] = useState("");
  const [loadingNickname, setLoadingNickname] = useState(true);

  // Email state
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Load nickname and email on mount
  useEffect(() => {
    if (deviceId) {
      loadNickname();
      loadEmail();
    }
  }, [deviceId]);

  const loadNickname = async () => {
    try {
      setLoadingNickname(true);
      const response = await fetch(`/api/user/profile?uuid=${deviceId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      setNickname(data.nickname || "");
    } catch (error) {
      console.error("Error loading nickname:", error);
    } finally {
      setLoadingNickname(false);
    }
  };

  const loadEmail = async () => {
    try {
      setLoadingEmail(true);
      const storedEmail = await SecureStore.getItemAsync("user_email");
      setEmail(storedEmail || "");
    } catch (error) {
      console.error("Error loading email:", error);
    } finally {
      setLoadingEmail(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveEmail = async () => {
    setEmailError("");
    
    if (!email.trim()) {
      setEmailError("Email cannot be empty");
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setSavingEmail(true);
      await SecureStore.setItemAsync("user_email", email.trim());
      setEmailError("");
      alert("Email saved successfully! You're now eligible for daily prizes.");
    } catch (error) {
      console.error("Error saving email:", error);
      setEmailError("Failed to save email. Please try again.");
    } finally {
      setSavingEmail(false);
    }
  };


  const handleDeleteAccount = async () => {
    console.log("User confirmed account deletion");
    setIsDeleting(true);
    try {
      console.log("Sending delete request for deviceId:", deviceId);

      // Delete data from database
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uuid: deviceId }),
      });

      console.log("Delete API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Delete API error:", errorData);
        throw new Error("Failed to delete account data");
      }

      const result = await response.json();
      console.log("Delete API success:", result);

      // Clear device ID from secure store - use correct key
      console.log("Clearing device_uuid from SecureStore...");
      await SecureStore.deleteItemAsync("device_uuid");
      console.log("SecureStore cleared successfully");

      // Exit the app
      console.log("Exiting app...");
      BackHandler.exitApp();
    } catch (error) {
      console.error("Error deleting account:", error);
      console.error("Error stack:", error.stack);
      setIsDeleting(false);
      setShowDeleteModal(false);
      alert("Failed to delete account. Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Home icon - top left */}
        <TouchableOpacity
          onPress={() => router.push("/home")}
          style={{
            position: "absolute",
            top: insets.top + 20,
            left: 20,
            zIndex: 10,
          }}
        >
          <Home size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Close icon */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: insets.top + 20,
            right: 20,
            zIndex: 10,
          }}
        >
          <X size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Header */}
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Image
            source={{
              uri: "https://ucarecdn.com/8a5e7150-008a-406b-ae1e-1a737a233970/-/format/auto/",
            }}
            style={{ width: 300, height: 80 }}
            contentFit="contain"
            transition={100}
          />
        </View>

        {/* Return Home Button */}
        <View style={{ marginHorizontal: 20, marginTop: 40 }}>
          <TouchableOpacity
            onPress={() => router.replace("/home")}
            style={{
              backgroundColor: "#7B68EE",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Home size={20} color="#FFFFFF" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              Return Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nickname Card - Display Only */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 60,
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#333333",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              NICKNAME
            </Text>
          </View>

          {loadingNickname ? (
            <ActivityIndicator size="small" color="#7B68EE" />
          ) : (
            <>
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: nickname ? "#2A2A2A" : "transparent",
                  borderRadius: 8,
                  borderWidth: nickname ? 1 : 0,
                  borderColor: "#444444",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#FFFFFF",
                    lineHeight: 24,
                  }}
                >
                  {nickname || "Not set"}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: "#333333",
                  marginVertical: 16,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: "#999999",
                  lineHeight: 20,
                }}
              >
                This is how you appear on the leaderboard.
              </Text>
            </>
          )}
        </View>

        {/* Email Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#333333",
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
            EMAIL {email && "✓"}
          </Text>

          {loadingEmail ? (
            <ActivityIndicator size="small" color="#7B68EE" />
          ) : (
            <>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                }}
                placeholder="Enter your email address"
                placeholderTextColor="#666666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!savingEmail}
                style={{
                  fontSize: 16,
                  color: "#FFFFFF",
                  backgroundColor: "#2A2A2A",
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: emailError ? "#FF0000" : "#444444",
                  marginBottom: 8,
                }}
              />
              {emailError ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#FF0000",
                    marginBottom: 12,
                  }}
                >
                  {emailError}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={handleSaveEmail}
                disabled={savingEmail || !email.trim()}
                style={{
                  backgroundColor: email.trim() ? "#7B68EE" : "#333333",
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                  opacity: savingEmail || !email.trim() ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {savingEmail ? "Saving..." : "Save Email"}
                </Text>
              </TouchableOpacity>
              <View
                style={{
                  height: 1,
                  backgroundColor: "#333333",
                  marginVertical: 16,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: "#999999",
                  lineHeight: 20,
                }}
              >
                {email
                  ? "Your email is saved. You're eligible for daily prizes when you win!"
                  : "Add your email to be eligible for daily prizes. Winners are notified via email."}
              </Text>
            </>
          )}
        </View>

        {/* Device ID Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#333333",
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
            YOUR DEVICE ID
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#FFFFFF",
              lineHeight: 24,
              fontFamily: "monospace",
            }}
          >
            {deviceId || "Loading..."}
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: "#333333",
              marginVertical: 16,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              color: "#999999",
              lineHeight: 20,
            }}
          >
            This ID is used to track your scores on the leaderboard. It's stored
            securely on your device.
          </Text>
        </View>

        {/* About Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#333333",
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
            ABOUT THIS APP
          </Text>
          <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
            An educational chart pattern prediction game. Learn to read market
            trends and predict whether tokens RUN or RUG based on historical
            chart patterns.
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: "#333333",
              marginVertical: 16,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              color: "#999999",
              lineHeight: 20,
            }}
          >
            100% simulated. No real money. No wallets. Just pure prediction
            skills.
          </Text>
        </View>

        {/* Disclaimer Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#333333",
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
            DISCLAIMER
          </Text>
          <Text style={{ fontSize: 14, color: "#FFFFFF", lineHeight: 22 }}>
            This app is designed for educational and entertainment purposes
            only.
            {"\n\n"}
            All market activity, trades, balances, profits, and losses displayed
            in the app are <Text style={{ fontWeight: "700" }}>simulated</Text>{" "}
            and use <Text style={{ fontWeight: "700" }}>virtual funds</Text>. No
            real cryptocurrency, money, or financial assets are involved.
            {"\n\n"}
            This app does <Text style={{ fontWeight: "700" }}>not</Text> support
            real trading, real wallets, deposits, withdrawals, or transactions
            of any kind.
            {"\n\n"}
            Nothing in this app constitutes financial, investment, or trading
            advice. Any outcomes shown are hypothetical and based on historical
            data for educational purposes only.
          </Text>
        </View>

        {/* Links Section */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "#333333",
            overflow: "hidden",
          }}
        >
          {/* FAQ */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: "#333333",
            }}
            onPress={() => {
              Linking.openURL("https://1sol.fun/faq");
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              FAQ
            </Text>
            <ExternalLink size={20} color="#999999" />
          </TouchableOpacity>

          {/* Contact */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: "#333333",
            }}
            onPress={() => {
              Linking.openURL("https://1sol.fun/contact");
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              Contact
            </Text>
            <ExternalLink size={20} color="#999999" />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 20,
            }}
            onPress={() => {
              Linking.openURL("https://1sol.fun/privacy");
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              Privacy Policy
            </Text>
            <ExternalLink size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ fontSize: 14, color: "#666666" }}>Version 1.0.0</Text>
        </View>

        {/* Delete Account Button */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={{
              backgroundColor: "#1A1A1A",
              borderWidth: 2,
              borderColor: "#FF0000",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Trash2 size={20} color="#FF0000" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#FF0000",
              }}
            >
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 24,
              padding: 30,
              width: "100%",
              maxWidth: 400,
              borderWidth: 2,
              borderColor: "#FF0000",
            }}
          >
            {/* Icon */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#330000",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={40} color="#FF0000" />
              </View>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#FFFFFF",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Delete Account?
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 16,
                color: "#CCCCCC",
                textAlign: "center",
                lineHeight: 24,
                marginBottom: 30,
              }}
            >
              This will permanently delete all your leaderboard scores and game
              data. This action cannot be undone.
            </Text>

            {/* Buttons */}
            <View style={{ gap: 12 }}>
              {/* Delete Button */}
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                style={{
                  backgroundColor: "#FF0000",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{
                  backgroundColor: "transparent",
                  borderWidth: 2,
                  borderColor: "#333333",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
