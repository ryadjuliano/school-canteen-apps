const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatRupiah = (value: number) => rupiah.format(value);

const TZ = "Asia/Jakarta";

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// Jam (0-23) WIB dari sebuah timestamp
export const hourWib = (iso: string) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(new Date(iso)));

// Awal hari ini (00:00 WIB) dalam ISO, untuk filter "hari ini"
export function startOfTodayWib(): string {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()); // YYYY-MM-DD
  return new Date(`${date}T00:00:00+07:00`).toISOString();
}
