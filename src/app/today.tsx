import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

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

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Write the daily plan",
    details: "Capture the main priorities and schedule tomorrow's follow-up items.",
    dueDate: formatDateKey(new Date()),
    completed: false,
  },
  {
    id: "task-2",
    title: "Review code for the calendar screen",
    details: "Check the swipe gestures, date rendering, and tab navigation behavior.",
    dueDate: formatDateKey(new Date()),
    completed: false,
  },
  {
    id: "task-3",
    title: "Prepare notes for tomorrow",
    details: "Draft the agenda, attach files, and set a reminder for the first meeting.",
    dueDate: formatDateKey(new Date(new Date().setDate(new Date().getDate() + 1))),
    completed: false,
  },
];

export default function Today() {
  const searchParams = useLocalSearchParams();
  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => parseSelectedDate(searchParams.date) ?? today, [searchParams.date, today]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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

  const setTaskDueDate = (taskId: string, dueDate: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, dueDate, completed: false } : task
      )
    );
  };

  const pushToTomorrow = (taskId: string) => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDueDate(taskId, formatDateKey(tomorrow));
  };

  const toggleTaskCompleted = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const closeTaskModal = () => setSelectedTask(null);

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
            onPress={() => setSelectedTask(task)}
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
            <Text style={styles.modalHeading}>{selectedTask?.title}</Text>
            {selectedTask?.details ? (
              <Text style={styles.modalDetails}>{selectedTask.details}</Text>
            ) : (
              <Text style={styles.modalDetailsOptional}>No additional details.</Text>
            )}
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
