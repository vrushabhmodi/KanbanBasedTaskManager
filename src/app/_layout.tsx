import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { formatDateKey } from "./date-utils";
import { TaskProvider, useTaskActions } from "./task-context";
import { ThemeProvider, useTheme } from "./theme-context";

const TextAny = Text as any;
const TextInputAny = TextInput as any;

if (TextAny.defaultProps == null) {
  TextAny.defaultProps = {};
}
TextAny.defaultProps.style = [{ fontFamily: "Arial" }, TextAny.defaultProps.style];
TextAny.defaultProps.allowFontScaling = false;

if (TextInputAny.defaultProps == null) {
  TextInputAny.defaultProps = {};
}
TextInputAny.defaultProps.style = [{ fontFamily: "Arial" }, TextInputAny.defaultProps.style];
TextInputAny.defaultProps.allowFontScaling = false;

function CreateTaskModal({
  visible,
  onClose,
  title,
  details,
  setTitle,
  setDetails,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  details: string;
  setTitle: (value: string) => void;
  setDetails: (value: string) => void;
}) {
  const { addTask } = useTaskActions();
  const { colors } = useTheme();
  const titleInputRef = useRef<TextInput>(null);

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
      focusTitleInput();
      const handle = setTimeout(focusTitleInput, 80);
      return () => clearTimeout(handle);
    }
    return undefined;
  }, [visible]);

  const handleCreateTask = () => {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      details: details.trim() || undefined,
      dueDate: formatDateKey(new Date()),
    });

    setTitle("");
    setDetails("");
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      onShow={focusTitleInput}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}> 
        <Pressable style={styles.modalOverlayTouchable} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
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
        </View>
      </View>
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

      {!isTaskDetailRoute && (
        <Pressable style={[styles.fab, { backgroundColor: colors.accent }]} onPress={openCreateModal}>
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
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <TaskProvider>
          <RootLayoutContent />
        </TaskProvider>
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
