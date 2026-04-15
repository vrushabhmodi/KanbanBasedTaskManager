import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import TaskReschedulePicker from "../../components/TaskReschedulePicker";
import { formatDateKey, parseDateKey } from "../date-utils";
import { useTaskActions, useTasks } from "../task-context";
import { useTheme } from "../theme-context";

type Task = {
  id: string;
  title: string;
  details?: string;
  dueDate: string;
  completed: boolean;
};

export default function TaskDetailScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { tasks } = useTasks();
  const { toggleTaskCompleted, setTaskDueDate, updateTask, deleteTask } = useTaskActions();
  const taskId = String(searchParams.taskId ?? "");

  const { colors } = useTheme();
  const task = useMemo(
    () => tasks.find((taskItem) => taskItem.id === taskId) ?? null,
    [tasks, taskId]
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(() => new Date());

  useEffect(() => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDetails(task.details ?? "");
    setRescheduleDate(parseDateKey(task.dueDate) ?? new Date());
  }, [task?.id]);

  const handleBack = () => router.back();

  const onChangeTitle = (value: string) => {
    setEditTitle(value);
    if (!task) return;
    updateTask(task.id, { title: value });
  };

  const onChangeDetails = (value: string) => {
    setEditDetails(value);
    if (!task) return;
    updateTask(task.id, { details: value || undefined });
  };

  const openRescheduleModal = () => {
    if (!task) return;
    setIsRescheduleOpen(true);
    setRescheduleDate(parseDateKey(task.dueDate) ?? new Date());
  };

  const handleRescheduleConfirm = () => {
    if (!task) return;
    const formatted = formatDateKey(rescheduleDate);
    setTaskDueDate(task.id, formatted);
    setIsRescheduleOpen(false);
  };

  const handleRescheduleCancel = () => {
    setIsRescheduleOpen(false);
    if (!task) return;
    setRescheduleDate(parseDateKey(task.dueDate) ?? new Date());
  };

  const handleDelete = () => {
    if (!task) return;

    Alert.alert(
      "Delete task",
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTask(task.id);
            router.back();
          },
        },
      ]
    );
  };

  const pushToTomorrow = () => {
    if (!task) return;
    const tomorrow = parseDateKey(task.dueDate) ?? new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDueDate(task.id, formatDateKey(tomorrow));
  };

  const handleToggleCompleted = () => {
    if (!task) return;
    toggleTaskCompleted(task.id);
  };

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.headerRow}>
          <Pressable style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={handleBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Task</Text>
        </View>
        <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }] }>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Task not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#F8FAFC" />
        </Pressable>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Task</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <TextInput
          value={editTitle}
          onChangeText={onChangeTitle}
          placeholder="Task title"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, styles.headingInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
        />
        <TextInput
          value={editDetails}
          onChangeText={onChangeDetails}
          placeholder="Details (optional)"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, styles.detailsInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
          multiline
          numberOfLines={6}
        />
      </ScrollView>

      <TaskReschedulePicker
        visible={isRescheduleOpen}
        selectedDate={rescheduleDate}
        currentDueDate={parseDateKey(task.dueDate) ?? new Date()}
        onSelectDate={setRescheduleDate}
        onConfirm={handleRescheduleConfirm}
        onCancel={handleRescheduleCancel}
      />

      <View style={styles.footer}>
        <View style={styles.modalTaskActions}>
          {!task.completed && (
            <Pressable style={[styles.actionButton, { backgroundColor: colors.surfaceAlt }]} onPress={openRescheduleModal}>
              <MaterialCommunityIcons name="calendar" size={18} color={colors.textPrimary} />
            </Pressable>
          )}
          <Pressable style={[styles.actionButton, { backgroundColor: colors.danger }]} onPress={handleDelete}>
            <MaterialCommunityIcons name="close" size={18} color={colors.surface} />
          </Pressable>
          {!task.completed && (
            <Pressable style={[styles.actionButton, { backgroundColor: colors.accentInfo }]} onPress={pushToTomorrow}>
              <MaterialCommunityIcons name="arrow-right" size={18} color={colors.background} />
            </Pressable>
          )}
          <Pressable style={[styles.actionButton, task.completed ? [styles.undoneButton, { backgroundColor: colors.surfaceAlt }] : [styles.doneButton, { backgroundColor: colors.accentPositive }]]} onPress={handleToggleCompleted}>
            <MaterialCommunityIcons name={task.completed ? "undo" : "check"} size={18} color={task.completed ? colors.textPrimary : colors.background} />
          </Pressable>
        </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heading: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    width: "100%",
  },
  contentContainer: {
    paddingBottom: 190,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#F8FAFC",
    backgroundColor: "#111827",
    marginBottom: 12,
  },
  headingInput: {
    fontSize: 18,
    fontWeight: "700",
  },
  detailsInput: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 1,
    elevation: 1,
  },
  modalTaskActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  tomorrowButton: {
    backgroundColor: "#2563EB",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  doneButton: {
    backgroundColor: "#10B981",
  },
  undoneButton: {
    backgroundColor: "#E2E8F0",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 20,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
  },
});
