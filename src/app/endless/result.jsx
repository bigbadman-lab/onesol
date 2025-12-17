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
import { Home, Flag } from "lucide-react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import useGameStore from "../../utils/gameStore";

export default function EndlessResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const balance = useGameStore((state) => state.endlessModeBalance);
  const results = useGameStore((state) => state.endlessModeResults);
  const tradeCount = useGameStore((state) => state.endlessModeTradeCount);
  const currentTrade = useGameStore((state) => state.endlessModeCurrentTrade);
  const completeEndlessMode = useGameStore(
    (state) => state.completeEndlessMode,
  );

  // Get the last result
  const lastResult = results[results.length - 1];
  const [tradeData, setTradeData] = useState(null);

  useEffect(() => {
    // Fetch full trade data to get chart_final_image
    if (lastResult?.tradeId) {
      fetch(`/api/trades/${lastResult.tradeId}`)
        .then((res) => res.json())
        .then((data) => setTradeData(data))
        .catch((err) => console.error("Failed to fetch trade data:", err));
    }
  }, [lastResult?.tradeId]);

  if (!lastResult) {
    router.replace("/home");
    return null;
  }

  const isCorrect = lastResult.isCorrect;
  const isProfitable = lastResult.pnl > 0;
  const outcomeColor = lastResult.outcome === "RICH" ? "#00FF00" : "#FF0000";

  const handleNext = () => {
    // Check if there are more trades available by checking if current trade exists
    if (balance <= 0 || !currentTrade) {
      router.push("/endless/complete");
    } else {
      router.push("/endless/trade");
    }
  };

  const handleQuit = () => {
    completeEndlessMode();
    router.push("/endless/complete");
  };

  const handleGoHome = () => {
    router.replace("/home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      {/* Conditional Background Image */}
      <Image
        source={{
          uri: isCorrect
            ? "https://raw.createusercontent.com/47d3cfbc-890d-476a-bef3-850543f21c73/"
            : "https://raw.createusercontent.com/ea0fb315-8b67-4d94-9adf-461d63dda1ab/",
        }}
        style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
        contentFit="cover"
        transition={100}
        pointerEvents="none"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Home (left) and Flag (right) buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
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
              Trade #{tradeCount}
            </Text>
          </View>

          <TouchableOpacity onPress={handleQuit}>
            <Flag size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Result Header */}
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "900",
              color: isCorrect ? "#00FF00" : "#FF0000",
            }}
          >
            {isCorrect ? "CORRECT!" : "WRONG!"}
          </Text>
        </View>

        {/* Chart final image */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 12,
            height: 240,
            backgroundColor: "#1A1A1A",
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 2,
            borderColor: isCorrect ? "#00FF00" : "#FF0000",
          }}
        >
          {tradeData?.chart_final_image ? (
            <Image
              source={{ uri: tradeData.chart_final_image }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={100}
            />
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

        {/* Outcome & Return % - Side by Side */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            flexDirection: "row",
            gap: 10,
          }}
        >
          {/* Outcome Badge */}
          <View
            style={{
              flex: 1,
              backgroundColor: outcomeColor,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#000000",
              }}
            >
              {lastResult.outcome === "RICH" ? "RUNS 🚀" : "RUGS 💀"}
            </Text>
          </View>

          {/* Return % Badge */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#1A1A1A",
              paddingVertical: 14,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: outcomeColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: "#999999",
                marginBottom: 2,
                fontWeight: "600",
              }}
            >
              RETURN
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: outcomeColor,
              }}
            >
              {lastResult.returnPct > 0 ? "+" : ""}
              {lastResult.returnPct}%
            </Text>
          </View>
        </View>

        {/* Compact Info Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            backgroundColor: "#1A1A1A",
            borderRadius: 12,
            padding: 16,
            borderWidth: 2,
            borderColor: isProfitable ? "#00FF00" : "#FF0000",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 13, color: "#999999" }}>
              Trade Amount:
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
              {lastResult.betAmount.toFixed(2)} SOL
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 13, color: "#999999" }}>
              Your Prediction:
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
              {lastResult.prediction === "RICH" ? "RUNS 🚀" : "RUGS 💀"}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#333333",
              marginBottom: 14,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              P&L:
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: isProfitable ? "#00FF00" : "#FF0000",
              }}
            >
              {isProfitable ? "+" : ""}
              {lastResult.pnl.toFixed(2)} SOL
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              New Balance:
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: "#FFFFFF",
              }}
            >
              {balance.toFixed(2)} SOL
            </Text>
          </View>
        </View>

        {/* Reason */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            backgroundColor: "#1A1A1A",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            WHAT HAPPENED
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#FFFFFF",
              lineHeight: 22,
            }}
          >
            {tradeData?.reason_short || "Loading..."}
          </Text>
        </View>

        {/* Next button */}
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <TouchableOpacity
            onPress={handleNext}
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
              {balance <= 0 ? "View Results" : "Next Trade →"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trade count */}
        {balance > 0 && (
          <View style={{ alignItems: "center", marginTop: 16 }}>
            <Text style={{ fontSize: 13, color: "#666666" }}>
              Trade {tradeCount} complete
            </Text>
          </View>
        )}

        {balance <= 0 && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              backgroundColor: "#330000",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: "#FF0000",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#FF0000",
                textAlign: "center",
              }}
            >
              ⚠️ Balance depleted! Run ended.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
