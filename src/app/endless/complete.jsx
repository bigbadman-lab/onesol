import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, Trophy, Home } from "lucide-react-native";
import { Image } from "expo-image";
import useGameStore from "../../utils/gameStore";
import { STARTING_BALANCE } from "../../utils/tradesData";
import { useState, useEffect, useCallback } from "react";
import useDeviceId from "../../utils/useDeviceId";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { scheduleDailyNotification } from "../../notifications/testNotifications";
import * as Linking from "expo-linking";
import { useFocusEffect } from "@react-navigation/native";

export default function EndlessComplete() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId, friendlyName } = useDeviceId();

  const balance = useGameStore((state) => state.endlessModeBalance);
  const tradeCount = useGameStore((state) => state.endlessModeTradeCount);
  const correctCount = useGameStore((state) => state.endlessModeCorrectCount);
  const hasReset = useGameStore((state) => state.endlessModeHasReset);
  const resetEndlessMode = useGameStore((state) => state.resetEndlessMode);
  const setEndlessModeHasReset = useGameStore(
    (state) => state.setEndlessModeHasReset,
  );
  const startEndlessMode = useGameStore((state) => state.startEndlessMode);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showAllTradesModal, setShowAllTradesModal] = useState(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [isFindingTrades, setIsFindingTrades] = useState(false);
  const [showEmailCard, setShowEmailCard] = useState(false);

  const accuracy =
    tradeCount > 0 ? Math.round((correctCount / tradeCount) * 100) : 0;
  const pnl = balance - STARTING_BALANCE;
  const returnPct =
    STARTING_BALANCE > 0 ? ((pnl / STARTING_BALANCE) * 100).toFixed(2) : 0;

  // Fetch user profile on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!deviceId || !isMounted) return;
      try {
        const response = await fetch(`/api/user/profile?uuid=${deviceId}`);
        if (response.ok && isMounted) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [deviceId]);

  // Submit score to leaderboard on mount (only once)
  useEffect(() => {
    let isMounted = true;
    const submitScore = async () => {
      if (!deviceId || hasSubmitted || isSubmitting || !isMounted) return;

      setIsSubmitting(true);
      try {
        // Get email from SecureStore
        const userEmail = await SecureStore.getItemAsync("user_email");
        
        const response = await fetch("/api/leaderboard/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uuid: deviceId,
            friendly_name: friendlyName,
            final_sol: balance,
            correct_count: correctCount,
            ...(userEmail && { email: userEmail }), // Include email if available
          }),
        });

        if (response.ok && isMounted) {
          setHasSubmitted(true);
        } else if (isMounted) {
          // Handle validation errors
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error === "Invalid email format") {
            console.error("Email validation error:", errorData.error);
            // Clear invalid email from SecureStore
            await SecureStore.deleteItemAsync("user_email");
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error submitting score:", error);
        }
      } finally {
        if (isMounted) {
          setIsSubmitting(false);
        }
      }
    };

    submitScore();
    return () => {
      isMounted = false;
    };
    // Only run once when component mounts - remove state dependencies that could cause loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for email when screen comes into focus - show card if no email exists
  useFocusEffect(
    useCallback(() => {
      const checkEmail = async () => {
        try {
          const userEmail = await SecureStore.getItemAsync("user_email");
          // Show card if user doesn't have an email
          // (Card can be hidden by "Maybe Later" for this page visit, but will show again when they return)
          if (!userEmail) {
            setShowEmailCard(true);
          } else {
            // Hide card if user has email
            setShowEmailCard(false);
          }
        } catch (error) {
          console.error("Error checking email:", error);
          // On error, assume no email and show card
          setShowEmailCard(true);
        }
      };
      checkEmail();
    }, [])
  );

  // Hide email card when notification modal appears
  useEffect(() => {
    if (showAllTradesModal) {
      setShowEmailCard(false);
    }
  }, [showAllTradesModal]);

  const handlePlayAgain = async () => {
    if (isFindingTrades) return; // Prevent multiple clicks
    
    setIsFindingTrades(true);
    try {
      await startEndlessMode();
      router.push("/endless/trade");
    } catch (error) {
      console.error("Error starting new game:", error);
      
      if (error.message === "OFFLINE") {
        alert("No internet connection. Please check your connection and try again.");
      } else if (error.message === "ALL_TRADES_USED_TODAY") {
        // Check if notifications are already enabled
        const notificationsEnabled = await SecureStore.getItemAsync("daily_notifications_enabled");
        if (notificationsEnabled === "true") {
          // Notifications already enabled - show simple message
          alert("New trades available tomorrow at 10am. You'll get a reminder!");
        } else {
          // Notifications not enabled - show modal with prompt
          setShowAllTradesModal(true);
        }
      } else if (error.message.includes("No trades are currently available")) {
        // Check if notifications are already enabled
        const notificationsEnabled = await SecureStore.getItemAsync("daily_notifications_enabled");
        if (notificationsEnabled === "true") {
          // Notifications already enabled - show simple message
          alert("New trades available tomorrow at 10am. You'll get a reminder!");
        } else {
          // Notifications not enabled - show modal with prompt
          setShowAllTradesModal(true);
        }
      } else {
        alert("Failed to start new game. Please try again.");
      }
      // Don't navigate - stay on complete page
    } finally {
      setIsFindingTrades(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      {/* Background Image */}
      <Image
        source={{
          uri: "https://ucarecdn.com/1af81939-f5e0-4fda-9b3e-4906a8b8d99c/-/format/auto/",
        }}
        style={[StyleSheet.absoluteFill, { opacity: 0.18 }]}
        contentFit="cover"
        transition={100}
        pointerEvents="none"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 30,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
        {/* Home icon - top left */}
        <TouchableOpacity
          onPress={() => router.push("/home")}
          style={{
            position: "absolute",
            top: insets.top + 20,
            left: 30,
            zIndex: 10,
          }}
        >
          <Home size={28} color="#999999" />
        </TouchableOpacity>

        {/* Settings icon */}
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={{
            position: "absolute",
            top: insets.top + 20,
            right: 30,
            zIndex: 10,
          }}
        >
          <Settings size={28} color="#999999" />
        </TouchableOpacity>

        {/* Game Over Title */}
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Text
            style={{
              fontSize: 56,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            Game Over
          </Text>
        </View>

        {/* Compact Performance Card */}
        <View
          style={{
            marginTop: 40,
            backgroundColor: "#1A1A1A",
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Total P&L - Hero stat */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                color: "#999999",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Total P&L
            </Text>
            <Text
              style={{
                fontSize: 48,
                fontWeight: "900",
                color: pnl >= 0 ? "#00FF00" : "#FF0000",
              }}
            >
              {pnl >= 0 ? "+" : ""}
              {pnl.toFixed(2)} SOL
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: pnl >= 0 ? "#00FF00" : "#FF0000",
                marginTop: 4,
              }}
            >
              {returnPct >= 0 ? "+" : ""}
              {returnPct}%
            </Text>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              marginBottom: 20,
            }}
          />

          {/* Stats Grid */}
          <View style={{ gap: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 14, color: "#999999" }}>
                Starting Balance
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}
              >
                {STARTING_BALANCE.toFixed(2)} SOL
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 14, color: "#999999" }}>
                Final Balance
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}
              >
                {balance.toFixed(2)} SOL
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 14, color: "#999999" }}>Accuracy</Text>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}
              >
                {accuracy}% ({correctCount}/{tradeCount})
              </Text>
            </View>
          </View>
        </View>

        {/* Email Collection Card */}
        {showEmailCard && (
          <View
            style={{
              marginTop: 24,
              backgroundColor: "#1A1A1A",
              borderRadius: 20,
              padding: 24,
              borderWidth: 2,
              borderColor: "#7B68EE",
              zIndex: 100,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: "#FFFFFF",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              🎁 Win Daily Prizes!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#CCCCCC",
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              Add your email to be eligible for daily prizes when you win!
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://1sol.fun/contest-rules")}
              style={{
                marginBottom: 20,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#7B68EE",
                  textAlign: "center",
                  textDecorationLine: "underline",
                }}
              >
                View Contest Rules
              </Text>
            </TouchableOpacity>
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  console.log("Email card: Navigate to settings button pressed");
                  // Hide card and navigate immediately - no setTimeout to avoid memory issues
                  setShowEmailCard(false);
                  try {
                    console.log("Email card: Attempting navigation with push");
                    router.push("/settings");
                    console.log("Email card: Push navigation called");
                  } catch (error) {
                    console.error("Email card: Push navigation error:", error);
                  }
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: "#7B68EE",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  Add Email in Settings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowEmailCard(false)}
                style={{
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: "#333333",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#999999",
                  }}
                >
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Primary CTA */}
        <View style={{ marginTop: 40 }}>
          <TouchableOpacity
            onPress={handlePlayAgain}
            disabled={isFindingTrades}
            style={{
              backgroundColor: isFindingTrades ? "#7B68EE" : "#F5F5F5",
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 30,
              opacity: isFindingTrades ? 0.9 : 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {isFindingTrades && (
              <ActivityIndicator size="small" color="#FFFFFF" />
            )}
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: isFindingTrades ? "#FFFFFF" : "#000000",
                textAlign: "center",
              }}
            >
              {isFindingTrades ? "Finding Trades..." : "Play Again →"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Leaderboard Button - Centered */}
        <View
          style={{
            alignItems: "center",
            marginTop: 32,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/leaderboard")}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Trophy size={20} color="#FFFFFF" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              View Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* All Trades Used Modal */}
      <Modal
        visible={showAllTradesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAllTradesModal(false)}
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
              borderColor: "#7B68EE",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#FFFFFF",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              All Trades Complete! 🎉
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#CCCCCC",
                textAlign: "center",
                lineHeight: 24,
                marginBottom: 30,
              }}
            >
              You've seen all available trades for today. New trades will be available tomorrow at 10am.
              {"\n\n"}
              Would you like to get a daily reminder when new trades are ready?
            </Text>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={async () => {
                  setIsEnablingNotifications(true);
                  try {
                    // Request notification permissions
                    const { status } = await Notifications.requestPermissionsAsync();
                    
                    if (status === "granted") {
                      // Schedule the daily notification
                      const result = await scheduleDailyNotification();
                      if (result.ok) {
                        // Enable daily notifications in settings
                        await SecureStore.setItemAsync("daily_notifications_enabled", "true");
                        setShowAllTradesModal(false);
                        alert("Daily notifications enabled! You'll get a reminder when new trades are available.");
                      } else {
                        alert("Failed to schedule notification. Please try again in Settings.");
                      }
                    } else {
                      alert("Notification permissions are required for daily reminders. You can enable them later in Settings.");
                    }
                  } catch (error) {
                    console.error("Error enabling notifications:", error);
                    alert("Failed to enable notifications. Please try again in Settings.");
                  } finally {
                    setIsEnablingNotifications(false);
                  }
                }}
                disabled={isEnablingNotifications}
                style={{
                  backgroundColor: "#7B68EE",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: isEnablingNotifications ? 0.6 : 1,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isEnablingNotifications && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {isEnablingNotifications ? "Enabling..." : "Yes, Enable Daily Reminders"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowAllTradesModal(false)}
                disabled={isEnablingNotifications}
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
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
