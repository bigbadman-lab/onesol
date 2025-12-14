import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

export default function TestResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Use params to determine if showing correct or wrong
  const isCorrect = params.type === "correct";

  // Mock data for testing
  const mockResult = {
    outcome: "RICH",
    returnPct: 245,
    betAmount: 1.0,
    prediction: "RICH",
    pnl: isCorrect ? 2.45 : -1.0,
    isCorrect: isCorrect,
  };

  const mockTrade = {
    name: "Test Token",
    ticker: "TEST",
    chart_final_image:
      "https://raw.createusercontent.com/47d3cfbc-890d-476a-bef3-850543f21c73/",
    reason_short:
      "This is a test preview to see how the result screen looks with the background image.",
  };

  const isProfitable = mockResult.pnl > 0;
  const outcomeColor = mockResult.outcome === "RICH" ? "#00FF00" : "#FF0000";

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      {/* Conditional Background Image */}
      <Image
        source={{
          uri: isCorrect
            ? "https://raw.createusercontent.com/47d3cfbc-890d-476a-bef3-850543f21c73/"
            : "https://raw.createusercontent.com/2c4590d6-7159-4cd5-a2f2-ad4ef9bac4c2/",
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
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              TEST PREVIEW
            </Text>
          </View>
          <View style={{ width: 28 }} />
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
          <Image
            source={{ uri: mockTrade.chart_final_image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={100}
          />
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
              {mockResult.outcome === "RICH" ? "RUNS 🚀" : "RUGS 💀"}
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
              {mockResult.returnPct > 0 ? "+" : ""}
              {mockResult.returnPct}%
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
              {mockResult.betAmount.toFixed(2)} SOL
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
              {mockResult.prediction === "RICH" ? "RUNS 🚀" : "RUGS 💀"}
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
              {mockResult.pnl.toFixed(2)} SOL
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
              {(10 + mockResult.pnl).toFixed(2)} SOL
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
            {mockTrade.reason_short}
          </Text>
        </View>

        {/* Toggle buttons */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 24,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/test-result?type=correct")}
            style={{
              flex: 1,
              backgroundColor: isCorrect ? "#00FF00" : "#2A2A2A",
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: isCorrect ? "#00FF00" : "#444444",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: isCorrect ? "#000000" : "#FFFFFF",
                textAlign: "center",
              }}
            >
              ✅ CORRECT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/test-result?type=wrong")}
            style={{
              flex: 1,
              backgroundColor: !isCorrect ? "#FF0000" : "#2A2A2A",
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: !isCorrect ? "#FF0000" : "#444444",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: !isCorrect ? "#000000" : "#FFFFFF",
                textAlign: "center",
              }}
            >
              ❌ WRONG
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
