export function startOfWeek(input = new Date()) {
  const date = new Date(input);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

export function endOfWeek(input = new Date()) {
  const date = startOfWeek(input);
  date.setDate(date.getDate() + 6);
  return date;
}

export function addDays(input: Date, amount: number) {
  const date = new Date(input);
  date.setDate(date.getDate() + amount);
  return date;
}

export function toIsoDate(input: Date) {
  const year = input.getFullYear();
  const month = `${input.getMonth() + 1}`.padStart(2, "0");
  const day = `${input.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayDifference(older: string, newer: string) {
  const ms = new Date(newer).getTime() - new Date(older).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function labelForWeek(start: Date, end: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(start) +
    " - " +
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(end);
}
