import { View, Text, Dimensions } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";

const CONSENT_KEY = "user_consent_given";

export default function Splash() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkConsentAndNavigate() {
      try {
        const consent = await SecureStore.getItemAsync(CONSENT_KEY);

        // Wait minimum 2 seconds for splash
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (consent === "true") {
          router.replace("/home");
        } else {
          router.replace("/consent");
        }
      } catch (error) {
        console.error("Error checking consent:", error);
        // Default to consent screen on error
        router.replace("/consent");
      } finally {
        setIsChecking(false);
      }
    }

    checkConsentAndNavigate();
  }, []);

  const { width, height } = Dimensions.get("window");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <StatusBar style="light" />
      <Image
        source={{
          uri: "https://ucarecdn.com/88470bea-bf66-4eee-ba07-86d48b079197/-/format/auto/",
        }}
        style={{ width: width, height: height }}
        contentFit="cover"
        transition={100}
      />
    </View>
  );
}
