import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { useCreateTaskDate } from "../create-task-date-context";
import { formatDateKey } from "../date-utils";
import { useTaskActions, useTasks } from "../task-context";
import { useTheme } from "../theme-context";

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
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [monthDirection, setMonthDirection] = useState(1);
  const transition = useRef(new Animated.Value(1)).current;
  const today = useMemo(() => new Date(), []);
  const { tasks } = useTasks();
  const { toggleTaskCompleted, setTaskDueDate } = useTaskActions();
  const { setCalendarSelectedDate } = useCreateTaskDate();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => today);

  useEffect(() => {
    setCalendarSelectedDate(formatDateKey(selectedDate));
  }, [selectedDate, setCalendarSelectedDate]);

  const selectedDateKey = formatDateKey(selectedDate);
  const tasksForSelectedDate = useMemo(() => {
    return tasks
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

  const animatedPanelStyle = {
    opacity: transition,
    transform: [
      {
        translateX: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [monthDirection * 20, 0],
        }),
      },
    ],
  };

  const changeMonth = (offset: number) => {
    setMonthDirection(offset);
    Animated.timing(transition, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setCurrentMonth((prev) => {
        const next = new Date(prev);
        next.setMonth(prev.getMonth() + offset);
        return next;
      });
      transition.setValue(0);
      Animated.timing(transition, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.calendarPanel}>
        <PanGestureHandler onHandlerStateChange={handleSwipe} activeOffsetX={[-10, 10]} failOffsetY={[-10, 10]}>
          <View>
            <View style={styles.header}>
              <Pressable
                style={({ pressed }) => [
                  styles.navButton,
                  { backgroundColor: colors.surface },
                  pressed && { transform: [{ scale: 0.97 }], opacity: 0.88 },
                ]}
                onPress={() => changeMonth(-1)}
              >
                <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>Prev</Text>
              </Pressable>
            <Animated.Text
              style={[
                styles.title,
                { color: colors.textPrimary },
                {
                  opacity: transition,
                  transform: [
                    {
                      translateX: transition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [monthDirection * 10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {monthLabel}
            </Animated.Text>
            <Pressable
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: colors.surface },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.88 },
              ]}
              onPress={() => changeMonth(1)}
            >
              <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>Next</Text>
            </Pressable>
          </View>

          <Animated.View style={animatedPanelStyle}>
            <View style={styles.dayNamesRow}>
              {dayNames.map((day) => (
                <Text key={day} style={[styles.dayName, { color: colors.textSecondary }]}> 
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
                    style={({ pressed }) => [
                      styles.dateCell,
                      { backgroundColor: colors.surface },
                      !isCurrentMonth && { backgroundColor: colors.surfaceAlt },
                      isSelected && { backgroundColor: colors.accent, borderWidth: 1, borderColor: colors.accentInfo },
                      isToday && !isSelected && { borderWidth: 1, borderColor: colors.accentPositive },
                      pressed && { transform: [{ scale: 0.96 }], opacity: 0.92 },
                    ]}
                    onPress={() => handleSelectDate(date)}
                  >
                    <View style={styles.dateCellContent}>
                      <Text
                        style={[
                          styles.dateText,
                          { color: isCurrentMonth ? colors.textPrimary : colors.muted },
                          isSelected && { color: colors.surface },
                          !isSelected && isToday && { color: colors.accentPositive },
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {pendingTaskCounts[formatDateKey(date)] > 0 ? (
                        <Text style={[styles.pendingCount, { color: colors.accentInfo }]}>{pendingTaskCounts[formatDateKey(date)]}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </PanGestureHandler>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tasks for {selectedDateLabel}</Text>
      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        keyboardShouldPersistTaps="handled"
      >
        {tasksForSelectedDate.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }] }>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tasks due on this date.</Text>
          </View>
        ) : (
          tasksForSelectedDate.map((task) => (
            <Pressable
              key={task.id}
              style={[
                styles.smallTaskCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                task.completed && { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: 0.9 },
              ]}
              onPress={() => router.push(`/task/${task.id}`)}
            >
              <Text
                style={[
                  styles.smallTaskTitle,
                  { color: task.completed ? colors.textSecondary : colors.textPrimary },
                  task.completed && styles.smallTaskTitleCompleted,
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              <View style={styles.smallTaskActions}>
                {!task.completed && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.smallTaskActionButton,
                      { backgroundColor: colors.accentInfo },
                      pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                    ]}
                    onPress={() => pushToTomorrow(task.id)}
                  >
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.background} />
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [
                    styles.smallTaskActionButton,
                    task.completed ? [styles.undoneButton, { backgroundColor: colors.surfaceAlt }] : [styles.doneButton, { backgroundColor: colors.accentPositive }],
                    pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                  ]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    toggleTaskCompleted(task.id);
                  }}
                >
                  <MaterialCommunityIcons
                    name={task.completed ? "undo" : "check"}
                    size={16}
                    color={task.completed ? colors.textPrimary : colors.background}
                  />
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 22,
    fontWeight: "700",
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  navButtonText: {
    fontSize: 13,
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
    fontSize: 11,
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
    padding: 8,
  },
  dateCellContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pendingCount: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
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
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallTaskActionButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  smallTaskTitle: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  smallTaskTitleCompleted: {
    textDecorationLine: "line-through",
  },
  smallTaskActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyState: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
  tomorrowButton: {
    backgroundColor: "#2563EB",
  },
  doneButton: {
    backgroundColor: "#10B981",
  },
  undoneButton: {
    backgroundColor: "#E2E8F0",
  },
  calendarPanel: {
    overflow: "hidden",
  },
});
