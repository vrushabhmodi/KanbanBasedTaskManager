import { View, Text, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Small delay to ensure the AuthSession logic finishes processing the URL
    const timeout = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/settings");
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
      <ActivityIndicator size="large" color="#F59E0B" />
      <Text style={{ color: "#F8FAFC", marginTop: 16, fontSize: 16 }}>Completing sign-in...</Text>
    </View>
  );
}
