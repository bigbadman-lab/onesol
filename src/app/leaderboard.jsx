import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, Trophy, Medal, Home } from "lucide-react-native";
import { useState, useEffect } from "react";
import useDeviceId from "../utils/useDeviceId";
import { Image } from "expo-image";

export default function Leaderboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useDeviceId();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasNickname, setHasNickname] = useState(true); // assume true initially to avoid flashing badge

  useEffect(() => {
    fetchLeaderboard();
    checkNickname();
  }, []);

  // Check if user has a nickname
  const checkNickname = async () => {
    if (!deviceId) return;

    try {
      const response = await fetch(`/api/user/profile?uuid=${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setHasNickname(!!data.nickname);
      }
    } catch (error) {
      console.error("Error checking nickname:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      console.log("Fetching leaderboard from /api/leaderboard/today");

      const response = await fetch("/api/leaderboard/today");
      console.log("Leaderboard response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Failed to fetch leaderboard";
        try {
          const errorData = await response.json();
          console.error("Leaderboard API error:", errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          const textError = await response.text();
          console.error("Raw error response:", textError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Leaderboard data received:", data);
      // Handle empty leaderboard or missing data gracefully
      const leaderboardData = data?.leaderboard || data || [];
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      // If it's a network error, show empty state instead of error
      if (err.message === "Network request failed" || err.message.includes("Failed to fetch")) {
        setLeaderboard([]);
        setError(null);
      } else {
        setError("Failed to load leaderboard");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getDisplayName = (entry) => {
    if (!entry) return "Unknown User";
    if (entry.nickname) return entry.nickname;
    // Show shortened UUID if no nickname
    if (entry.uuid) {
      return `User-${entry.uuid.slice(0, 8)}`;
    }
    return "Unknown User";
  };

  const getRankDisplay = (index) => {
    const rank = index + 1;
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7B68EE"
          />
        }
      >
        {/* Home icon - top left */}
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          style={{
            position: "absolute",
            top: insets.top + 20,
            left: 20,
            zIndex: 10,
          }}
        >
          <Home size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Settings icon - top right with notification badge */}
        <View
          style={{
            position: "absolute",
            top: insets.top + 20,
            right: 20,
            zIndex: 10,
          }}
        >
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <Settings size={32} color="#FFFFFF" />
            {!hasNickname && (
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#FF0000",
                  borderWidth: 2,
                  borderColor: "#000000",
                }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Image
            source={{
              uri: "https://ucarecdn.com/e2c6a1b2-3dbf-4dfc-9c1d-e3c00ebcf499/-/format/auto/",
            }}
            style={{ width: 280, height: 80 }}
            contentFit="contain"
            transition={100}
          />
          <Text
            style={{
              fontSize: 14,
              color: "#7B68EE",
              marginTop: 4,
            }}
          >
            Today's Top Players
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={{ alignItems: "center", marginTop: 100 }}>
            <ActivityIndicator size="large" color="#7B68EE" />
            <Text
              style={{
                fontSize: 16,
                color: "#999999",
                marginTop: 16,
              }}
            >
              Loading leaderboard...
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              alignItems: "center",
              marginTop: 100,
              paddingHorizontal: 40,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: "#FF0000",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={fetchLeaderboard}
              style={{
                backgroundColor: "#7B68EE",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : leaderboard.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              marginTop: 100,
              paddingHorizontal: 40,
            }}
          >
            <Trophy size={64} color="#333333" />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#FFFFFF",
                textAlign: "center",
                marginTop: 20,
                marginBottom: 12,
              }}
            >
              No Scores Yet
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#999999",
                textAlign: "center",
                lineHeight: 24,
              }}
            >
              Be the first to play today and claim the top spot!
            </Text>
          </View>
        ) : (
          <View style={{ marginHorizontal: 20, marginTop: 40 }}>
            {leaderboard
              .filter((entry) => entry && entry.uuid) // Filter out invalid entries
              .map((entry, index) => {
                const isCurrentUser = entry.uuid === deviceId;
                const rank = index + 1;
                const finalSol = entry.final_sol != null ? parseFloat(entry.final_sol) : 0;
                const correctCount = entry.correct_count != null ? entry.correct_count : 0;

                return (
                  <View
                    key={entry.uuid}
                    style={{
                      backgroundColor: isCurrentUser ? "#1A1A3A" : "#1A1A1A",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 2,
                      borderColor: isCurrentUser ? "#7B68EE" : "#333333",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {/* Rank */}
                    <View
                      style={{
                        width: 50,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: rank <= 3 ? 32 : 20,
                          fontWeight: "900",
                          color: rank <= 3 ? "#FFFFFF" : "#999999",
                        }}
                      >
                        {getRankDisplay(index)}
                      </Text>
                    </View>

                    {/* Player Info */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: "#FFFFFF",
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {getDisplayName(entry)}
                        {isCurrentUser && (
                          <Text style={{ color: "#7B68EE" }}> (You)</Text>
                        )}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#999999",
                        }}
                      >
                        {correctCount} correct prediction{correctCount !== 1 ? 's' : ''}
                      </Text>
                    </View>

                    {/* Score */}
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: "900",
                          color: "#00FF00",
                        }}
                      >
                        {isNaN(finalSol) ? "0.00" : finalSol.toFixed(2)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#999999",
                          marginTop: 2,
                        }}
                      >
                        SOL
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Info text */}
        {!loading && !error && leaderboard.length > 0 && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 30,
              padding: 20,
              backgroundColor: "#1A1A1A",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#999999",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Pull down to refresh • Scores reset daily • Play again to improve
              your rank
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
