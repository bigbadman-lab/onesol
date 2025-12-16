import { useAuth } from "@/utils/auth/useAuth";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

SplashScreen.preventAutoHideAsync();

const CONSENT_KEY = "user_consent_given";
const ONBOARDING_KEY = "onboarding_completed";

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
    async function checkOnboardingAndConsent() {
      if (hasNavigated) return;

      // Add a timeout fallback - proceed after 1 second even if isReady is false
      const timeoutId = setTimeout(async () => {
        if (!hasNavigated) {
          console.warn("Proceeding with navigation despite isReady state");
          await performNavigation();
        }
      }, 1000);

      // If isReady is true, proceed immediately
      if (isReady) {
        clearTimeout(timeoutId);
        await performNavigation();
      }

      async function performNavigation() {
        if (hasNavigated) return;

        try {
          // Check onboarding and consent immediately (no delay) to prevent flash
          const onboardingPromise = SecureStore.getItemAsync(ONBOARDING_KEY);
          const consentPromise = SecureStore.getItemAsync(CONSENT_KEY);
          const timeoutPromise = new Promise((resolve) => 
            setTimeout(() => resolve(null), 5000)
          );
          
          const [onboarding, consent] = await Promise.race([
            Promise.all([onboardingPromise, consentPromise]),
            timeoutPromise.then(() => [null, null])
          ]);

          // Navigate immediately based on onboarding and consent (before hiding splash)
          // This prevents any flash of the wrong screen
          try {
            if (consent === "true") {
              router.replace("/home");
            } else if (onboarding === "true") {
              router.replace("/consent");
            } else {
              router.replace("/onboarding");
            }
          } catch (navError) {
            console.error("Navigation error:", navError);
            // Fallback navigation
            router.replace("/onboarding");
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
          console.error("Error checking onboarding/consent:", error);
          // Always try to navigate and hide splash, even on error
          try {
            router.replace("/onboarding");
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

      return () => clearTimeout(timeoutId);
    }

    checkOnboardingAndConsent();
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
