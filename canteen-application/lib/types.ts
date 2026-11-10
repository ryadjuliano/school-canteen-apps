export type UserRole = "admin" | "penjual" | "siswa";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  class_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  balance: number;
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin Kantin",
  penjual: "Penjual",
  siswa: "Siswa",
};

export type Stall = {
  id: number;
  name: string;
  emoji: string;
  description: string | null;
  owner_id: string | null;
  is_open: boolean;
};

export type MenuItem = {
  id: number;
  stall_id: number;
  name: string;
  emoji: string;
  price: number;
  stock: number;
  is_available: boolean;
};

export type OrderStatus = "menunggu" | "disiapkan" | "siap_diambil" | "selesai" | "dibatalkan";

export type OrderItem = {
  id: number;
  name: string;
  emoji: string;
  price: number;
  qty: number;
};

export type Order = {
  id: number;
  student_id: string;
  stall_id: number;
  student_name: string;
  class_name: string | null;
  status: OrderStatus;
  total: number;
  note: string | null;
  created_at: string;
  order_items: OrderItem[];
  stalls: { name: string; emoji: string } | null;
};

export const ORDER_SELECT =
  "id, student_id, stall_id, student_name, class_name, status, total, note, created_at, order_items(id, name, emoji, price, qty), stalls(name, emoji)";

export const ACTIVE_STATUSES: OrderStatus[] = ["menunggu", "disiapkan", "siap_diambil"];

export const STATUS_META: Record<OrderStatus, { label: string; icon: string; style: string }> = {
  menunggu: { label: "Menunggu", icon: "⏳", style: "bg-amber-100 text-amber-800" },
  disiapkan: { label: "Disiapkan", icon: "👩‍🍳", style: "bg-sky-100 text-sky-800" },
  siap_diambil: { label: "Siap diambil", icon: "✅", style: "bg-emerald-100 text-emerald-800" },
  selesai: { label: "Selesai", icon: "✔️", style: "bg-slate-100 text-slate-600" },
  dibatalkan: { label: "Dibatalkan", icon: "✖️", style: "bg-red-100 text-red-700" },
};

// Label tombol untuk memajukan status (penjual/admin)
export const NEXT_STEP: Partial<Record<OrderStatus, string>> = {
  menunggu: "👩‍🍳 Mulai siapkan",
  disiapkan: "✅ Siap diambil",
  siap_diambil: "✔️ Sudah diambil",
};

export type ActionState = { error?: string; success?: string };
