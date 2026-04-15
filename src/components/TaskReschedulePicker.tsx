import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../app/theme-context";

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
  const [mounted, setMounted] = useState(visible);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const [monthDirection, setMonthDirection] = useState(1);
  const animation = useRef(new Animated.Value(0)).current;
  const monthAnimation = useRef(new Animated.Value(1)).current;

  const animatedMonthStyle = {
    opacity: monthAnimation,
    transform: [
      {
        translateY: monthAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  const handleMonthChange = (offset: number) => {
    setMonthDirection(offset);
    Animated.timing(monthAnimation, {
      toValue: 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setVisibleMonth((prev) => {
        const next = new Date(prev);
        next.setMonth(prev.getMonth() + offset);
        return next;
      });
      monthAnimation.setValue(0);
      Animated.timing(monthAnimation, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, animation]);

  const { colors } = useTheme();
  const monthLabel = visibleMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const gridDates = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);

  if (!mounted) {
    return null;
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Reschedule task</Text>
        <MaterialCommunityIcons name="calendar" size={18} color={colors.textPrimary} />
      </View>
      <View style={styles.monthRow}>
        <Pressable
          style={({ pressed }) => [
            styles.monthButton,
            { backgroundColor: colors.surfaceAlt },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.88 },
          ]}
          onPress={() => handleMonthChange(-1)}
        >
          <Text style={[styles.monthButtonText, { color: colors.textPrimary }]}>{"<"}</Text>
        </Pressable>
        <Animated.Text style={[styles.monthLabel, { color: colors.textPrimary }, animatedMonthStyle]}>
          {monthLabel}
        </Animated.Text>
        <Pressable
          style={({ pressed }) => [
            styles.monthButton,
            { backgroundColor: colors.surfaceAlt },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.88 },
          ]}
          onPress={() => handleMonthChange(1)}
        >
          <Text style={[styles.monthButtonText, { color: colors.textPrimary }]}>{">"}</Text>
        </Pressable>
      </View>
      <Animated.View style={[styles.weekRow, animatedMonthStyle]}>
        {dayNames.map((day) => (
          <Text key={day} style={[styles.weekDayText, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </Animated.View>
      <Animated.View style={[styles.gridContainer, animatedMonthStyle]}>
        {gridDates.map((date) => {
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDueDate = isSameDay(date, currentDueDate);

          return (
            <Pressable
              key={date.toISOString()}
              style={[
                styles.dateCell,
                { backgroundColor: colors.surface },
                !isCurrentMonth && { backgroundColor: colors.surfaceAlt },
                isCurrentDueDate && { borderColor: colors.accentInfo },
                isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.dateText,
                  { color: isCurrentMonth ? colors.textPrimary : colors.muted },
                  isSelected && { color: colors.background },
                ]}
              >
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.cancelButton,
            { backgroundColor: colors.surfaceAlt },
            pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
          ]}
          onPress={onCancel}
        >
          <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.confirmButton,
            { backgroundColor: colors.accentPositive },
            pressed && { transform: [{ scale: 0.96 }], opacity: 0.88 },
          ]}
          onPress={onConfirm}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>Confirm</Text>
        </Pressable>
      </View>
    </Animated.View>
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
    position: "relative",
    zIndex: 2,
    elevation: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: "700",
  },
  monthLabel: {
    color: "#E2E8F0",
    fontSize: 14,
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
    fontSize: 11,
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
  dateText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "700",
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
    fontSize: 13,
    fontWeight: "700",
  },
});
