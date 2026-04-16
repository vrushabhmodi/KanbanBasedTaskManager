import { createContext, useContext, useMemo, useState } from "react";
import { formatDateKey } from "./date-utils";

type CreateTaskDateContextType = {
  calendarSelectedDate: string;
  setCalendarSelectedDate: (dateKey: string) => void;
};

const CreateTaskDateContext = createContext<CreateTaskDateContextType | null>(null);

export function CreateTaskDateProvider({ children }: { children: React.ReactNode }) {
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(formatDateKey(new Date()));

  const value = useMemo(
    () => ({ calendarSelectedDate, setCalendarSelectedDate }),
    [calendarSelectedDate]
  );

  return (
    <CreateTaskDateContext.Provider value={value}>
      {children}
    </CreateTaskDateContext.Provider>
  );
}

export function useCreateTaskDate() {
  const context = useContext(CreateTaskDateContext);
  if (!context) {
    throw new Error("useCreateTaskDate must be used within CreateTaskDateProvider");
  }
  return context;
}
