export function summarizeMessages(messages = []) {
  const now = Date.now();
  return messages.reduce(
    (acc, msg) => {
      acc.total += 1;
      acc.status[msg.status ?? "unknown"] = (acc.status[msg.status ?? "unknown"] || 0) + 1;
      if (new Date(msg.scheduledTime).getTime() <= now) acc.due += 1;
      return acc;
    },
    { total: 0, due: 0, status: {} },
  );
}
