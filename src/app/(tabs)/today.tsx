import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import TaskReschedulePicker from "../../components/TaskReschedulePicker";
import { formatDateKey, parseDateKey, parseSelectedDate } from "../date-utils";
import { useTaskActions, useTasks } from "../task-context";

type Task = {
  id: string;
  title: string;
  details?: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
};

export default function Today() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { toggleTaskCompleted, setTaskDueDate } = useTaskActions();
  const searchParams = useLocalSearchParams();
  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => parseSelectedDate(searchParams.date) ?? today, [searchParams.date, today]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(initialDate);
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);

  useEffect(() => {
    const routedDate = parseSelectedDate(searchParams.date);
    if (routedDate && routedDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(routedDate);
    }
  }, [searchParams.date, selectedDate]);

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
    return [...tasks]
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
    <View style={styles.container}>
      <Text style={styles.heading}>Today</Text>

      <View style={styles.dateInfoCompact}>
        <Text style={styles.dateCompact}>{formattedDate}</Text>
      </View>

      <Text style={styles.sectionTitle}>Tasks</Text>
      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        keyboardShouldPersistTaps="handled"
      >
        {tasksForSelectedDate.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks for this date yet.</Text>
          </View>
        ) : (
          tasksForSelectedDate.map((task) => (
            <Pressable
              key={task.id}
              style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
              onPress={() => router.push(`/task/${task.id}`)}
            >
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                {task.title}
              </Text>
              <View style={styles.taskActions}>
                <Pressable style={styles.actionButton} onPress={() => openReschedule(task.id)}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#F8FAFC" />
                </Pressable>
                {!task.completed && (
                  <Pressable style={[styles.actionButton, styles.tomorrowButton]} onPress={() => pushToTomorrow(task.id)}>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#F8FAFC" />
                  </Pressable>
                )}
                <Pressable
                  style={[
                    styles.actionButton,
                    task.completed ? styles.undoneButton : styles.doneButton,
                  ]}
                  onPress={() => toggleTaskCompleted(task.id)}
                >
                  <MaterialCommunityIcons
                    name={task.completed ? "undo" : "check"}
                    size={18}
                    color={task.completed ? "#0F172A" : "#FFFFFF"}
                  />
                </Pressable>
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
  dateInfoCompact: {
    marginBottom: 14,
  },
  dateCompact: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "500",
  },
  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  taskList: {
    flex: 1,
    width: "100%",
  },
  taskListContent: {
    paddingBottom: 120,
  },
  emptyState: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    alignItems: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 15,
  },
  taskCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  taskCardCompleted: {
    backgroundColor: "#0B1220",
    borderColor: "#334155",
    opacity: 0.88,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  taskTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },
  taskTitleCompleted: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  taskActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
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
});
