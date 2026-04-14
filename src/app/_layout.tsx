import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const tabBarColors = {
  active: "#F59E0B",
  inactive: "#D1D5DB",
  background: "#0F172A",
  border: "#334155",
};

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tabBarColors.active,
        tabBarInactiveTintColor: tabBarColors.inactive,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: tabBarColors.background,
          borderTopColor: tabBarColors.border,
          height: 70,
          marginHorizontal: 14,
          marginBottom: 10,
          borderRadius: 20,
          position: "absolute",
          left: 0,
          right: 0,
          paddingBottom: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === "today" ? "calendar-today" : "calendar-check";
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="today" options={{ title: "Today" }} />
      <Tabs.Screen name="calender" options={{ title: "Calendar" }} />
    </Tabs>
  );
}
