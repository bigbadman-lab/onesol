import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen1({ onNext }) {
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
      {/* Background Image */}
      <Image
        source={require("../../../assets/images/onboarding-2-bg.jpg")}
        style={[StyleSheet.absoluteFill, { opacity: 0.18 }]}
        contentFit="cover"
        transition={100}
        pointerEvents="none"
      />

      {/* All Content Centered */}
      <View style={{ alignItems: "center", zIndex: 1 }}>
        {/* Top Heading */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 42,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: 50,
              marginBottom: 8,
            }}
          >
            Real charts.
          </Text>
          <Text
            style={{
              fontSize: 42,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: 50,
            }}
          >
            Real patterns.
          </Text>
        </View>

        {/* Chart Name */}
        <View style={{ width: width - 60, marginBottom: 12, alignItems: "flex-start" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#FFFFFF",
            }}
          >
            JEFF
          </Text>
        </View>

        {/* Chart Area */}
        <View
          style={{
            width: width - 60,
            height: height * 0.4,
            backgroundColor: "#0A0A0A",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#1A1A1A",
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <Image
            source={require("../../../assets/images/onboard-2.png")}
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
            Real historical price action.
          </Text>

          {/* Next Button */}
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
              Next →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

