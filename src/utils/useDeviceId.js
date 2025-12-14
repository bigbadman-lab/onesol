import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "device_uuid";
const CONSENT_KEY = "user_consent_given";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrCreateDeviceId() {
      try {
        // First check if user has given consent
        const consent = await SecureStore.getItemAsync(CONSENT_KEY);

        if (consent !== "true") {
          // No consent given, don't generate or load ID
          setDeviceId(null);
          setLoading(false);
          return;
        }

        // Consent given, proceed with loading or creating ID
        let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);

        if (!id) {
          id = generateUUID();
          await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
        }

        setDeviceId(id);
      } catch (error) {
        console.error("Error loading device ID:", error);
        // Fallback to memory-only UUID if SecureStore fails (only if consent given)
        const consent = await SecureStore.getItemAsync(CONSENT_KEY);
        if (consent === "true") {
          setDeviceId(generateUUID());
        }
      } finally {
        setLoading(false);
      }
    }

    loadOrCreateDeviceId();
  }, []);

  return { deviceId, loading };
}
