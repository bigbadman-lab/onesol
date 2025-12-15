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
        // Check consent immediately (no delay) to prevent flash
        const consentPromise = SecureStore.getItemAsync(CONSENT_KEY);
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve(null), 5000)
        );
        
        const consent = await Promise.race([consentPromise, timeoutPromise]);

        // Navigate immediately based on consent (before hiding splash)
        // This prevents any flash of the wrong screen
        try {
          if (consent === "true") {
            router.replace("/home");
          } else {
            router.replace("/consent");
          }
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback navigation
          router.replace("/consent");
        }

        setHasNavigated(true);

        // Wait minimum 2 seconds for branding (after navigation)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Hide splash after navigation and branding delay
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.error("Error hiding splash:", splashError);
        }
      } catch (error) {
        console.error("Error checking consent:", error);
        // Always try to navigate and hide splash, even on error
        try {
          router.replace("/consent");
        } catch (navError) {
          console.error("Failed to navigate on error:", navError);
        }
        setHasNavigated(true);
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.error("Error hiding splash on error:", splashError);
        }
      }
    }

    checkConsent();
  }, [isReady, hasNavigated, router]);

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
