import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, Trophy, Share2, Home } from "lucide-react-native";
import { Image } from "expo-image";
import {
  Canvas,
  Text as SkiaText,
  RoundedRect,
  Image as SkiaImage,
  Group,
  useImage,
  makeImageSnapshot,
  Skia,
  matchFont,
} from "@shopify/react-native-skia";
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
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

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

  const handleSharePNL = async () => {
    setIsGeneratingShare(true);
    try {
      const surface = Skia.Surface.MakeOffscreen(840, 570);
      if (!surface) {
        throw new Error("Could not create surface");
      }

      const canvas = surface.getCanvas();

      // Background Image - happy (green) or sad (red) character
      const bgImageUrl =
        pnl >= 0
          ? "https://ucarecdn.com/1af81939-f5e0-4fda-9b3e-4906a8b8d99c/-/format/auto/" // Happy/Green
          : "https://ucarecdn.com/dc26ed7c-2671-48d5-8463-3db1a6664f4d/-/format/auto/"; // Sad/Red

      console.log("Loading background image:", bgImageUrl);

      // Fetch and convert to base64
      const bgResponse = await fetch(bgImageUrl);
      if (!bgResponse.ok) {
        throw new Error(`Failed to fetch background: ${bgResponse.status}`);
      }
      const bgBlob = await bgResponse.blob();
      const bgBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(bgBlob);
      });

      console.log("Background image loaded, size:", bgBase64.length);

      // Create Skia image from base64
      const bgImageData = Skia.Data.fromBase64(bgBase64);
      const bgImage = Skia.Image.MakeImageFromEncoded(bgImageData);

      if (bgImage) {
        console.log(
          "Background image decoded successfully:",
          bgImage.width(),
          bgImage.height(),
        );
        const bgPaint = Skia.Paint();
        canvas.drawImageRect(
          bgImage,
          Skia.XYWHRect(0, 0, bgImage.width(), bgImage.height()),
          Skia.XYWHRect(0, 0, 840, 570),
          bgPaint,
        );
      } else {
        console.log("Failed to decode background image");
      }

      // Logo (top left)
      console.log("Loading logo image");
      const logoResponse = await fetch(
        "https://ucarecdn.com/1ee3cabc-d70e-447a-9b1f-2fe6ac823b9f/-/format/auto/",
      );
      if (!logoResponse.ok) {
        throw new Error(`Failed to fetch logo: ${logoResponse.status}`);
      }
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(logoBlob);
      });

      const logoImageData = Skia.Data.fromBase64(logoBase64);
      const logoImage = Skia.Image.MakeImageFromEncoded(logoImageData);

      if (logoImage) {
        console.log("Logo image decoded successfully");
        const logoPaint = Skia.Paint();
        canvas.drawImageRect(
          logoImage,
          Skia.XYWHRect(0, 0, logoImage.width(), logoImage.height()),
          Skia.XYWHRect(40, 40, 150, 50),
          logoPaint,
        );
      } else {
        console.log("Failed to decode logo image");
      }

      // Title
      const titlePaint = Skia.Paint();
      titlePaint.setColor(Skia.Color("#FFFFFF"));
      const titleFont = matchFont({
        fontFamily: "Arial",
        fontSize: 48,
        fontWeight: "bold",
      });
      canvas.drawText("Game Over", 40, 150, titlePaint, titleFont);

      // Nickname/UUID
      const namePaint = Skia.Paint();
      namePaint.setColor(Skia.Color("#999999"));
      const nameFont = matchFont({ fontFamily: "Arial", fontSize: 24 });
      const displayName =
        userProfile?.nickname || deviceId?.slice(0, 8) || "Player";
      canvas.drawText(displayName, 40, 190, namePaint, nameFont);

      // Trading Summary
      const labelPaint = Skia.Paint();
      labelPaint.setColor(Skia.Color("#999999"));
      const labelFont = matchFont({ fontFamily: "Arial", fontSize: 20 });

      const valuePaint = Skia.Paint();
      valuePaint.setColor(Skia.Color("#FFFFFF"));
      const valueFont = matchFont({
        fontFamily: "Arial",
        fontSize: 20,
        fontWeight: "bold",
      });

      let yPos = 260;

      // Starting Balance
      canvas.drawText("Starting Balance:", 40, yPos, labelPaint, labelFont);
      canvas.drawText(
        `${STARTING_BALANCE.toFixed(2)} SOL`,
        600,
        yPos,
        valuePaint,
        valueFont,
      );
      yPos += 40;

      // Final Balance
      canvas.drawText("Final Balance:", 40, yPos, labelPaint, labelFont);
      canvas.drawText(
        `${balance.toFixed(2)} SOL`,
        600,
        yPos,
        valuePaint,
        valueFont,
      );
      yPos += 60;

      // Total P&L (larger)
      const pnlLabelFont = matchFont({
        fontFamily: "Arial",
        fontSize: 28,
        fontWeight: "bold",
      });
      canvas.drawText("Total P&L:", 40, yPos, valuePaint, pnlLabelFont);

      const pnlPaint = Skia.Paint();
      pnlPaint.setColor(Skia.Color(pnl >= 0 ? "#00FF00" : "#FF0000"));
      const pnlFont = matchFont({
        fontFamily: "Arial",
        fontSize: 36,
        fontWeight: "bold",
      });
      canvas.drawText(
        `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} SOL`,
        600,
        yPos,
        pnlPaint,
        pnlFont,
      );

      // Add return percentage below P&L
      const pctFont = matchFont({
        fontFamily: "Arial",
        fontSize: 28,
        fontWeight: "bold",
      });
      canvas.drawText(
        `${returnPct >= 0 ? "+" : ""}${returnPct}%`,
        600,
        yPos + 35,
        pnlPaint,
        pctFont,
      );
      yPos += 60;

      // Stats
      canvas.drawText(
        `${tradeCount} trades • ${accuracy}% accuracy`,
        40,
        yPos,
        labelPaint,
        labelFont,
      );

      const image = surface.makeImageSnapshot();
      const data = image.encodeToBase64();

      await Share.share({
        message: `I just finished an endless run! P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} SOL`,
        url: `data:image/png;base64,${data}`,
      });
    } catch (error) {
      console.error("Error generating share image:", error);
    } finally {
      setIsGeneratingShare(false);
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

        {/* Secondary Actions - Icon Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 20,
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
              Leaderboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSharePNL}
            disabled={isGeneratingShare}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              opacity: isGeneratingShare ? 0.6 : 1,
            }}
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              {isGeneratingShare ? "..." : "Share PNL"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
