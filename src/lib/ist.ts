export function nowIST(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export function todayISODate(): string {
  return nowIST().toISOString().slice(0, 10);
}

export function currentMonthBounds(): { start: string; end: string } {
  const now = nowIST();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const endDate = new Date(y, m + 1, 1);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-01`;
  return { start, end };
}
