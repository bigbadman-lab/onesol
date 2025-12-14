import { useAuth } from "@/utils/auth/useAuth";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

SplashScreen.preventAutoHideAsync();

const CONSENT_KEY = "user_consent_given";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    async function checkConsent() {
      if (!isReady || hasNavigated) return;

      try {
        const consent = await SecureStore.getItemAsync(CONSENT_KEY);

        // Wait minimum 2 seconds for branding
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Navigate based on consent
        if (consent === "true") {
          router.replace("/home");
        } else {
          router.replace("/consent");
        }

        setHasNavigated(true);

        // Hide splash after navigation
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error("Error checking consent:", error);
        router.replace("/consent");
        setHasNavigated(true);
        await SplashScreen.hideAsync();
      }
    }

    checkConsent();
  }, [isReady, hasNavigated]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000000" }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000000" },
            animation: "none",
          }}
        >
          <Stack.Screen name="index" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
