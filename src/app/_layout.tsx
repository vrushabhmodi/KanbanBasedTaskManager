import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, UIManager, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CreateTaskDateProvider, useCreateTaskDate } from "./create-task-date-context";
import { formatDateKey } from "./date-utils";
import { NotificationProvider } from "./notification-context";
import { TaskProvider, useTaskActions } from "./task-context";
import { ThemeProvider, useTheme } from "./theme-context";
import { GoogleDriveProvider } from "./google-drive-context";
import { SyncProvider } from "./sync-context";
import { SelectionModeProvider, useSelectionMode } from "./selection-mode-context";
import { registerBackgroundSyncTask } from "../services/sync-scheduler";

function CreateTaskModal({
  visible,
  onClose,
  title,
  details,
  setTitle,
  setDetails,
  dueDate,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  details: string;
  setTitle: (value: string) => void;
  setDetails: (value: string) => void;
  dueDate: string;
}) {
  const { addTask } = useTaskActions();
  const { colors } = useTheme();
  const titleInputRef = useRef<TextInput>(null);
  const [isMounted, setIsMounted] = useState(visible);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;

  const focusTitleInput = () => {
    if (Platform.OS === "android") {
      Keyboard.dismiss();
    }

    titleInputRef.current?.focus();

    if (Platform.OS === "android") {
      setTimeout(() => titleInputRef.current?.focus(), 100);
      setTimeout(() => titleInputRef.current?.focus(), 220);
    }
  };

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.back(0.5)),
          useNativeDriver: true,
        }),
      ]).start();
      focusTitleInput();
      const handle = setTimeout(focusTitleInput, 80);
      return () => clearTimeout(handle);
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 20,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
    return undefined;
  }, [visible, overlayOpacity, cardTranslateY]);

  const handleCreateTask = () => {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      details: details.trim() || undefined,
      dueDate,
    });

    setTitle("");
    setDetails("");
    onClose();
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { backgroundColor: colors.overlay, opacity: overlayOpacity }]}> 
        <Pressable style={styles.modalOverlayTouchable} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            { transform: [{ translateY: cardTranslateY }] },
          ]}
        >
          <Text style={[styles.modalHeading, { color: colors.textPrimary }]}>Create new task</Text>
          <TextInput
            ref={titleInputRef}
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            autoFocus
            showSoftInputOnFocus
          />
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Details (optional)"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, styles.inputTextarea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            multiline
            numberOfLines={3}
          />
          <Pressable
            style={[styles.createButton, { backgroundColor: colors.accent }, !title.trim() && styles.createButtonDisabled]}
            onPress={handleCreateTask}
            disabled={!title.trim()}
          >
            <Text style={[styles.createButtonText, { color: colors.accentText }]}>Create task</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function RootLayoutContent() {
  const { colors } = useTheme();
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const segments = useSegments() as string[];
  const isTaskDetailRoute = segments.includes("task");
  const isCalendarRoute = segments.includes("calender");
  const { calendarSelectedDate } = useCreateTaskDate();
  const { isSelectionMode } = useSelectionMode();

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const createTaskDueDate = isCalendarRoute && calendarSelectedDate ? calendarSelectedDate : formatDateKey(new Date());

  const openCreateModal = () => setCreateModalVisible(true);
  const closeCreateModal = () => {
    setCreateModalVisible(false);
    setTitle("");
    setDetails("");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {!isTaskDetailRoute && !isSelectionMode && (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.accent },
            pressed && { transform: [{ scale: 0.96 }], opacity: 0.92 },
          ]}
          onPress={openCreateModal}
        >
          <MaterialCommunityIcons name="plus" size={32} color={colors.accentText} />
        </Pressable>
      )}

      <CreateTaskModal
        visible={isCreateModalVisible}
        onClose={closeCreateModal}
        title={title}
        details={details}
        setTitle={setTitle}
        setDetails={setDetails}
        dueDate={createTaskDueDate}
      />
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    registerBackgroundSyncTask();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SelectionModeProvider>
          <CreateTaskDateProvider>
            <TaskProvider>
              <NotificationProvider>
                <GoogleDriveProvider>
                  <SyncProvider>
                    <RootLayoutContent />
                  </SyncProvider>
                </GoogleDriveProvider>
              </NotificationProvider>
            </TaskProvider>
          </CreateTaskDateProvider>
        </SelectionModeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 90,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 10,
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
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
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
  inputTextarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  createButton: {
    marginTop: 8,
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
    fontSize: 14,
  },
});
