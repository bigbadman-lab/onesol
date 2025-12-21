import { useAuth } from "@/utils/auth/useAuth";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { rescheduleDailyNotificationIfEnabled } from "../notifications/testNotifications";
import * as Notifications from "expo-notifications";

SplashScreen.preventAutoHideAsync();

const CONSENT_KEY = "user_consent_given";
const ONBOARDING_KEY = "onboarding_completed";
const DAILY_NOTIFICATIONS_KEY = "daily_notifications_enabled";

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

      // Wait for router to be ready before attempting navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Add a timeout fallback - proceed after 1 second even if isReady is false
      const timeoutId = setTimeout(async () => {
        if (!hasNavigated) {
          console.warn("Proceeding with navigation despite isReady state");
          await performNavigation();
        }
      }, 1500);

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
            // Small delay to ensure router is mounted
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (consent === "true") {
              router.replace("/home");
            } else if (onboarding === "true") {
              router.replace("/consent");
            } else {
              router.replace("/onboarding");
            }
          } catch (navError) {
            console.error("Navigation error:", navError);
            // Wait a bit and retry fallback navigation
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
              router.replace("/onboarding");
            } catch (retryError) {
              console.error("Retry navigation also failed:", retryError);
            }
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
            // Wait a bit before retry navigation
            await new Promise(resolve => setTimeout(resolve, 200));
            router.replace("/onboarding");
          } catch (navError) {
            console.error("Failed to navigate on error:", navError);
            // App should still render the default route
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

  // Reschedule daily notifications on app startup if enabled
  useEffect(() => {
    async function checkAndRescheduleNotifications() {
      // Only check after navigation is complete
      if (!hasNavigated) return;

      try {
        // Check if daily notifications are enabled in settings
        const dailyNotificationsEnabled = await SecureStore.getItemAsync(DAILY_NOTIFICATIONS_KEY);
        
        if (dailyNotificationsEnabled === "true") {
          // User has enabled daily notifications, reschedule if needed
          console.log("Daily notifications enabled, checking if reschedule needed...");
          await rescheduleDailyNotificationIfEnabled();
        }
      } catch (error) {
        console.error("Error checking daily notifications on startup:", error);
        // Don't block app - this is a background task
      }
    }

    // Wait a bit after navigation to avoid blocking startup
    const timeoutId = setTimeout(() => {
      checkAndRescheduleNotifications();
    }, 3000); // 3 seconds after navigation

    return () => clearTimeout(timeoutId);
  }, [hasNavigated]);

  // Handle notification taps - navigate to home when user taps daily reminder
  useEffect(() => {
    // Handle notification taps while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      
      // Check if this is our daily reminder notification
      if (data?.kind === 'daily_reminder') {
        console.log('Daily reminder notification tapped, navigating to home...');
        // Navigate to home screen
        router.push('/home');
      }
    });

    // Handle notification that opened the app (when app was closed)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        if (data?.kind === 'daily_reminder') {
          console.log('App opened from daily reminder notification, navigating to home...');
          // Wait for navigation to complete before navigating to home
          setTimeout(() => {
            router.push('/home');
          }, 1000);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

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
