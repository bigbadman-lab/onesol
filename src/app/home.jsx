import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, Trophy, X, WifiOff } from "lucide-react-native";
import { useFonts, Horizon_400Regular } from "@expo-google-fonts/horizon";
import { Image } from "expo-image";
import useGameStore from "../utils/gameStore";
import { useState, useEffect } from "react";
import useDeviceId from "../utils/useDeviceId";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loaded, error] = useFonts({
    Horizon_400Regular,
  });
  const { deviceId } = useDeviceId();

  const [showModal, setShowModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [isFindingTrades, setIsFindingTrades] = useState(false);

  const startEndlessMode = useGameStore((state) => state.startEndlessMode);
  const resetEndlessMode = useGameStore((state) => state.resetEndlessMode);

  if (!loaded && !error) {
    return null;
  }

  const handleStartEndless = async () => {
    if (isFindingTrades) return; // Prevent multiple clicks
    
    console.log("User clicked Start Game");
    setIsFindingTrades(true);
    
    try {
      await startEndlessMode();
      console.log("Navigating to /endless/trade");
      router.push("/endless/trade");
    } catch (error) {
      console.error("Error starting endless mode:", error);

      if (error.message === "OFFLINE") {
        setShowOfflineModal(true);
      } else if (error.message === "ALL_TRADES_USED_TODAY") {
        alert("You have seen all available trades for today, they will reset at midnight");
      } else if (error.message.includes("No trades are currently available")) {
        alert("No trades are currently available. Please try again later.");
      } else {
        alert("Failed to start game. Please try again.");
      }
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
          uri: "https://ucarecdn.com/dc26ed7c-2671-48d5-8463-3db1a6664f4d/-/format/auto/",
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
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={true}
        nestedScrollEnabled={true}
      >
        {/* Settings icon - top left with notification badge */}
        <View
          style={{
            position: "absolute",
            top: insets.top + 20,
            left: 20,
            zIndex: 10,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity 
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <Settings size={32} color="#FFFFFF" />
            {false && (
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
                pointerEvents="none"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Leaderboard icon - top right */}
        <TouchableOpacity
          onPress={() => router.push("/leaderboard")}
          style={{
            position: "absolute",
            top: insets.top + 20,
            right: 20,
            zIndex: 10,
          }}
          activeOpacity={0.7}
        >
          <Trophy size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Hero Image at the top */}
        <View style={{ alignItems: "center", marginTop: 60, marginBottom: 20, paddingHorizontal: 20 }}>
          <Image
            source={require("../../assets/images/onesolmain.png")}
            style={{ width: 180, height: 120 }}
            contentFit="contain"
            transition={100}
          />
        </View>

        {/* Tagline */}
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: 56,
            }}
          >
            One decision.
          </Text>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: 56,
            }}
          >
            One outcome.
          </Text>
        </View>

        {/* Primary CTA */}
        <View style={{ paddingHorizontal: 30, marginTop: 60 }}>
          <TouchableOpacity
            onPress={handleStartEndless}
            disabled={isFindingTrades}
            style={{
              backgroundColor: isFindingTrades ? "#7B68EE" : "#F5F5F5",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 30,
              opacity: isFindingTrades ? 0.9 : 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            activeOpacity={0.8}
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
              {isFindingTrades ? "Finding Trades..." : "Start Game →"}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 16,
              color: "#CCCCCC",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Test your chart reading skills.
          </Text>
          <Text style={{ fontSize: 16, color: "#CCCCCC", textAlign: "center" }}>
            Compete for the top spot.
          </Text>
        </View>

        {/* How it works */}
        <TouchableOpacity
          style={{
            marginTop: 80,
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 24,
          }}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 18,
              color: "#CCCCCC",
              fontWeight: "600",
            }}
          >
            How it works
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* How it works Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "transparent",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 30,
              paddingBottom: insets.bottom + 30,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderRightWidth: 2,
              borderColor: "#333333",
            }}
          >
            {/* Close button */}
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 10,
              }}
            >
              <X size={32} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Content */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#FFFFFF",
                marginBottom: 20,
                paddingRight: 40,
              }}
            >
              How It Works
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#FFFFFF",
                lineHeight: 26,
              }}
            >
              This is an educational chart-reading game using{" "}
              <Text style={{ fontWeight: "700" }}>historical market data</Text>.
              You'll see a partial price chart and decide whether it{" "}
              <Text style={{ fontWeight: "700" }}>RUNS or RUGS next</Text>.
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#FFFFFF",
                lineHeight: 26,
                marginTop: 20,
              }}
            >
              All gameplay and outcomes are{" "}
              <Text style={{ fontWeight: "700" }}>fully simulated</Text> — no
              real trades or money are involved.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Offline Modal */}
      <Modal
        visible={showOfflineModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOfflineModal(false)}
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
              borderColor: "#FF6B6B",
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#331111",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WifiOff size={40} color="#FF6B6B" />
              </View>
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#FFFFFF",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              No Internet Connection
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
              You need an internet connection to play. Please check your
              connection and try again.
            </Text>

            <TouchableOpacity
              onPress={() => setShowOfflineModal(false)}
              style={{
                backgroundColor: "#7B68EE",
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
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
