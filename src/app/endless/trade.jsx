import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Flag } from "lucide-react-native";
import { useState, useEffect } from "react";
import useGameStore from "../../utils/gameStore";
import { BET_OPTIONS } from "../../utils/tradesData";

export default function EndlessTrade() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentTrade = useGameStore((state) => state.endlessModeCurrentTrade);
  const tradeCount = useGameStore((state) => state.endlessModeTradeCount);
  const balance = useGameStore((state) => state.endlessModeBalance);
  const selectedBet = useGameStore((state) => state.endlessModeSelectedBet);
  const setSelectedBet = useGameStore(
    (state) => state.setEndlessModeSelectedBet,
  );
  const submitTrade = useGameStore((state) => state.submitEndlessTrade);

  useEffect(() => {
    // Reset bet selection when trade changes
    if (currentTrade?.id) {
      setSelectedBet(null);
    }
  }, [currentTrade?.id]);

  // Show loading while trade is being fetched
  if (!currentTrade) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar style="light" />
        <Text style={{ color: "#FFFFFF", fontSize: 16 }}>Loading trade...</Text>
      </View>
    );
  }

  const handleSubmit = async (choice) => {
    if (!selectedBet) {
      alert("Please select a bet amount first");
      return;
    }

    try {
      await submitTrade(choice);
      router.push("/endless/result");
    } catch (error) {
      console.error("Error submitting trade:", error);
      
      // If all trades are exhausted, end the game gracefully
      if (error.message === "ALL_TRADES_EXHAUSTED" || error.message.includes("No trades are currently available")) {
        console.log("All trades exhausted, redirecting to complete page");
        router.push("/endless/complete");
      } else if (error.message === "OFFLINE") {
        alert("No internet connection. Please check your connection and try again.");
      } else {
        alert("Failed to submit trade. Please try again.");
      }
    }
  };

  const handleEndRun = () => {
    // Navigate to complete screen - it will show current stats
    router.replace("/endless/complete");
  };

  const handleGoHome = () => {
    // Navigate to home
    router.replace("/home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity onPress={handleGoHome}>
            <Home size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              ENDLESS MODE
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#999999",
                marginTop: 2,
              }}
            >
              Trade #{tradeCount + 1}
            </Text>
          </View>

          <TouchableOpacity onPress={handleEndRun}>
            <Flag size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={{ alignItems: "center", marginTop: 16 }}>
          <Text
            style={{
              fontSize: 12,
              color: "#999999",
              marginBottom: 4,
            }}
          >
            Current Balance
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#FFFFFF",
            }}
          >
            {balance.toFixed(2)} SOL
          </Text>
        </View>

        {/* Token Info */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#FFFFFF",
            }}
          >
            {currentTrade?.name || "Unknown Token"}
          </Text>
          {currentTrade?.ticker && (
            <Text
              style={{
                fontSize: 14,
                color: "#999999",
                marginTop: 2,
                fontWeight: "600",
              }}
            >
              ${currentTrade.ticker}
            </Text>
          )}
        </View>

        {/* Chart image */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 12,
            height: 240,
            backgroundColor: "#1A1A1A",
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 2,
            borderColor: "#333333",
          }}
        >
          {currentTrade?.chart_cut_image ? (
            <>
              <Image
                source={{ uri: currentTrade.chart_cut_image }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={100}
              />
              {/* Timeframe indicator */}
              {currentTrade?.timeframe && (
                <View
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: "#FFFFFF",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#FFFFFF",
                    }}
                  >
                    {currentTrade.timeframe}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, color: "#666666" }}>
                Loading chart...
              </Text>
            </View>
          )}
        </View>

        {/* Bet selection */}
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: 10,
            }}
          >
            Select Your Trade
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            {BET_OPTIONS.map((bet) => (
              <TouchableOpacity
                key={bet}
                onPress={() => setSelectedBet(bet)}
                disabled={bet > balance}
                style={{
                  flex: 1,
                  backgroundColor:
                    selectedBet === bet
                      ? "#FFFFFF"
                      : bet > balance
                        ? "#1A1A1A"
                        : "#2A2A2A",
                  paddingVertical: 14,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor:
                    selectedBet === bet
                      ? "#FFFFFF"
                      : bet > balance
                        ? "#333333"
                        : "#444444",
                  opacity: bet > balance ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color:
                      bet > balance
                        ? "#666666"
                        : selectedBet === bet
                          ? "#000000"
                          : "#FFFFFF",
                    textAlign: "center",
                  }}
                >
                  {bet.toFixed(2)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color:
                      bet > balance
                        ? "#666666"
                        : selectedBet === bet
                          ? "#666666"
                          : "#999999",
                    textAlign: "center",
                    marginTop: 2,
                  }}
                >
                  SOL
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prediction buttons */}
        <View style={{ marginHorizontal: 20, marginTop: 30 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Will this token...
          </Text>

          <TouchableOpacity
            onPress={() => handleSubmit("RICH")}
            style={{
              backgroundColor: "#FFFFFF",
              paddingVertical: 14,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: "#000000",
                textAlign: "center",
              }}
            >
              🚀 RUN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSubmit("RUG")}
            style={{
              backgroundColor: "#FFFFFF",
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: "#000000",
                textAlign: "center",
              }}
            >
              💀 RUG
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info text */}
        {!selectedBet && (
          <View style={{ marginHorizontal: 20, marginTop: 20 }}>
            <Text
              style={{
                fontSize: 13,
                color: "#999999",
                textAlign: "center",
              }}
            >
              Select a trade amount before making your prediction
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
