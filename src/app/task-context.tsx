import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatDateKey } from "./date-utils";
import { NewTask, Task } from "./types";

type TaskContextType = {
  tasks: Task[];
  deletedTaskIds: string[];
  addTask: (task: NewTask) => void;
  updateTask: (taskId: string, changes: Partial<Omit<Task, "id" | "completed" | "lastModified">>) => void;
  toggleTaskCompleted: (taskId: string) => void;
  setTaskDueDate: (taskId: string, dueDate: string) => void;
  deleteTask: (taskId: string) => void;
  setTasks: (tasks: Task[], deletedTaskIds?: string[]) => void;
};

const TaskContext = createContext<TaskContextType | null>(null);
const TASKS_STORAGE_KEY = "KBTM_TASKS";
const DELETED_TASKS_STORAGE_KEY = "KBTM_DELETED_TASKS";

const initialTasks: Task[] = [];

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      try {
        const [savedTasksValue, savedDeletedValue] = await Promise.all([
          AsyncStorage.getItem(TASKS_STORAGE_KEY),
          AsyncStorage.getItem(DELETED_TASKS_STORAGE_KEY),
        ]);

        if (savedTasksValue) {
          const savedTasks = JSON.parse(savedTasksValue) as Task[];
          setTasks(
            savedTasks.map((task) => ({
              ...task,
              lastModified: task.lastModified ?? new Date().toISOString(),
            }))
          );
        }

        if (savedDeletedValue) {
          setDeletedTaskIds(JSON.parse(savedDeletedValue));
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

    Promise.all([
      AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks)),
      AsyncStorage.setItem(DELETED_TASKS_STORAGE_KEY, JSON.stringify(deletedTaskIds)),
    ]).catch((error) => {
      console.warn("Failed to save tasks to storage", error);
    });
  }, [tasks, deletedTaskIds, isReady]);

  const replaceTasks = (nextTasks: Task[], nextDeletedIds?: string[]) => {
    setTasks(
      nextTasks.map((task) => ({
        ...task,
        lastModified: task.lastModified ?? new Date().toISOString(),
      }))
    );
    if (nextDeletedIds) {
      setDeletedTaskIds(nextDeletedIds);
    }
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
    setDeletedTaskIds((prev) => Array.from(new Set([...prev, taskId])));
  };

  const value = useMemo(
    () => ({
      tasks,
      deletedTaskIds,
      addTask,
      updateTask,
      toggleTaskCompleted,
      setTaskDueDate,
      deleteTask,
      setTasks: replaceTasks
    }),
    [tasks, deletedTaskIds]
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
