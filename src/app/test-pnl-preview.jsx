import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Image } from "expo-image";
import { Skia, matchFont } from "@shopify/react-native-skia";
import { STARTING_BALANCE } from "../utils/tradesData";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export default function TestPNLPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generatePreview = async (testBalance, testCorrect, testTotal) => {
    setIsGenerating(true);
    setError(null);
    try {
      const surface = Skia.Surface.MakeOffscreen(840, 570);
      if (!surface) {
        throw new Error("Could not create surface");
      }

      const canvas = surface.getCanvas();

      const pnl = testBalance - STARTING_BALANCE;
      const accuracy =
        testTotal > 0 ? Math.round((testCorrect / testTotal) * 100) : 0;

      // Solid color background based on P&L
      const bgColor = pnl >= 0 ? "#0A3D0A" : "#3D0A0A"; // Dark green or dark red
      const bgPaint = Skia.Paint();
      bgPaint.setColor(Skia.Color(bgColor));
      canvas.drawRect(Skia.XYWHRect(0, 0, 840, 570), bgPaint);

      // Title
      const titlePaint = Skia.Paint();
      titlePaint.setColor(Skia.Color("#FFFFFF"));
      const titleFont = matchFont({
        fontFamily: "Arial",
        fontSize: 48,
        fontWeight: "bold",
      });
      canvas.drawText("Game Over", 40, 80, titlePaint, titleFont);

      // Test nickname
      const namePaint = Skia.Paint();
      namePaint.setColor(Skia.Color("#999999"));
      const nameFont = matchFont({ fontFamily: "Arial", fontSize: 24 });
      canvas.drawText("Test Player", 40, 120, namePaint, nameFont);

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

      let yPos = 200;

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
        `${testBalance.toFixed(2)} SOL`,
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
      const returnPct =
        STARTING_BALANCE > 0 ? ((pnl / STARTING_BALANCE) * 100).toFixed(2) : 0;
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
      yPos += 80;

      // Stats
      canvas.drawText(
        `${testTotal} trades • ${accuracy}% accuracy`,
        40,
        yPos,
        labelPaint,
        labelFont,
      );

      // Add emoji indicator
      const emojiFont = matchFont({ fontFamily: "Arial", fontSize: 64 });
      const emoji = pnl >= 0 ? "🚀" : "💀";
      canvas.drawText(emoji, 700, 500, titlePaint, emojiFont);

      const image = surface.makeImageSnapshot();
      const data = image.encodeToBase64();

      setGeneratedImage(`data:image/png;base64,${data}`);
      console.log("Preview generated successfully!");
    } catch (error) {
      console.error("Error generating preview:", error);
      setError(error.message || "Failed to generate preview");
    } finally {
      setIsGenerating(false);
    }
  };

  const testScenarios = [
    { label: "Big Win 🚀", balance: 150, correct: 8, total: 10 },
    { label: "Small Win", balance: 110, correct: 6, total: 10 },
    { label: "Break Even", balance: 100, correct: 5, total: 10 },
    { label: "Small Loss", balance: 90, correct: 4, total: 10 },
    { label: "Big Loss 💀", balance: 50, correct: 2, total: 10 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 20 }}
        >
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          PNL Preview Generator
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#999999",
            marginBottom: 10,
          }}
        >
          Test different scenarios to see what the share cards look like
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#666666",
            marginBottom: 30,
            fontStyle: "italic",
          }}
        >
          Note: Using solid backgrounds temporarily due to RN image loading
          limitations
        </Text>

        {/* Test scenario buttons */}
        <View style={{ gap: 12, marginBottom: 30 }}>
          {testScenarios.map((scenario) => (
            <TouchableOpacity
              key={scenario.label}
              onPress={() =>
                generatePreview(
                  scenario.balance,
                  scenario.correct,
                  scenario.total,
                )
              }
              disabled={isGenerating}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.2)",
                opacity: isGenerating ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  marginBottom: 4,
                }}
              >
                {scenario.label}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#999999",
                }}
              >
                Balance: {scenario.balance} SOL • {scenario.correct}/
                {scenario.total} correct
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error message */}
        {error && !isGenerating && (
          <View
            style={{
              backgroundColor: "rgba(255, 0, 0, 0.1)",
              padding: 20,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255, 0, 0, 0.3)",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 16, color: "#FF6666", fontWeight: "700" }}>
              Error generating preview
            </Text>
            <Text style={{ fontSize: 14, color: "#FF9999", marginTop: 8 }}>
              {error}
            </Text>
          </View>
        )}

        {/* Generated preview */}
        {isGenerating && (
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              padding: 40,
              borderRadius: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: "#999999" }}>
              Generating preview...
            </Text>
          </View>
        )}

        {generatedImage && !isGenerating && (
          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#FFFFFF",
                marginBottom: 12,
              }}
            >
              Preview
            </Text>
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Image
                source={{ uri: generatedImage }}
                style={{
                  width: "100%",
                  aspectRatio: 840 / 570,
                  borderRadius: 8,
                }}
                contentFit="contain"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
