export type Task = {
  id: string;
  title: string;
  details?: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  lastModified: string;
};

export type NewTask = Omit<Task, "id" | "completed" | "lastModified">;
