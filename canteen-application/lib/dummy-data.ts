// Data dummy untuk MVP dashboard, sebelum terhubung ke database.

export type OrderStatus = "Menunggu" | "Disiapkan" | "Siap diambil" | "Selesai";

export type Order = {
  id: string;
  time: string;
  student: string;
  className: string;
  stall: string;
  items: { name: string; qty: number; price: number }[];
  status: OrderStatus;
};

export const orderTotal = (o: Order) =>
  o.items.reduce((sum, i) => sum + i.qty * i.price, 0);

export const TODAY_ORDERS: Order[] = [
  { id: "#1048", time: "09:41", student: "Alya Putri", className: "X-2", stall: "Dapur Bu Ani", items: [{ name: "Nasi Ayam Teriyaki", qty: 1, price: 15000 }, { name: "Es Teh Manis", qty: 1, price: 4000 }], status: "Menunggu" },
  { id: "#1047", time: "09:39", student: "Bima Saputra", className: "XI IPA-1", stall: "Mie & Bakso Pak Joko", items: [{ name: "Mie Ayam", qty: 1, price: 12000 }], status: "Disiapkan" },
  { id: "#1046", time: "09:37", student: "Citra Lestari", className: "XII IPS-2", stall: "Sehat Segar", items: [{ name: "Salad Buah", qty: 1, price: 10000 }, { name: "Susu UHT", qty: 1, price: 6000 }], status: "Siap diambil" },
  { id: "#1045", time: "09:35", student: "Dimas Pratama", className: "X-4", stall: "Dapur Bu Ani", items: [{ name: "Nasi Goreng Telur", qty: 2, price: 13000 }], status: "Siap diambil" },
  { id: "#1044", time: "09:33", student: "Eka Wulandari", className: "XI IPS-3", stall: "Roti & Snack", items: [{ name: "Roti Isi Coklat", qty: 2, price: 5000 }], status: "Selesai" },
  { id: "#1043", time: "09:32", student: "Fajar Nugroho", className: "XII IPA-2", stall: "Mie & Bakso Pak Joko", items: [{ name: "Bakso Kuah", qty: 1, price: 13000 }, { name: "Es Jeruk", qty: 1, price: 5000 }], status: "Selesai" },
  { id: "#1042", time: "09:30", student: "Gita Maharani", className: "X-1", stall: "Sehat Segar", items: [{ name: "Jus Jambu", qty: 1, price: 8000 }], status: "Selesai" },
];

// Jumlah pesanan per jam hari ini. Istirahat: 09.30 dan 12.00.
export const ORDERS_PER_HOUR = [
  { hour: "07", orders: 18, recess: false },
  { hour: "08", orders: 9, recess: false },
  { hour: "09", orders: 86, recess: true },
  { hour: "10", orders: 22, recess: false },
  { hour: "11", orders: 14, recess: false },
  { hour: "12", orders: 104, recess: true },
  { hour: "13", orders: 31, recess: false },
  { hour: "14", orders: 12, recess: false },
];

export const BEST_SELLERS = [
  { name: "Nasi Ayam Teriyaki", emoji: "🍱", sold: 64 },
  { name: "Mie Ayam", emoji: "🍜", sold: 51 },
  { name: "Es Teh Manis", emoji: "🧋", sold: 48 },
  { name: "Roti Isi Coklat", emoji: "🥪", sold: 37 },
  { name: "Salad Buah", emoji: "🥗", sold: 22 },
];

export const LOW_STOCK = [
  { name: "Susu UHT", emoji: "🥛", stall: "Sehat Segar", left: 4 },
  { name: "Roti Isi Keju", emoji: "🥪", stall: "Roti & Snack", left: 6 },
  { name: "Nasi Ayam Teriyaki", emoji: "🍱", stall: "Dapur Bu Ani", left: 9 },
];

export const TODAY_STATS = {
  revenue: 3_412_000,
  revenueChange: 12, // % dibanding kemarin
  orders: 296,
  students: 241,
  studentsTotal: 612,
  balance: 18_750_000, // total saldo jajan siswa
};
