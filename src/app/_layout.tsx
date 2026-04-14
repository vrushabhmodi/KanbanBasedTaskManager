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
          height: 68,
          paddingBottom: 6,
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
