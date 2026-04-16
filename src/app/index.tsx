import { Redirect } from "expo-router";
import { formatDateKey } from "./date-utils";

export default function Index() {
  return <Redirect href={{ pathname: "/today", params: { date: formatDateKey(new Date()) } }} />;
}
