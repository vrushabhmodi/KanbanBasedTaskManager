import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import TaskReschedulePicker from "../../components/TaskReschedulePicker";
import { formatDateKey, parseDateKey, parseSelectedDate } from "../date-utils";
import { useTaskActions, useTasks } from "../task-context";
import { useTheme } from "../theme-context";

export default function Today() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { toggleTaskCompleted, setTaskDueDate } = useTaskActions();
  const searchParams = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseSelectedDate(searchParams.date) ?? new Date());
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(selectedDate);
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);

  useEffect(() => {
    const routedDate = parseSelectedDate(searchParams.date);
    if (routedDate) {
      setSelectedDate(routedDate);
    }
  }, [searchParams.date]);

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
    setTaskDueDate(rescheduleTaskId, formatDateKey(rescheduleDate));
    closeReschedule();
  };
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

  const pendingTasksCount = useMemo(
    () => tasksForSelectedDate.filter((task) => !task.completed).length,
    [tasksForSelectedDate]
  );

  const pushToTomorrow = (taskId: string) => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDueDate(taskId, formatDateKey(tomorrow));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Today</Text>

      <View style={styles.dateInfoCompact}>
        <Text style={[styles.dateCompact, { color: colors.textSecondary }]}>{formattedDate}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tasks</Text>
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
          tasksForSelectedDate.map((task) => (
            <Pressable
              key={task.id}
              style={[
                styles.taskCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                task.completed && { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: 0.88 },
              ]}
              onPress={() => router.push(`/task/${task.id}`)}
            >
              <View style={styles.taskCardHeader}>
                <Text style={[styles.taskTitle, { color: colors.textPrimary }, task.completed && { color: colors.textSecondary }]}>
                {task.title}
              </Text>
              <View style={styles.taskActions}>
                {!task.completed && (
                  <Pressable style={[styles.actionButton, { backgroundColor: colors.surfaceAlt }]} onPress={() => openReschedule(task.id)}>
                    <MaterialCommunityIcons name="calendar" size={16} color={colors.textPrimary} />
                  </Pressable>
                )}
                {!task.completed && (
                  <Pressable style={[styles.actionButton, styles.tomorrowButton, { backgroundColor: colors.accentInfo }]} onPress={() => pushToTomorrow(task.id)}>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={colors.background} />
                  </Pressable>
                )}
                <Pressable
                  style={[
                    styles.actionButton,
                    task.completed ? [styles.undoneButton, { backgroundColor: colors.surfaceAlt }] : [styles.doneButton, { backgroundColor: colors.accentPositive }],
                  ]}
                  onPress={() => toggleTaskCompleted(task.id)}
                >
                  <MaterialCommunityIcons
                    name={task.completed ? "undo" : "check"}
                    size={16}
                    color={task.completed ? colors.textPrimary : colors.background}
                  />
                </Pressable>
              </View>
            </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <TaskReschedulePicker
        visible={isRescheduleOpen}
        selectedDate={rescheduleDate}
        currentDueDate={selectedTaskToReschedule ? parseDateKey(selectedTaskToReschedule.dueDate) ?? new Date() : new Date()}
        onSelectDate={setRescheduleDate}
        onConfirm={handleRescheduleConfirm}
        onCancel={closeReschedule}
      />
    </View>
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
    marginBottom: 18,
  },
  dateInfoCompact: {
    marginBottom: 14,
  },
  dateCompact: {
    fontSize: 14,
    fontWeight: "500",
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
  taskTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
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
