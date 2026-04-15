export type Task = {
  id: string;
  title: string;
  details?: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
};

export type NewTask = Omit<Task, "id" | "completed">;
