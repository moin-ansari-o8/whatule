export function uid(prefix = "msg") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now()}`;
}

export function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
