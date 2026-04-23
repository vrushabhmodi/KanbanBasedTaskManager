import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import TaskReschedulePicker from "../../components/TaskReschedulePicker";
import { formatDateKey, parseDateKey, parseSelectedDate } from "../date-utils";
import { useSelectionMode } from "../selection-mode-context";
import { useTaskActions, useTasks } from "../task-context";
import { useTheme } from "../theme-context";

function AnimatedTaskCard({ style, children, completed }: { style?: any; children: React.ReactNode; completed: boolean }) {
  const animation = useRef(new Animated.Value(0)).current;
  const completedAnimation = useRef(new Animated.Value(completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [animation]);

  useEffect(() => {
    Animated.timing(completedAnimation, {
      toValue: completed ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [completed, completedAnimation]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
            {
              scale: completedAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.98],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function Today() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { toggleTaskCompleted, setTaskDueDate, deleteTask } = useTaskActions();
  const searchParams = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseSelectedDate(searchParams.date) ?? new Date());
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(selectedDate);
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkRescheduleOpen, setIsBulkRescheduleOpen] = useState(false);
  const [bulkRescheduleDate, setBulkRescheduleDate] = useState(selectedDate);
  const { isSelectionMode, setIsSelectionMode } = useSelectionMode();

  useEffect(() => {
    const routedDate = parseSelectedDate(searchParams.date);
    if (routedDate) {
      setSelectedDate(routedDate);
    }
  }, [searchParams.date]);

  // Clear selection when date changes
  useEffect(() => {
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  }, [formatDateKey(selectedDate), setIsSelectionMode]);

  // Auto-exit selection mode when no tasks are selected
  useEffect(() => {
    if (selectedTaskIds.size === 0 && isSelectionMode) {
      setIsSelectionMode(false);
    }
  }, [selectedTaskIds.size, isSelectionMode, setIsSelectionMode]);

  const { colors } = useTheme();
  const selectedDateKey = formatDateKey(selectedDate);

  const selectedTaskToReschedule = rescheduleTaskId
    ? tasks.find((task) => task.id === rescheduleTaskId) ?? null
    : null;

  const openReschedule = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    setRescheduleTaskId(taskId);
    setRescheduleDate(parseDateKey(task.dueDate) ?? new Date());
    setIsRescheduleOpen(true);
  };

  const closeReschedule = () => {
    setIsRescheduleOpen(false);
    setRescheduleTaskId(null);
  };

  const handleRescheduleConfirm = () => {
    if (!rescheduleTaskId) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTaskDueDate(rescheduleTaskId, formatDateKey(rescheduleDate));
    closeReschedule();
  };

  // Selection handlers
  const handleTaskLongPress = useCallback((taskId: string) => {
    setIsSelectionMode(true);
    setSelectedTaskIds((prev) => new Set([...Array.from(prev), taskId]));
  }, [setIsSelectionMode]);

  const handleTaskTapInSelectionMode = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleBulkMarkDone = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    selectedTaskIds.forEach((taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task && !task.completed) {
        toggleTaskCompleted(taskId);
      }
    });
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  }, [selectedTaskIds, tasks, toggleTaskCompleted, setIsSelectionMode]);

  const handleBulkDelete = useCallback(() => {
    Alert.alert(
      "Delete tasks",
      `Are you sure you want to delete ${selectedTaskIds.size} task(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            selectedTaskIds.forEach((taskId) => {
              deleteTask(taskId);
            });
            setSelectedTaskIds(new Set());
            setIsSelectionMode(false);
          },
        },
      ]
    );
  }, [selectedTaskIds, deleteTask]);

  const handleBulkRescheduleToTomorrow = useCallback(() => {
    setIsBulkRescheduleOpen(true);
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBulkRescheduleDate(tomorrow);
  }, [selectedDate]);

  const handleBulkRescheduleConfirm = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    selectedTaskIds.forEach((taskId) => {
      setTaskDueDate(taskId, formatDateKey(bulkRescheduleDate));
    });
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
    setIsBulkRescheduleOpen(false);
  }, [selectedTaskIds, bulkRescheduleDate, setTaskDueDate, setIsSelectionMode]);

  const handleBulkRescheduleCancel = useCallback(() => {
    setIsBulkRescheduleOpen(false);
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  }, [setIsSelectionMode]);

  const handleSelectAllPending = useCallback(() => {
    // Filter directly from the master tasks list using the current date key
    // to ensure we have the most up-to-date data.
    const pendingTaskIds = tasks
      .filter((task) => task.dueDate === selectedDateKey && !task.completed)
      .map((task) => task.id);

    if (pendingTaskIds.length > 0) {
      setSelectedTaskIds(new Set(pendingTaskIds));
      setIsSelectionMode(true);
    }
  }, [tasks, selectedDateKey, setIsSelectionMode]);

  const tasksForSelectedDate = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate === selectedDateKey)
      .sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [tasks, selectedDateKey]);

  const formattedDate = useMemo(
    () => selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    [selectedDate]
  );

  const today = new Date();
  const isToday =
    selectedDate.getFullYear() === today.getFullYear() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getDate() === today.getDate();

  const handleSwipe = ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
    if (nativeEvent.state !== State.END) return;

    const { translationX, translationY } = nativeEvent;
    const isHorizontalSwipe =
      Math.abs(translationX) > Math.abs(translationY) && Math.abs(translationX) > 50;

    if (!isHorizontalSwipe) return;

    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + (translationX < 0 ? 1 : -1));
    router.push(`/today?date=${formatDateKey(nextDate)}`);
  };

  const pushToTomorrow = (taskId: string) => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDueDate(taskId, formatDateKey(tomorrow));
  };

  return (
    <PanGestureHandler onHandlerStateChange={handleSwipe} activeOffsetX={[-10, 10]} failOffsetY={[-10, 10]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Day Planner</Text>

        <View style={[
          styles.dateInfoCompact,
          styles.dateInfoBlock,
        ]}>
          <Text style={[
            styles.dateCompact,
            isToday ? [styles.todayDateText, { color: colors.accent }] : { color: colors.textSecondary },
          ]}
          >
            {formattedDate}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Tasks</Text>
          {tasksForSelectedDate.length > 0 && (
            <Pressable
              onPress={handleSelectAllPending}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surfaceAlt,
                  opacity: pressed ? 0.7 : 1
                }
              ]}
            >
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700' }}>Select All Pending</Text>
            </Pressable>
          )}
        </View>
      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        keyboardShouldPersistTaps="handled"
      >
        {tasksForSelectedDate.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }] }>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tasks for this date yet.</Text>
          </View>
        ) : (
          tasksForSelectedDate.map((task) => {
            const isSelected = selectedTaskIds.has(task.id);
            return (
              <AnimatedTaskCard
                key={task.id}
                completed={task.completed}
                style={[
                  styles.taskCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  task.completed && { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: 0.88 },
                  isSelected && { borderColor: colors.accent, borderWidth: 2 },
                ]}
              >
                <Pressable
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.92 : 1 }]}
                  onPress={() => {
                    if (isSelectionMode) {
                      handleTaskTapInSelectionMode(task.id);
                    } else {
                      router.push(`/task/${task.id}`);
                    }
                  }}
                  onLongPress={() => handleTaskLongPress(task.id)}
                  delayLongPress={300}
                >
                  <View style={styles.taskCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.taskTitleRow}>
                        {isSelectionMode && (
                          <View style={[styles.selectionCheckbox, isSelected && { backgroundColor: colors.accent }]}>
                            {isSelected && (
                              <MaterialCommunityIcons name="check" size={16} color={colors.background} />
                            )}
                          </View>
                        )}
                        <Text style={[styles.taskTitle, { color: colors.textPrimary }, task.completed && { color: colors.textSecondary }]}>
                          {task.title}
                        </Text>
                      </View>
                    </View>
                    {!isSelectionMode && (
                      <View style={styles.taskActions}>
                        {!task.completed && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionButton,
                              { backgroundColor: colors.surfaceAlt },
                              pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                            ]}
                            onPress={() => openReschedule(task.id)}
                          >
                            <MaterialCommunityIcons name="calendar" size={16} color={colors.textPrimary} />
                          </Pressable>
                        )}
                        {!task.completed && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionButton,
                              styles.tomorrowButton,
                              { backgroundColor: colors.accentInfo },
                              pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                            ]}
                            onPress={() => {
                              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                              pushToTomorrow(task.id);
                            }}
                          >
                            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.background} />
                          </Pressable>
                        )}
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionButton,
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
                    )}
                  </View>
                </Pressable>
              </AnimatedTaskCard>
            );
          })
        )}
      </ScrollView>

      {isSelectionMode && (
        <View style={[styles.bulkActionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.bulkActionContent}>
            <Text style={[styles.selectionCountText, { color: colors.textPrimary }]}>
              {selectedTaskIds.size} selected
            </Text>
            <View style={styles.bulkActionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.bulkActionButton,
                  { backgroundColor: colors.accentPositive },
                  pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                ]}
                onPress={handleBulkMarkDone}
              >
                <MaterialCommunityIcons name="check-all" size={18} color={colors.background} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.bulkActionButton,
                  { backgroundColor: colors.accentInfo },
                  pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                ]}
                onPress={handleBulkRescheduleToTomorrow}
              >
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.background} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.bulkActionButton,
                  { backgroundColor: colors.danger },
                  pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                ]}
                onPress={handleBulkDelete}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.background} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.bulkActionButton,
                  { backgroundColor: colors.surfaceAlt },
                  pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
                ]}
                onPress={handleExitSelectionMode}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <TaskReschedulePicker
        visible={isRescheduleOpen}
        selectedDate={rescheduleDate}
        currentDueDate={selectedTaskToReschedule ? parseDateKey(selectedTaskToReschedule.dueDate) ?? new Date() : new Date()}
        onSelectDate={setRescheduleDate}
        onConfirm={handleRescheduleConfirm}
        onCancel={closeReschedule}
      />

      <TaskReschedulePicker
        visible={isBulkRescheduleOpen}
        selectedDate={bulkRescheduleDate}
        currentDueDate={selectedDate}
        onSelectDate={setBulkRescheduleDate}
        onConfirm={handleBulkRescheduleConfirm}
        onCancel={handleBulkRescheduleCancel}
      />
    </View>
  </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 2,
  },
  dateInfoCompact: {
    marginBottom: 8,
  },
  dateInfoBlock: {
    paddingVertical: 10,
    paddingLeft: 0,
    paddingRight: 10,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  dateCompact: {
    fontSize: 14,
    fontWeight: "500",
  },
  todayDateText: {
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  taskList: {
    flex: 1,
    width: "100%",
  },
  taskListContent: {
    paddingBottom: 100,
  },
  emptyState: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    alignItems: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  taskCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  taskCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#64748B",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  taskTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    flexShrink: 1,
    marginBottom: 0,
  },
  taskActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  bulkActionBar: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#334155",
  },
  bulkActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectionCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  bulkActionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  bulkActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
});
