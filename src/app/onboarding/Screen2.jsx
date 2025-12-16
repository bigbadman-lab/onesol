import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen2({ onNext }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 30,
        justifyContent: "center",
      }}
    >
      {/* All Content Centered */}
      <View style={{ alignItems: "center" }}>
        {/* Top Slogan */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 42,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            No money.
          </Text>
          <Text
            style={{
              fontSize: 42,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            Just skill.
          </Text>
        </View>

        {/* Phone Frame with Game Over Screen - Sleeker Design */}
        <View
          style={{
            width: width * 0.5,
            aspectRatio: 9 / 19.5,
            backgroundColor: "#1A1A1A",
            borderRadius: 28,
            borderWidth: 4,
            borderColor: "#CCCCCC",
            padding: 8,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {/* Game Over Screen Image */}
          <Image
            source={require("../../../assets/images/onboarding-game-over.png")}
            style={{
              width: "100%",
              height: "100%",
            }}
            contentFit="cover"
          />
        </View>

        {/* Bottom Section */}
        <View style={{ width: "100%", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 18,
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 24,
            }}
          >
            Compete for accuracy.{"\n"}Leaderboard resets daily.
          </Text>

          {/* Let's Play Button */}
          <TouchableOpacity
            onPress={onNext}
            style={{
              backgroundColor: "#FFFFFF",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              width: "100%",
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#000000",
              }}
            >
              Let's Play →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

