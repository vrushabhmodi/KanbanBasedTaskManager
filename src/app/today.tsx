import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTaskActions, useTasks } from "./task-context";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Task = {
  id: string;
  title: string;
  details?: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
};

function getWeekDays(referenceDate: Date) {
  const weekStart = new Date(referenceDate);
  weekStart.setDate(referenceDate.getDate() - weekStart.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseSelectedDate(dateParam: string | string[] | undefined) {
  if (!dateParam) return null;
  const dateString = Array.isArray(dateParam) ? dateParam[0] : dateParam;
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function Today() {
  const { tasks } = useTasks();
  const { toggleTaskCompleted, setTaskDueDate, updateTask } = useTaskActions();
  const searchParams = useLocalSearchParams();
  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => parseSelectedDate(searchParams.date) ?? today, [searchParams.date, today]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  useEffect(() => {
    const routedDate = parseSelectedDate(searchParams.date);
    if (routedDate && routedDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(routedDate);
    }
  }, [searchParams.date, selectedDate]);

  const selectedDateKey = formatDateKey(selectedDate);
  const tasksForSelectedDate = useMemo(() => {
    return [...tasks]
      .filter((task) => task.dueDate === selectedDateKey)
      .sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [tasks, selectedDateKey]);

  const pushToTomorrow = (taskId: string) => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDueDate(taskId, formatDateKey(tomorrow));
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setEditTitle("");
    setEditDetails("");
  };

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDetails(task.details ?? "");
  };

  const saveTaskEdits = () => {
    if (!selectedTask) return;
    updateTask(selectedTask.id, {
      title: editTitle,
      details: editDetails || undefined,
    });
    setSelectedTask({ ...selectedTask, title: editTitle, details: editDetails || undefined });
  };

  const onChangeTitle = (value: string) => {
    setEditTitle(value);
    if (!selectedTask) return;
    updateTask(selectedTask.id, { title: value });
    setSelectedTask({ ...selectedTask, title: value });
  };

  const onChangeDetails = (value: string) => {
    setEditDetails(value);
    if (!selectedTask) return;
    updateTask(selectedTask.id, { details: value || undefined });
    setSelectedTask({ ...selectedTask, details: value || undefined });
  };

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

      <Text style={styles.sectionTitle}>Tasks</Text>
      {tasksForSelectedDate.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tasks for this date yet.</Text>
        </View>
      ) : (
        tasksForSelectedDate.map((task) => (
          <Pressable
            key={task.id}
            style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
            onPress={() => openTaskModal(task)}
          >
            <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
              {task.title}
            </Text>
            <View style={styles.taskActions}>
              {!task.completed && (
                <Pressable style={styles.actionButton} onPress={() => pushToTomorrow(task.id)}>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#F8FAFC" />
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
                  size={20}
                  color={task.completed ? "#0F172A" : "#FFFFFF"}
                />
              </Pressable>
            </View>
          </Pressable>
        ))
      )}

      <Modal transparent visible={!!selectedTask} animationType="fade" onRequestClose={closeTaskModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayTouchable} onPress={closeTaskModal} />
          <View style={styles.modalCard}>
            <TextInput
              value={editTitle}
              onChangeText={onChangeTitle}
              placeholder="Task title"
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.modalHeadingInput]}
            />
            <TextInput
              value={editDetails}
              onChangeText={onChangeDetails}
              placeholder="Details (optional)"
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.modalDetailsInput]}
              multiline
              numberOfLines={4}
            />
            <View style={[styles.taskActions, styles.modalTaskActions]}>
              {selectedTask && !selectedTask.completed && (
                <Pressable
                  style={styles.actionButton}
                  onPress={() => {
                    const task = selectedTask;
                    if (!task) return;
                    pushToTomorrow(task.id);
                    closeTaskModal();
                  }}
                >
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#F8FAFC" />
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.actionButton,
                  selectedTask?.completed ? styles.undoneButton : styles.doneButton,
                ]}
                onPress={() => {
                  const task = selectedTask;
                  if (!task) return;
                  toggleTaskCompleted(task.id);
                  closeTaskModal();
                }}
              >
                <MaterialCommunityIcons
                  name={selectedTask?.completed ? "undo" : "check"}
                  size={20}
                  color={selectedTask?.completed ? "#0F172A" : "#FFFFFF"}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
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
    fontSize: 16,
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
  modalTaskActions: {
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#F59E0B",
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: "#10B981",
  },
  doneButtonText: {
    color: "#FFFFFF",
  },
  undoneButton: {
    backgroundColor: "#E2E8F0",
  },
  undoneButtonText: {
    color: "#0F172A",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalOverlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1F2937",
    zIndex: 1,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#F8FAFC",
    backgroundColor: "#111827",
    marginBottom: 12,
  },
  modalHeadingInput: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalDetailsInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  modalHeading: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalDetails: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalDetailsOptional: {
    color: "#94A3B8",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F59E0B",
  },
  modalCloseButtonText: {
    color: "#0F172A",
    fontWeight: "700",
  },
});
