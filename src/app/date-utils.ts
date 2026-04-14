export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateString: string) {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(dateString);
  if (!match) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function parseSelectedDate(dateParam: string | string[] | undefined) {
  if (!dateParam) return null;
  const dateString = Array.isArray(dateParam) ? dateParam[0] : dateParam;
  return parseDateKey(dateString);
}
