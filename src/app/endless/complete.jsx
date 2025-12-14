import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, Trophy, Home } from "lucide-react-native";
import { Image } from "expo-image";
import useGameStore from "../../utils/gameStore";
import { STARTING_BALANCE } from "../../utils/tradesData";
import { useState, useEffect } from "react";
import useDeviceId from "../../utils/useDeviceId";

export default function EndlessComplete() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useDeviceId();

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

  const accuracy =
    tradeCount > 0 ? Math.round((correctCount / tradeCount) * 100) : 0;
  const pnl = balance - STARTING_BALANCE;
  const returnPct =
    STARTING_BALANCE > 0 ? ((pnl / STARTING_BALANCE) * 100).toFixed(2) : 0;

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!deviceId) return;
      try {
        const response = await fetch(`/api/user/profile?uuid=${deviceId}`);
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [deviceId]);

  // Submit score to leaderboard on mount
  useEffect(() => {
    const submitScore = async () => {
      if (!deviceId || hasSubmitted || isSubmitting) return;

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/leaderboard/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uuid: deviceId,
            final_sol: balance,
            correct_count: correctCount,
          }),
        });

        if (response.ok) {
          setHasSubmitted(true);
        }
      } catch (error) {
        console.error("Error submitting score:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitScore();
  }, [deviceId, balance, correctCount, hasSubmitted, isSubmitting]);

  const handlePlayAgain = async () => {
    await startEndlessMode();
    router.push("/endless/trade");
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
            backgroundColor: "rgba(255, 255, 255, 0.05)",
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

        {/* Primary CTA */}
        <View style={{ marginTop: 40 }}>
          <TouchableOpacity
            onPress={handlePlayAgain}
            style={{
              backgroundColor: "#F5F5F5",
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 30,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#000000",
                textAlign: "center",
              }}
            >
              Play Again →
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
    </View>
  );
}
