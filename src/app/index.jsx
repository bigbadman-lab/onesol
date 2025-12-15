import { View } from "react-native";

// This component just renders a blank screen while _layout.jsx handles navigation
// This prevents the flash of home screen before consent check completes
export default function Index() {
  // Return blank screen - _layout.jsx will handle navigation based on consent
  return <View style={{ flex: 1, backgroundColor: "#000000" }} />;
}
