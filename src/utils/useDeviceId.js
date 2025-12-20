import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

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

export default function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);
  const [friendlyName, setFriendlyName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrCreateDeviceId() {
      let hasConsent = false;
      
      try {
        // First check if user has given consent
        const consent = await SecureStore.getItemAsync(CONSENT_KEY);
        hasConsent = consent === "true";

        if (!hasConsent) {
          // No consent given, don't generate or load ID
          setDeviceId(null);
          setFriendlyName(null);
          setLoading(false);
          return;
        }

        // Consent given, proceed with loading or creating ID
        let id = null;
        let name = null;
        
        try {
          id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
          name = await SecureStore.getItemAsync(FRIENDLY_NAME_KEY);
        } catch (readError) {
          console.warn("Error reading from SecureStore, will generate new values:", readError);
          // Continue to generation logic below
        }

        // Generate UUID if it doesn't exist
        if (!id) {
          id = generateUUID();
          try {
            await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
          } catch (writeError) {
            console.warn("Error writing UUID to SecureStore, using in-memory value:", writeError);
            // Continue with in-memory value
          }
        }

        // Generate friendly name if it doesn't exist
        if (!name) {
          name = generateFriendlyName();
          try {
            await SecureStore.setItemAsync(FRIENDLY_NAME_KEY, name);
          } catch (writeError) {
            console.warn("Error writing friendly name to SecureStore, using in-memory value:", writeError);
            // Continue with in-memory value
          }
        }

        // Safeguard: Ensure we always have values if consent exists
        if (hasConsent) {
          setDeviceId(id || generateUUID());
          setFriendlyName(name || generateFriendlyName());
        }
      } catch (error) {
        console.error("Error loading device ID:", error);
        // Final safeguard: If consent exists, always generate values (even if all SecureStore operations failed)
        if (hasConsent) {
          const id = generateUUID();
          const name = generateFriendlyName();
          setDeviceId(id);
          setFriendlyName(name);
        } else {
          // Double-check consent in case first check failed
          try {
            const consent = await SecureStore.getItemAsync(CONSENT_KEY);
            if (consent === "true") {
              const id = generateUUID();
              const name = generateFriendlyName();
              setDeviceId(id);
              setFriendlyName(name);
            }
          } catch (finalError) {
            console.error("Final error checking consent:", finalError);
            // If we can't even check consent, set to null
            setDeviceId(null);
            setFriendlyName(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadOrCreateDeviceId();
  }, []);

  return { deviceId, friendlyName, loading };
}
