import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TaskReschedulePickerProps = {
  visible: boolean;
  selectedDate: Date;
  currentDueDate: Date;
  onSelectDate: (date: Date) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthGrid(date: Date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayIndex = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstDayIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export default function TaskReschedulePicker({
  visible,
  selectedDate,
  currentDueDate,
  onSelectDate,
  onConfirm,
  onCancel,
}: TaskReschedulePickerProps) {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  useEffect(() => {
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  if (!visible) {
    return null;
  }

  const monthLabel = visibleMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const gridDates = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Reschedule task</Text>
        <MaterialCommunityIcons name="calendar" size={18} color="#F8FAFC" />
      </View>
      <View style={styles.monthRow}>
        <Pressable style={styles.monthButton} onPress={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
          <Text style={styles.monthButtonText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable style={styles.monthButton} onPress={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
          <Text style={styles.monthButtonText}>{">"}</Text>
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {dayNames.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.gridContainer}>
        {gridDates.map((date) => {
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDueDate = isSameDay(date, currentDueDate);

          return (
            <Pressable
              key={date.toISOString()}
              style={[
                styles.dateCell,
                !isCurrentMonth && styles.dateCellFaded,
                isCurrentDueDate && styles.dateCellCurrentDue,
                isSelected && styles.dateCellSelected,
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.dateText,
                  !isCurrentMonth && styles.dateTextFaded,
                  isSelected && styles.dateTextSelected,
                ]}
              >
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
          <Text style={styles.buttonText}>Confirm</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#0F172A",
  },
  monthButtonText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },
  monthLabel: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekDayText: {
    width: "14.28%",
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateCell: {
    width: "13.5%",
    aspectRatio: 1,
    borderRadius: 14,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  dateCellFaded: {
    backgroundColor: "#0E1726",
  },
  dateCellSelected: {
    backgroundColor: "#F59E0B",
  },
  dateCellCurrentDue: {
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  dateText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  dateTextFaded: {
    color: "#475569",
  },
  dateTextSelected: {
    color: "#0F172A",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: "#10B981",
  },
  cancelButton: {
    backgroundColor: "#1E293B",
  },
  buttonText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
});
