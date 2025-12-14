import { useState, useEffect } from "react";

// Simple network detection without external library
export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Simple check - assume online unless proven otherwise
    // The actual offline detection will happen when fetch calls fail
    setIsOnline(true);
  }, []);

  return {
    isOnline,
  };
}

// Helper function to check network before making requests
export async function checkNetworkConnection() {
  try {
    // Make a simple HEAD request to a lightweight endpoint to check connectivity
    // Using a small timeout to fail fast
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Use a simple endpoint that's more likely to exist for network checks
    // Or just check if we can reach the base URL
    const baseURL = process.env.EXPO_PUBLIC_BASE_URL || 'https://app.1sol.fun';
    const response = await fetch(`${baseURL}/api/health`, {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() => {
      // If health endpoint doesn't exist, try the base URL
      return fetch(baseURL, {
        method: "HEAD",
        signal: controller.signal,
      });
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    // If fetch fails, we're likely offline
    if (
      error.name === "AbortError" ||
      error.message === "Network request failed" ||
      error.message.includes("Failed to fetch")
    ) {
      return false;
    }
    // Other errors might not be network-related - assume online
    return true;
  }
}
