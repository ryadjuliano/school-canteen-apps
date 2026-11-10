import type { UserRole } from "./types";

export type NavItem = { href: string; label: string; icon: string };

// Menu sidebar sesuai tugas tiap peran.
export const NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/pesanan", label: "Semua Pesanan", icon: "🧾" },
    { href: "/stan", label: "Stan Kantin", icon: "🏪" },
    { href: "/menu", label: "Menu Makanan", icon: "🍱" },
    { href: "/pengguna", label: "Pengguna & Saldo", icon: "👥" },
  ],
  penjual: [
    { href: "/dashboard", label: "Dashboard Stan", icon: "🏠" },
    { href: "/pesanan", label: "Pesanan Masuk", icon: "🧾" },
    { href: "/menu", label: "Menu & Stok", icon: "🍱" },
  ],
  siswa: [
    { href: "/dashboard", label: "Beranda", icon: "🏠" },
    { href: "/jajan", label: "Pesan Jajan", icon: "🛒" },
    { href: "/pesanan", label: "Pesanan Saya", icon: "🧾" },
    { href: "/saldo", label: "Saldo Saya", icon: "💳" },
  ],
};

// Semua route yang butuh login (dipakai proxy.ts)
export const PROTECTED_PATHS = ["/dashboard", "/pesanan", "/jajan", "/saldo", "/menu", "/stan", "/pengguna"];
