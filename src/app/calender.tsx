import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import { formatDateKey, parseDateKey } from "./date-utils";
import { useTaskActions, useTasks } from "./task-context";
import TaskReschedulePicker from "./task-reschedule-picker";

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
  const [selectedDate, setSelectedDate] = useState(() => today);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(() => new Date());

  const selectedDateKey = formatDateKey(selectedDate);
  const tasksForSelectedDate = useMemo(() => {
    return [...tasks]
      .filter((task) => task.dueDate === selectedDateKey)
      .sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [tasks, selectedDateKey]);

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

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDetails(task.details ?? "");
    setIsRescheduleOpen(false);
    setRescheduleDate(parseDateKey(task.dueDate) ?? new Date());
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setEditTitle("");
    setEditDetails("");
    setIsRescheduleOpen(false);
    setRescheduleDate(new Date());
  };

  const openRescheduleModal = () => {
    if (!selectedTask) return;
    setIsRescheduleOpen(true);
    setRescheduleDate(parseDateKey(selectedTask.dueDate) ?? new Date());
  };

  const handleRescheduleConfirm = () => {
    if (!selectedTask) return;
    const formatted = formatDateKey(rescheduleDate);
    setTaskDueDate(selectedTask.id, formatted);
    setSelectedTask({ ...selectedTask, dueDate: formatted });
    closeTaskModal();
  };

  const handleRescheduleCancel = () => {
    setIsRescheduleOpen(false);
    setRescheduleDate(parseDateKey(selectedTask?.dueDate ?? "") ?? new Date());
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
              onPress={() => openTaskModal(task)}
            >
              <Text style={[styles.smallTaskTitle, task.completed && styles.smallTaskTitleCompleted]}>
                {task.title}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
        </View>
      </PanGestureHandler>

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
            <View style={styles.modalTaskActions}>
              {selectedTask && !selectedTask.completed && (
                <Pressable style={styles.actionButton} onPress={openRescheduleModal}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#F8FAFC" />
                </Pressable>
              )}
              {selectedTask && !selectedTask.completed && (
                <Pressable
                  style={styles.actionButton}
                  onPress={() => {
                    if (!selectedTask) return;
                    pushToTomorrow(selectedTask.id);
                    closeTaskModal();
                  }}
                >
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#F8FAFC" />
                </Pressable>
              )}
              <Pressable
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  if (!selectedTask) return;
                  Alert.alert(
                    "Delete task",
                    `Are you sure you want to delete "${selectedTask.title}"?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          deleteTask(selectedTask.id);
                          closeTaskModal();
                        },
                      },
                    ]
                  );
                }}
              >
                <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  selectedTask?.completed ? styles.undoneButton : styles.doneButton,
                ]}
                onPress={() => {
                  if (!selectedTask) return;
                  toggleTaskCompleted(selectedTask.id);
                  closeTaskModal();
                }}
              >
                <MaterialCommunityIcons
                  name={selectedTask?.completed ? "undo" : "check"}
                  size={18}
                  color={selectedTask?.completed ? "#0F172A" : "#FFFFFF"}
                />
              </Pressable>
            </View>
            <TaskReschedulePicker
              visible={isRescheduleOpen}
              selectedDate={rescheduleDate}
              currentDueDate={parseDateKey(selectedTask?.dueDate ?? "") ?? new Date()}
              onSelectDate={setRescheduleDate}
              onConfirm={handleRescheduleConfirm}
              onCancel={handleRescheduleCancel}
            />
          </View>
        </View>
      </Modal>
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
  todayCell: {
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  todayText: {
    color: "#F59E0B",
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
  },
  smallTaskCardCompleted: {
    backgroundColor: "#0B1220",
    borderColor: "#334155",
    opacity: 0.9,
  },
  smallTaskTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
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
    fontSize: 18,
    fontWeight: "700",
  },
  modalDetailsInput: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  modalTaskActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#2563EB",
    marginBottom: 10,
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
