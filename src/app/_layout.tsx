import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TaskProvider, useTaskActions } from "./task-context";

const tabBarColors = {
  active: "#F59E0B",
  inactive: "#D1D5DB",
  background: "#0F172A",
  border: "#334155",
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

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
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalOverlayTouchable} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalHeading}>Create new task</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Details (optional)"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.inputTextarea]}
            multiline
            numberOfLines={3}
          />
          <Pressable
            style={[styles.createButton, !title.trim() && styles.createButtonDisabled]}
            onPress={handleCreateTask}
            disabled={!title.trim()}
          >
            <Text style={styles.createButtonText}>Create task</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function RootLayout() {
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const openCreateModal = () => setCreateModalVisible(true);
  const closeCreateModal = () => {
    setCreateModalVisible(false);
    setTitle("");
    setDetails("");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <View style={styles.root}>
          <Tabs
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: tabBarColors.active,
              tabBarInactiveTintColor: tabBarColors.inactive,
              tabBarShowLabel: true,
              tabBarStyle: {
                backgroundColor: tabBarColors.background,
                borderTopColor: tabBarColors.border,
                height: 70,
                marginHorizontal: 14,
                marginBottom: 10,
                borderRadius: 20,
                position: "absolute",
                left: 0,
                right: 0,
                paddingBottom: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.18,
                shadowRadius: 20,
                elevation: 12,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: "600",
              },
              tabBarIcon: ({ color, size }) => {
                const iconName = route.name === "today" ? "calendar-today" : "calendar-check";
                return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tabs.Screen name="today" options={{ title: "Today" }} />
            <Tabs.Screen name="calender" options={{ title: "Calendar" }} />
          </Tabs>

          <Pressable style={styles.fab} onPress={openCreateModal}>
            <MaterialCommunityIcons name="plus" size={32} color="#0F172A" />
          </Pressable>

          <CreateTaskModal
            visible={isCreateModalVisible}
            onClose={closeCreateModal}
            title={title}
            details={details}
            setTitle={setTitle}
            setDetails={setDetails}
          />
        </View>
      </TaskProvider>
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
    fontSize: 22,
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
    fontSize: 16,
  },
});
