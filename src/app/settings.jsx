import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  BackHandler,
  ActivityIndicator,
  Alert,
} from "react-native";
// TextInput import removed - causing page crash even with polyfill
// Will use alternative approach
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
import { useState, useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { Image } from "expo-image";

export default function Settings() {
  console.log("Settings: Component function called");
  
  const router = useRouter();
  console.log("Settings: router obtained");
  const insets = useSafeAreaInsets();
  console.log("Settings: insets obtained");
  const { deviceId, friendlyName, loading: loadingDeviceId } = useDeviceId();
  console.log("Settings: useDeviceId completed", { deviceId: deviceId ? "exists" : "null", loading: loadingDeviceId });
  
  const instanceId = useRef(Math.random().toString(16).slice(2));
  
  useEffect(() => {
    console.log("Settings mounted", instanceId.current);
    return () => console.log("Settings unmounted", instanceId.current);
  }, []);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Email state
  const [email, setEmail] = useState("");
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Email modal state - using Alert.prompt instead of Modal+TextInput

  // Track isLoadingEmail changes
  useEffect(() => {
    console.log("[EMAIL] isLoadingEmail state changed to:", isLoadingEmail);
  }, [isLoadingEmail]);

  // Load email on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      console.log("[EMAIL] Starting load...");
      setIsLoadingEmail(true);
      try {
        const stored = await SecureStore.getItemAsync("user_email");
        console.log("[EMAIL LOAD] Loaded from SecureStore:", stored ? `"${stored}"` : "null");
        if (!cancelled) {
          setEmail(stored ?? "");
          console.log("[EMAIL LOAD] Set email state to:", stored ?? "(empty)");
        }
      } catch (e) {
        console.log("[EMAIL] load error", e);
        if (!cancelled) {
          setEmail("");
          console.log("[EMAIL] Set email to empty on error");
        }
      } finally {
        if (!cancelled) {
          console.log("[EMAIL] Setting isLoadingEmail to false");
          setIsLoadingEmail(false);
          console.log("[EMAIL] isLoadingEmail should now be false");
        } else {
          console.log("[EMAIL] Component cancelled, not updating state");
        }
      }
    })();

    return () => {
      console.log("[EMAIL] Cleanup: cancelling");
      cancelled = true;
    };
  }, []);

  const handleSaveEmail = async () => {
    const trimmed = email.trim();

    // basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email.");
      return;
    }

    setSavingEmail(true);
    setEmailError("");

    try {
      await SecureStore.setItemAsync("user_email", trimmed);
    } catch (e) {
      console.warn("Failed to save email", e);
      setEmailError("Could not save email. Please try again.");
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

  console.log("Settings: About to return JSX, isLoadingEmail:", isLoadingEmail);

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      
      {/* TextInput removed - React Native 0.81.5 + React 19.1.0 compatibility issue */}
      {/* Will implement email card using alternative approach */}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
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
          <Text style={{ color: "white", fontSize: 24 }}>Settings</Text>
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
            marginTop: 20,
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#333333",
            minHeight: 100,
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

          {loadingDeviceId ? (
            <ActivityIndicator size="small" color="#7B68EE" />
          ) : (
            <>
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: friendlyName ? "#2A2A2A" : "transparent",
                  borderRadius: 8,
                  borderWidth: friendlyName ? 1 : 0,
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
                  {friendlyName || "Not set"}
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

        {/* Email Card - Using Modal for TextInput */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            borderWidth: 2,
            borderColor: "#333333",
            minHeight: 200,
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
            EMAIL {email ? "✓" : ""}
          </Text>

          {/* Show loading spinner when loading */}
          {isLoadingEmail ? (
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <ActivityIndicator size="small" color="#7B68EE" />
            </View>
          ) : (
            <>
              {/* Display current email or placeholder */}
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: email ? "#2A2A2A" : "transparent",
                  borderRadius: 8,
                  borderWidth: email ? 1 : 0,
                  borderColor: "#444444",
                  marginBottom: 12,
                  minHeight: 48,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: email ? "#FFFFFF" : "#666666",
                    lineHeight: 24,
                  }}
                >
                  {email || "No email set"}
                </Text>
              </View>

              {/* Button to open email input using Alert.prompt */}
              <TouchableOpacity
                onPress={() => {
                  console.log("Add/Edit Email button pressed");
                  // Use Alert.prompt as workaround for TextInput crash
                  Alert.prompt(
                    email ? "Edit Email" : "Add Email",
                    "Enter your email address:",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Save",
                        onPress: async (inputEmail) => {
                          if (!inputEmail || !inputEmail.trim()) {
                            setEmailError("Please enter an email address.");
                            return;
                          }
                          const trimmed = inputEmail.trim();
                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                            setEmailError("Please enter a valid email.");
                            return;
                          }

                          setSavingEmail(true);
                          setEmailError("");

                          try {
                            console.log("[EMAIL SAVE] Saving email to SecureStore:", trimmed);
                            await SecureStore.setItemAsync("user_email", trimmed);
                            console.log("[EMAIL SAVE] Successfully saved to SecureStore");
                            
                            // Verify it was saved by reading it back
                            const verification = await SecureStore.getItemAsync("user_email");
                            console.log("[EMAIL SAVE] Verification - Read back from SecureStore:", verification);
                            console.log("[EMAIL SAVE] Verification - Match:", verification === trimmed);
                            
                            setEmail(trimmed);
                            console.log("[EMAIL SAVE] Updated email state to:", trimmed);
                          } catch (e) {
                            console.error("[EMAIL SAVE] Failed to save email", e);
                            setEmailError("Could not save email. Please try again.");
                          } finally {
                            setSavingEmail(false);
                          }
                        },
                      },
                    ],
                    "plain-text",
                    email || "",
                    "email-address"
                  );
                }}
                disabled={savingEmail}
                style={{
                  backgroundColor: "#7B68EE",
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                  opacity: savingEmail ? 0.6 : 1,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {email ? "Edit Email" : "Add Email"}
                </Text>
              </TouchableOpacity>

              {!!emailError && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#FF0000",
                    marginBottom: 12,
                  }}
                >
                  {emailError}
                </Text>
              )}

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
            minHeight: 100,
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
          {loadingDeviceId ? (
            <ActivityIndicator size="small" color="#7B68EE" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                color: "#FFFFFF",
                lineHeight: 24,
                fontFamily: "monospace",
              }}
            >
              {deviceId || "Not available"}
            </Text>
          )}
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

        {/* Contest Disclaimer Card */}
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
            CONTEST DISCLAIMER
          </Text>
          <Text style={{ fontSize: 14, color: "#FFFFFF", lineHeight: 22 }}>
            This contest/sweepstakes is in no way sponsored, endorsed, or
            administered by Apple Inc. Apple is not a sponsor of, or participant
            in, this promotion.
            {"\n\n"}
            Apple is not responsible for this contest/sweepstakes or any of its
            rules, procedures, or outcomes. Any questions, comments, or complaints
            regarding this contest/sweepstakes should be directed to the contest
            administrator, not Apple.
            {"\n\n"}
            This contest/sweepstakes is subject to all applicable federal, state,
            and local laws and regulations. Void where prohibited by law.
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

          {/* Contest Rules */}
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
              Linking.openURL("https://1sol.fun/contest-rules");
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              Contest Rules
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

      {/* Email input now uses Alert.prompt instead of Modal+TextInput */}

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
