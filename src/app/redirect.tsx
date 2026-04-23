import { View, Text, ActivityIndicator } from "react-native";

export default function RedirectPage() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
      <ActivityIndicator size="large" color="#F59E0B" />
      <Text style={{ color: "#F8FAFC", marginTop: 16, fontSize: 16 }}>Completing sign-in...</Text>
    </View>
  );
}
