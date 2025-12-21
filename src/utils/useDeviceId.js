import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";

export const DEVICE_ID_KEY = "device_uuid";
export const FRIENDLY_NAME_KEY = "device_friendly_name";
export const CONSENT_KEY = "user_consent_given";

export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateFriendlyName() {
  const adjectives = [
    "Swift", "Brave", "Clever", "Bold", "Nimble", "Sharp", "Bright", "Quick",
    "Wise", "Fierce", "Calm", "Bold", "Swift", "Lucky", "Mighty", "Royal",
    "Golden", "Silver", "Crimson", "Azure", "Emerald", "Amber", "Violet", "Cobalt"
  ];
  
  const animals = [
    "Tiger", "Eagle", "Fox", "Wolf", "Lion", "Bear", "Hawk", "Falcon",
    "Panther", "Jaguar", "Raven", "Phoenix", "Dragon", "Griffin", "Shark", "Orca",
    "Leopard", "Cheetah", "Lynx", "Cobra", "Viper", "Stallion", "Stag", "Ram"
  ];
  
  const numbers = Math.floor(Math.random() * 999) + 1;
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  
  return `${adjective}${animal}${numbers}`;
}

/**
 * Global Zustand store for device ID and friendly name
 * All components share the same state, preventing multiple SecureStore reads
 */
export const useDeviceIdStore = create((set, get) => ({
  deviceId: null,
  friendlyName: null,
  loading: false,
  initialized: false,

  // Initialize and load values from SecureStore (only called once)
  initialize: async () => {
    const state = get();
    
    // Prevent multiple initializations
    if (state.initialized || state.loading) {
      return;
    }

    set({ loading: true });

    try {
      // Check consent first
      const consent = await SecureStore.getItemAsync(CONSENT_KEY);
      const hasConsent = consent === "true";

      if (!hasConsent) {
        set({ deviceId: null, friendlyName: null, loading: false, initialized: true });
        return;
      }

      // Try to load existing values from SecureStore
      let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY).catch(() => null);
      let friendlyName = await SecureStore.getItemAsync(FRIENDLY_NAME_KEY).catch(() => null);

      // Generate new values if they don't exist
      if (!deviceId) {
        deviceId = generateUUID();
        try {
          await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
        } catch (error) {
          console.warn("Failed to save device ID to SecureStore:", error);
        }
      }

      if (!friendlyName) {
        friendlyName = generateFriendlyName();
        try {
          await SecureStore.setItemAsync(FRIENDLY_NAME_KEY, friendlyName);
        } catch (error) {
          console.warn("Failed to save friendly name to SecureStore:", error);
        }
      }

      set({ 
        deviceId, 
        friendlyName, 
        loading: false, 
        initialized: true 
      });

      console.log("useDeviceId: Initialized - ID:", deviceId.substring(0, 8) + "...", "Name:", friendlyName);
    } catch (error) {
      console.error("useDeviceId: Error initializing:", error);
      // On error, generate fallback values
      const fallbackId = generateUUID();
      const fallbackName = generateFriendlyName();
      set({ 
        deviceId: fallbackId, 
        friendlyName: fallbackName, 
        loading: false, 
        initialized: true 
      });
    }
  },

  // Set values directly (used by consent handler)
  setDeviceId: (id) => set({ deviceId: id }),
  setFriendlyName: (name) => set({ friendlyName: name }),
}));

/**
 * React hook to access device ID and friendly name
 * Automatically initializes the store on first use
 */
export default function useDeviceId() {
  const { deviceId, friendlyName, loading, initialize, initialized } = useDeviceIdStore();

  // Initialize on first mount if not already initialized
  useEffect(() => {
    // Initialize if not already initialized
    if (!initialized) {
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]); // Only depend on initialized to avoid re-running

  return { deviceId, friendlyName, loading };
}
