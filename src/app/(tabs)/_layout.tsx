import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { formatDateKey } from "../date-utils";
import { useTheme } from "../theme-context";

const tabBarColors = {
  active: "#F59E0B",
  inactive: "#D1D5DB",
  background: "#0F172A",
  border: "#334155",
};

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
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
          fontSize: 13,
          fontWeight: "700",
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === "today"
              ? "calendar-today"
              : route.name === "calender"
              ? "calendar-check"
              : "cog";
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
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarShowLabel: true }} />
    </Tabs>
  );
}
