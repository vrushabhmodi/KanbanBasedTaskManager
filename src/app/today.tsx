import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDays(referenceDate: Date) {
  const weekStart = new Date(referenceDate);
  weekStart.setDate(referenceDate.getDate() - weekStart.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

function parseSelectedDate(dateParam: string | string[] | undefined) {
  if (!dateParam) return null;
  const dateString = Array.isArray(dateParam) ? dateParam[0] : dateParam;
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function Today() {
  const searchParams = useLocalSearchParams();
  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => parseSelectedDate(searchParams.date) ?? today, [searchParams.date, today]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  useEffect(() => {
    const routedDate = parseSelectedDate(searchParams.date);
    if (routedDate && routedDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(routedDate);
    }
  }, [searchParams.date, selectedDate]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Today</Text>

      <View style={styles.weekContainer}>
        {weekDays.map((date) => {
          const isSelected =
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate();

          return (
            <Pressable
              key={date.toISOString()}
              style={[styles.dayCard, isSelected && styles.dayCardSelected]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {dayNames[date.getDay()]}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1120",
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  heading: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 18,
  },
  weekContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dayCard: {
    flex: 1,
    minWidth: 0,
    height: 110,
    borderRadius: 20,
    backgroundColor: "#111827",
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  dayCardSelected: {
    backgroundColor: "#F59E0B",
    borderColor: "#D97706",
  },
  dayName: {
    color: "#E2E8F0",
    fontSize: 14,
    marginBottom: 12,
  },
  dayNameSelected: {
    color: "#0F172A",
  },
  dayNumber: {
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "700",
  },
  dayNumberSelected: {
    color: "#0F172A",
  },
});
