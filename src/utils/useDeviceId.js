import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "device_uuid";
const FRIENDLY_NAME_KEY = "device_friendly_name";
const CONSENT_KEY = "user_consent_given";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateFriendlyName() {
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
      try {
        // First check if user has given consent
        const consent = await SecureStore.getItemAsync(CONSENT_KEY);

        if (consent !== "true") {
          // No consent given, don't generate or load ID
          setDeviceId(null);
          setFriendlyName(null);
          setLoading(false);
          return;
        }

        // Consent given, proceed with loading or creating ID
        let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        let name = await SecureStore.getItemAsync(FRIENDLY_NAME_KEY);

        if (!id) {
          id = generateUUID();
          await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
        }

        // Generate friendly name if it doesn't exist
        if (!name) {
          name = generateFriendlyName();
          await SecureStore.setItemAsync(FRIENDLY_NAME_KEY, name);
        }

        setDeviceId(id);
        setFriendlyName(name);
      } catch (error) {
        console.error("Error loading device ID:", error);
        // Fallback to memory-only UUID if SecureStore fails (only if consent given)
        const consent = await SecureStore.getItemAsync(CONSENT_KEY);
        if (consent === "true") {
          const id = generateUUID();
          const name = generateFriendlyName();
          setDeviceId(id);
          setFriendlyName(name);
        }
      } finally {
        setLoading(false);
      }
    }

    loadOrCreateDeviceId();
  }, []);

  return { deviceId, friendlyName, loading };
}
