import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import { formatDateKey } from "./date-utils";

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

function getGridDates(referenceDate: Date) {
  const firstOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export default function Calender() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const today = useMemo(() => new Date(), []);

  const gridDates = useMemo(() => getGridDates(currentMonth), [currentMonth]);

  const monthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const changeMonth = (offset: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return next;
    });
  };

  const handleSelectDate = (date: Date) => {
    router.push({ pathname: "/today", params: { date: formatDateKey(date) } });
  };

  const handleSwipe = ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
    if (nativeEvent.state !== State.END) return;

    const { translationX, translationY } = nativeEvent;
    const isHorizontalSwipe = Math.abs(translationX) > Math.abs(translationY) && Math.abs(translationX) > 50;

    if (!isHorizontalSwipe) return;
    changeMonth(translationX < 0 ? 1 : -1);
  };

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <PanGestureHandler onHandlerStateChange={handleSwipe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable style={styles.navButton} onPress={() => changeMonth(-1)}>
              <Text style={styles.navButtonText}>Prev</Text>
            </Pressable>
            <Text style={styles.title}>{monthLabel}</Text>
            <Pressable style={styles.navButton} onPress={() => changeMonth(1)}>
              <Text style={styles.navButtonText}>Next</Text>
            </Pressable>
          </View>

      <View style={styles.dayNamesRow}>
        {dayNames.map((day) => (
          <Text key={day} style={styles.dayName}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.gridContainer}>
        {gridDates.map((date) => {
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <Pressable
              key={date.toISOString()}
              style={[
                styles.dateCell,
                !isCurrentMonth && styles.dateCellFaded,
                isToday && styles.todayCell,
              ]}
              onPress={() => handleSelectDate(date)}
            >
              <Text style={[styles.dateText, isCurrentMonth ? null : styles.dateTextFaded, isToday ? styles.todayText : null]}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1120",
    paddingTop: 48,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "700",
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#111827",
    borderRadius: 14,
  },
  navButtonText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "600",
  },
  dayNamesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
  },
  gridContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dateCell: {
    width: "13.5%",
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  dateCellFaded: {
    backgroundColor: "#0E1726",
  },
  dateText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
  },
  dateTextFaded: {
    color: "#475569",
  },
  todayCell: {
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  todayText: {
    color: "#F59E0B",
  },
  gestureRoot: {
    flex: 1,
  },
});
