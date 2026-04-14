import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getWeekDays(referenceDate: Date) {
  const weekStart = new Date(referenceDate);
  weekStart.setDate(referenceDate.getDate() - referenceDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

export default function Today() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const weekDays = useMemo(() => getWeekDays(today), [today]);

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
    marginBottom: 6,
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
