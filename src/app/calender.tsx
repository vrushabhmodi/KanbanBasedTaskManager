import { StyleSheet, Text, View } from "react-native";

export default function Calender() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>Calendar cleared.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1120",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    color: "#F8FAFC",
    fontSize: 18,
    textAlign: "center",
  },
});
