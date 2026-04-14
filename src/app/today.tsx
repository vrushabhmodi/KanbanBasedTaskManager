import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import TaskReschedulePicker from "../components/TaskReschedulePicker";
import { formatDateKey, parseDateKey, parseSelectedDate } from "./date-utils";
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

export default function Today() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { toggleTaskCompleted, setTaskDueDate, updateTask, deleteTask } = useTaskActions();
  const searchParams = useLocalSearchParams();
  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => parseSelectedDate(searchParams.date) ?? today, [searchParams.date, today]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const selectedDateRef = useRef(initialDate);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(() => new Date());
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  useEffect(() => {
    const routedDate = parseSelectedDate(searchParams.date);
    if (routedDate && routedDate.getTime() !== selectedDateRef.current.getTime()) {
      setSelectedDate(routedDate);
      selectedDateRef.current = routedDate;
    }
  }, [searchParams.date]);

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

  const pushToTomorrow = (taskId: string) => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDueDate(taskId, formatDateKey(tomorrow));
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setEditTitle("");
    setEditDetails("");
    setIsRescheduleOpen(false);
    setRescheduleDate(new Date());
  };

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDetails(task.details ?? "");
    setIsRescheduleOpen(false);
    setRescheduleDate(parseDateKey(task.dueDate) ?? new Date());
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

  const changeWeek = (offset: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + offset * 7);
    const nextDateKey = formatDateKey(nextDate);
    setSelectedDate(nextDate);
    selectedDateRef.current = nextDate;
    router.replace({ pathname: "/today", params: { date: nextDateKey } });
  };

  const handleSelectDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    setSelectedDate(date);
    selectedDateRef.current = date;
    router.replace({ pathname: "/today", params: { date: dateKey } });
  };

  const handleWeekSwipe = ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
    if (nativeEvent.state !== State.END) return;

    const { translationX, translationY } = nativeEvent;
    const isHorizontalSwipe = Math.abs(translationX) > Math.abs(translationY) && Math.abs(translationX) > 50;
    if (!isHorizontalSwipe) return;

    changeWeek(translationX < 0 ? 1 : -1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Today</Text>

      <PanGestureHandler onHandlerStateChange={handleWeekSwipe} activeOffsetX={[-10, 10]} failOffsetY={[-10, 10]}>
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
              onPress={() => handleSelectDate(date)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {dayNames[date.getDay()]}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                {date.getDate()}
              </Text>
              {pendingTaskCounts[formatDateKey(date)] > 0 ? (
                <Text style={styles.pendingCount}>{pendingTaskCounts[formatDateKey(date)]}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      </PanGestureHandler>

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
              onPress={() => openTaskModal(task)}
            >
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                {task.title}
              </Text>
              <View style={styles.taskActions}>
                {!task.completed && (
                  <Pressable style={styles.actionButton} onPress={() => pushToTomorrow(task.id)}>
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
                <Pressable style={styles.actionButton} onPress={openRescheduleModal}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#F8FAFC" />
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.actionButton,
                  styles.deleteButton,
                ]}
                onPress={() => {
                  const task = selectedTask;
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
                          closeTaskModal();
                        },
                      },
                    ]
                  );
                }}>
                <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
              </Pressable>
              {selectedTask && !selectedTask.completed && (
                <Pressable
                  style={[styles.actionButton, styles.tomorrowButton]}
                  onPress={() => {
                    const task = selectedTask;
                    if (!task) return;
                    pushToTomorrow(task.id);
                    closeTaskModal();
                  }}
                >
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#F8FAFC" />
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
    backgroundColor: "#111827",
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  dayCard: {
    flex: 1,
    minWidth: 0,
    height: 110,
    borderRadius: 20,
    backgroundColor: "#0F172A",
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
    fontSize: 12,
    marginBottom: 8,
  },
  dayNameSelected: {
    color: "#0F172A",
  },
  dayNumber: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "700",
  },
  dayNumberSelected: {
    color: "#0F172A",
  },
  pendingCount: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
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
  modalTaskActions: {
    marginTop: 20,
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
  deleteButton: {
    backgroundColor: "#DC2626",
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
