import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { formatDateKey } from "../date-utils";

const tabBarColors = {
  active: "#F59E0B",
  inactive: "#D1D5DB",
  background: "#0F172A",
  border: "#334155",
};

export default function TabsLayout() {
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
          height: 72,
          marginHorizontal: 0,
          marginBottom: 0,
          borderRadius: 0,
          position: "relative",
          paddingTop: 8,
          paddingBottom: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 12,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "700",
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === "today" ? "calendar-today" : "calendar-check";
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="today"
        options={{ title: "Today" }}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate("today", { date: formatDateKey(new Date()) });
          },
        })}
      />
      <Tabs.Screen name="calender" options={{ title: "Calender", tabBarShowLabel: true }} />
    </Tabs>
  );
}
