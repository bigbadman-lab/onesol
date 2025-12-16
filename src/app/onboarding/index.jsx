import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef } from "react";
import { FlatList } from "react-native";
import * as SecureStore from "expo-secure-store";
import OnboardingScreen1 from "./Screen1";
import OnboardingScreen2 from "./Screen2";
import OnboardingScreen3 from "./Screen3";

const ONBOARDING_KEY = "onboarding_completed";

const screens = [
  { id: "1", component: OnboardingScreen3 }, // "Run or Rug?" - now first
  { id: "2", component: OnboardingScreen1 }, // "Real charts. Real patterns." - now second
  { id: "3", component: OnboardingScreen2 }, // "No money. Just skill." - now third
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = async () => {
    if (currentIndex < screens.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      // Last screen - mark onboarding as complete and navigate to consent
      await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
      router.replace("/consent");
    }
  };

  const renderItem = ({ item, index }) => {
    const ScreenComponent = item.component;
    return (
      <View style={{ width: Dimensions.get("window").width, flex: 1 }}>
        <ScreenComponent onNext={handleNext} isLast={index === screens.length - 1} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
      />
    </View>
  );
}

