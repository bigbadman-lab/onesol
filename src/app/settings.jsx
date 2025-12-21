import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  BackHandler,
  ActivityIndicator,
  Alert,
  Switch,
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
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import * as Linking from "expo-linking";
import useDeviceId from "../utils/useDeviceId";
import { useState, useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";
import { scheduleDailyNotification, cancelDailyNotification } from "../notifications/testNotifications";

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

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    nickname: false,
    email: true, // Keep email expanded by default since it's important
    notifications: false,
    deviceId: false,
    about: false,
    disclaimer: false,
    contestDisclaimer: false,
    links: false,
    version: false,
    deleteAccount: false,
  });
  
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Email modal state - using Alert.prompt instead of Modal+TextInput

  // Track isLoadingEmail changes
  useEffect(() => {
    console.log("[EMAIL] isLoadingEmail state changed to:", isLoadingEmail);
  }, [isLoadingEmail]);

  // Load notification preference on mount
  useEffect(() => {
    (async () => {
      try {
        const enabled = await SecureStore.getItemAsync("daily_notifications_enabled");
        setNotificationsEnabled(enabled === "true");
      } catch (e) {
        console.log("[NOTIFICATIONS] Error loading preference:", e);
      }
    })();
  }, []);

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

        {/* Nickname Card - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("nickname")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
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
            {expandedSections.nickname ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.nickname && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
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
          )}
        </View>

        {/* Email Card - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("email")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              EMAIL {email ? "✓" : ""}
            </Text>
            {expandedSections.email ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.email && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
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
                              // Basic validation with immediate feedback
                              if (!inputEmail || !inputEmail.trim()) {
                                Alert.alert("Invalid Email", "Please enter an email address.");
                                return;
                              }
                              
                              const trimmed = inputEmail.trim();
                              
                              // Enhanced email validation regex
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (!emailRegex.test(trimmed)) {
                                Alert.alert("Invalid Email", "Please enter a valid email address (e.g., user@example.com).");
                                return;
                              }

                              // Check if this is the first time saving (email was empty before)
                              const isFirstTimeSave = !email || email.trim() === "";
                              
                              setSavingEmail(true);
                              setEmailError("");

                              try {
                                console.log("[EMAIL SAVE] Saving email to SecureStore:", trimmed);
                                console.log("[EMAIL SAVE] Is first time save:", isFirstTimeSave);
                                
                                await SecureStore.setItemAsync("user_email", trimmed);
                                console.log("[EMAIL SAVE] Successfully saved to SecureStore");
                                
                                // Verify it was saved by reading it back
                                const verification = await SecureStore.getItemAsync("user_email");
                                console.log("[EMAIL SAVE] Verification - Read back from SecureStore:", verification);
                                console.log("[EMAIL SAVE] Verification - Match:", verification === trimmed);
                                
                                setEmail(trimmed);
                                console.log("[EMAIL SAVE] Updated email state to:", trimmed);
                                
                                // Trigger welcome email on first time save only
                                if (isFirstTimeSave) {
                                  console.log("[EMAIL SAVE] First time save - triggering welcome email");
                                  try {
                                    const response = await fetch("/api/user/profile", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        email: trimmed,
                                      }),
                                    });
                                    
                                    if (response.ok) {
                                      console.log("[EMAIL SAVE] Welcome email trigger sent successfully");
                                    } else {
                                      console.warn("[EMAIL SAVE] Welcome email trigger failed:", response.status);
                                    }
                                  } catch (emailError) {
                                    // Don't fail the save if email trigger fails
                                    console.error("[EMAIL SAVE] Welcome email trigger error (non-blocking):", emailError);
                                  }
                                }
                              } catch (e) {
                                console.error("[EMAIL SAVE] Failed to save email", e);
                                Alert.alert("Error", "Could not save email. Please try again.");
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
          )}
        </View>

        {/* Notifications Card - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("notifications")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              DAILY NOTIFICATIONS
            </Text>
            {expandedSections.notifications ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.notifications && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#FFFFFF",
                      marginBottom: 4,
                    }}
                  >
                    Daily Trade Reminders
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#999999",
                      lineHeight: 20,
                    }}
                  >
                    Get notified daily at 10am when new trades are available
                  </Text>
                </View>
                {isTogglingNotifications ? (
                  <ActivityIndicator size="small" color="#7B68EE" />
                ) : (
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={async (value) => {
                      setIsTogglingNotifications(true);
                      try {
                        if (value) {
                          // Enable notifications
                          const { status } = await Notifications.requestPermissionsAsync();
                          if (status === "granted") {
                            const result = await scheduleDailyNotification();
                            if (result.ok) {
                              await SecureStore.setItemAsync("daily_notifications_enabled", "true");
                              setNotificationsEnabled(true);
                              Alert.alert("Notifications Enabled", "You'll receive daily reminders at 10am when new trades are available.");
                            } else {
                              Alert.alert("Error", "Failed to schedule notification. Please try again.");
                            }
                          } else {
                            Alert.alert("Permission Required", "Notification permissions are required for daily reminders. Please enable them in your device settings.");
                          }
                        } else {
                          // Disable notifications
                          await cancelDailyNotification();
                          await SecureStore.setItemAsync("daily_notifications_enabled", "false");
                          setNotificationsEnabled(false);
                        }
                      } catch (error) {
                        console.error("Error toggling notifications:", error);
                        Alert.alert("Error", "Failed to update notification settings. Please try again.");
                      } finally {
                        setIsTogglingNotifications(false);
                      }
                    }}
                    trackColor={{ false: "#333333", true: "#7B68EE" }}
                    thumbColor={notificationsEnabled ? "#FFFFFF" : "#CCCCCC"}
                  />
                )}
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: "#333333",
                  marginVertical: 12,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: "#999999",
                  lineHeight: 20,
                }}
              >
                {notificationsEnabled
                  ? "Daily notifications are enabled. You'll receive a reminder at 10am when new trades are available."
                  : "Enable daily notifications to get reminded when new trades are ready each day."}
              </Text>
            </View>
          )}
        </View>

        {/* Device ID Card - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("deviceId")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              YOUR DEVICE ID
            </Text>
            {expandedSections.deviceId ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.deviceId && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
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
          )}
        </View>

        {/* About Card - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("about")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              ABOUT THIS APP
            </Text>
            {expandedSections.about ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.about && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
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
          )}
        </View>

        {/* Disclaimer Card - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("disclaimer")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              DISCLAIMER
            </Text>
            {expandedSections.disclaimer ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.disclaimer && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
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
          )}
        </View>

        {/* Contest Disclaimer Card - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("contestDisclaimer")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              CONTEST DISCLAIMER
            </Text>
            {expandedSections.contestDisclaimer ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.contestDisclaimer && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <Text style={{ fontSize: 14, color: "#FFFFFF", lineHeight: 22 }}>
                This promotion is not sponsored, endorsed, or administered by Apple Inc. Apple is not involved in this contest in any way.
                {"\n\n"}
                For questions, comments, or concerns about this contest, please contact the contest administrator directly. Apple is not responsible for this promotion or its outcomes.
                {"\n\n"}
                This contest is subject to all applicable federal, state, and local laws. Void where prohibited.
              </Text>
            </View>
          )}
        </View>

        {/* Links Section - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("links")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
              borderBottomWidth: expandedSections.links ? 1 : 0,
              borderBottomColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              LINKS
            </Text>
            {expandedSections.links ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.links && (
            <>
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
            </>
          )}
        </View>

        {/* Version - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("version")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
              }}
            >
              VERSION
            </Text>
            {expandedSections.version ? (
              <ChevronUp size={20} color="#7B68EE" />
            ) : (
              <ChevronDown size={20} color="#7B68EE" />
            )}
          </TouchableOpacity>
          {expandedSections.version && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24, alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: "#666666" }}>Version 1.0.0</Text>
            </View>
          )}
        </View>

        {/* Delete Account Button - Collapsible */}
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
          <TouchableOpacity
            onPress={() => toggleSection("deleteAccount")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#FF0000",
              }}
            >
              DELETE ACCOUNT
            </Text>
            {expandedSections.deleteAccount ? (
              <ChevronUp size={20} color="#FF0000" />
            ) : (
              <ChevronDown size={20} color="#FF0000" />
            )}
          </TouchableOpacity>
          {expandedSections.deleteAccount && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(true)}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderWidth: 2,
                  borderColor: "#FF0000",
                  borderRadius: 12,
                  paddingVertical: 14,
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
          )}
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
