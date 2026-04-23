import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatDateKey } from "./date-utils";
import { NewTask, Task } from "./types";

type TaskContextType = {
  tasks: Task[];
  addTask: (task: NewTask) => void;
  updateTask: (taskId: string, changes: Partial<Omit<Task, "id" | "completed" | "lastModified">>) => void;
  toggleTaskCompleted: (taskId: string) => void;
  setTaskDueDate: (taskId: string, dueDate: string) => void;
  deleteTask: (taskId: string) => void;
  setTasks: (tasks: Task[]) => void;
};

const TaskContext = createContext<TaskContextType | null>(null);
const TASKS_STORAGE_KEY = "KBTM_TASKS";

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Write the daily plan",
    details: "Capture the main priorities and schedule tomorrow's follow-up items.",
    dueDate: formatDateKey(new Date()),
    completed: false,
    lastModified: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Review code for the calendar screen",
    details: "Check the swipe gestures, date rendering, and tab navigation behavior.",
    dueDate: formatDateKey(new Date()),
    completed: false,
    lastModified: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Prepare notes for tomorrow",
    details: "Draft the agenda, attach files, and set a reminder for the first meeting.",
    dueDate: formatDateKey(new Date()),
    completed: false,
    lastModified: new Date().toISOString(),
  },
  {
    id: "task-4",
    title: "Sync with the design review",
    details: "Confirm the latest color and spacing updates before next sprint.",
    dueDate: formatDateKey(new Date()),
    completed: false,
    lastModified: new Date().toISOString(),
  },
  {
    id: "task-5",
    title: "Fix task list scrolling issue",
    details: "Verify task cards remain tappable after enabling scroll behavior.",
    dueDate: formatDateKey(new Date()),
    completed: false,
    lastModified: new Date().toISOString(),
  },
  {
    id: "task-6",
    title: "Update the daily summary",
    details: "Add finished items and today's progress to the end-of-day review.",
    dueDate: formatDateKey(new Date()),
    completed: false,
    lastModified: new Date().toISOString(),
  },
];

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      try {
        const savedValue = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        if (savedValue) {
          const savedTasks = JSON.parse(savedValue) as Task[];
          setTasks(
            savedTasks.map((task) => ({
              ...task,
              lastModified: task.lastModified ?? new Date().toISOString(),
            }))
          );
        }
      } catch (error) {
        console.warn("Failed to load tasks from storage", error);
      } finally {
        setIsReady(true);
      }
    }

    loadTasks();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks)).catch((error) => {
      console.warn("Failed to save tasks to storage", error);
    });
  }, [tasks, isReady]);

  const replaceTasks = (nextTasks: Task[]) => {
    setTasks(
      nextTasks.map((task) => ({
        ...task,
        lastModified: task.lastModified ?? new Date().toISOString(),
      }))
    );
  };

  const addTask = (task: NewTask) => {
    setTasks((prevTasks) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        completed: false,
        lastModified: new Date().toISOString(),
        ...task,
      },
      ...prevTasks,
    ]);
  };

  const toggleTaskCompleted = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed, lastModified: new Date().toISOString() }
          : task
      )
    );
  };

  const setTaskDueDate = (taskId: string, dueDate: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, dueDate, completed: false, lastModified: new Date().toISOString() }
          : task
      )
    );
  };

  const updateTask = (taskId: string, changes: Partial<Omit<Task, "id" | "completed" | "lastModified">>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, ...changes, lastModified: new Date().toISOString() }
          : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const value = useMemo(
    () => ({ tasks, addTask, updateTask, toggleTaskCompleted, setTaskDueDate, deleteTask, setTasks: replaceTasks }),
    [tasks]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}

export function useTaskActions() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskActions must be used within a TaskProvider");
  }
  return {
    addTask: context.addTask,
    updateTask: context.updateTask,
    toggleTaskCompleted: context.toggleTaskCompleted,
    setTaskDueDate: context.setTaskDueDate,
    deleteTask: context.deleteTask,
  };
}
