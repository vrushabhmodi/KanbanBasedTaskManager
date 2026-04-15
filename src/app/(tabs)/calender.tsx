import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import { formatDateKey } from "../date-utils";
import { useTaskActions, useTasks } from "../task-context";

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

type Task = {
  id: string;
  title: string;
  details?: string;
  dueDate: string;
  completed: boolean;
};

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
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const today = useMemo(() => new Date(), []);
  const { tasks } = useTasks();
  const { toggleTaskCompleted, updateTask, deleteTask, setTaskDueDate } = useTaskActions();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => today);

  const selectedDateKey = formatDateKey(selectedDate);
  const tasksForSelectedDate = useMemo(() => {
    return [...tasks]
      .filter((task) => task.dueDate === selectedDateKey)
      .sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [tasks, selectedDateKey]);

  const pendingTaskCounts = useMemo(() => {
    return tasks.reduce<Record<string, number>>((counts, task) => {
      if (!task.completed) {
        counts[task.dueDate] = (counts[task.dueDate] ?? 0) + 1;
      }
      return counts;
    }, {});
  }, [tasks]);

  const selectedDateLabel = `${selectedDate.toLocaleString("default", { weekday: "short" })}, ${selectedDate.toLocaleString("default", { month: "short" })} ${selectedDate.getDate()}`;

  const gridDates = useMemo(() => getGridDates(currentMonth), [currentMonth]);

  const monthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const changeMonth = (offset: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return next;
    });
  };


  const pushToTomorrow = (taskId: string) => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDueDate(taskId, formatDateKey(tomorrow));
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
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
      <PanGestureHandler onHandlerStateChange={handleSwipe} activeOffsetX={[-10, 10]} failOffsetY={[-10, 10]}>
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
          const isSelected =
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate();
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <Pressable
              key={date.toISOString()}
              style={[
                styles.dateCell,
                !isCurrentMonth && styles.dateCellFaded,
                isSelected && styles.selectedCell,
                isToday && styles.todayCell,
              ]}
              onPress={() => handleSelectDate(date)}
            >
              <Text
                style={[
                  styles.dateText,
                  isCurrentMonth ? null : styles.dateTextFaded,
                  isSelected ? styles.selectedText : isToday ? styles.todayText : null,
                ]}
              >
                {date.getDate()}
              </Text>
              {pendingTaskCounts[formatDateKey(date)] > 0 ? (
                <Text style={styles.pendingCount}>{pendingTaskCounts[formatDateKey(date)]}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Tasks for {selectedDateLabel}</Text>
      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        keyboardShouldPersistTaps="handled"
      >
        {tasksForSelectedDate.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks due on this date.</Text>
          </View>
        ) : (
          tasksForSelectedDate.map((task) => (
            <Pressable
              key={task.id}
              style={[styles.smallTaskCard, task.completed && styles.smallTaskCardCompleted]}
              onPress={() => router.push(`/task/${task.id}`)}
            >
              <Pressable
                style={[styles.smallTaskActionButton, task.completed ? styles.undoneButton : styles.doneButton]}
                onPress={() => toggleTaskCompleted(task.id)}
              >
                <MaterialCommunityIcons
                  name={task.completed ? "undo" : "check"}
                  size={16}
                  color={task.completed ? "#0F172A" : "#FFFFFF"}
                />
              </Pressable>
              <Text style={[styles.smallTaskTitle, task.completed && styles.smallTaskTitleCompleted]} numberOfLines={1}>
                {task.title}
              </Text>
              <Pressable
                style={styles.smallTaskActionButton}
                onPress={() => pushToTomorrow(task.id)}
              >
                <MaterialCommunityIcons name="calendar" size={16} color="#F8FAFC" />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "flex-start",
    alignItems: "flex-start",
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
  pendingCount: {
    color: "#A5B4FC",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  todayText: {
    color: "#F59E0B",
  },
  selectedCell: {
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  selectedText: {
    color: "#EFF6FF",
  },
  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 4,
  },
  taskList: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    marginTop: 0,
  },
  taskListContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  smallTaskCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallTaskCardCompleted: {
    backgroundColor: "#0B1220",
    borderColor: "#334155",
    opacity: 0.9,
  },
  smallTaskActionButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  smallTaskTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginHorizontal: 8,
  },
  smallTaskTitleCompleted: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  emptyState: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    alignItems: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  tomorrowButton: {
    backgroundColor: "#2563EB",
  },
  doneButton: {
    backgroundColor: "#10B981",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  undoneButton: {
    backgroundColor: "#E2E8F0",
  },
  gestureRoot: {
    flex: 1,
  },
});
