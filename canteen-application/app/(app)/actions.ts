"use server";

import { refresh } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, UserRole } from "@/lib/types";

// Setiap action memeriksa peran di sini, dan database memeriksanya lagi (RLS/RPC).

type DbError = { code?: string; message: string } | null;

function result(error: DbError, success: string): ActionState {
  if (!error) {
    refresh();
    return { success };
  }
  // P0001 = pesan dari `raise exception` di fungsi SQL (sudah ramah pengguna)
  if (error.code === "P0001") return { error: error.message };
  if (error.code === "42501") return { error: "Kamu tidak punya akses untuk aksi ini." };
  if (error.code === "23505") return { error: "Data yang sama sudah ada." };
  if (error.code === "23503") return { error: "Data masih dipakai di pesanan, tidak bisa dihapus." };
  console.error(error);
  return { error: "Terjadi kesalahan. Coba lagi ya." };
}

const int = (v: FormDataEntryValue | null) => Number.parseInt(String(v ?? ""), 10);
const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();

// ============================== SISWA ==============================

export async function placeOrder(
  items: { menu_item_id: number; qty: number }[],
  note: string,
): Promise<ActionState & { orderIds?: number[] }> {
  await requireRole(["siswa"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", { p_items: items, p_note: note });
  const res = result(error, "Pesanan berhasil dibuat! 🎉");
  return error ? res : { ...res, orderIds: data as number[] };
}

// ======================= PESANAN (semua peran) ======================

export async function advanceOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "penjual"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_order_status", { p_order_id: int(fd.get("order_id")) });
  return result(error, "Status pesanan diperbarui.");
}

export async function cancelOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "penjual", "siswa"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", { p_order_id: int(fd.get("order_id")) });
  return result(error, "Pesanan dibatalkan, saldo dikembalikan.");
}

// =========================== MENU & STOK ===========================

export async function saveMenuItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "penjual"]);
  const id = int(fd.get("id"));
  const values = {
    name: text(fd.get("name")),
    emoji: text(fd.get("emoji")) || "🍱",
    price: int(fd.get("price")),
    stock: int(fd.get("stock")),
    is_available: fd.get("is_available") === "on",
  };
  if (values.name.length < 2) return { error: "Nama menu minimal 2 karakter." };
  if (!(values.price > 0)) return { error: "Harga harus lebih dari 0." };
  if (!(values.stock >= 0)) return { error: "Stok tidak boleh negatif." };

  const supabase = await createClient();
  if (id) {
    // RLS memastikan penjual hanya bisa mengubah menu stannya sendiri.
    const { error, count } = await supabase
      .from("menu_items")
      .update(values, { count: "exact" })
      .eq("id", id);
    if (!error && count === 0) return { error: "Menu tidak ditemukan atau bukan milik stanmu." };
    return result(error, "Menu disimpan.");
  }

  const { error } = await supabase
    .from("menu_items")
    .insert({ ...values, stall_id: int(fd.get("stall_id")) });
  return result(error, "Menu baru ditambahkan.");
}

export async function deleteMenuItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "penjual"]);
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", int(fd.get("id")));
  return result(error, "Menu dihapus.");
}

// ============================== STAN ===============================

export async function toggleStall(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "penjual"]);
  const supabase = await createClient();
  const isOpen = fd.get("is_open") === "true";
  const { error, count } = await supabase
    .from("stalls")
    .update({ is_open: isOpen }, { count: "exact" })
    .eq("id", int(fd.get("stall_id")));
  if (!error && count === 0) return { error: "Stan tidak ditemukan." };
  return result(error, isOpen ? "Stan dibuka." : "Stan ditutup.");
}

export async function createStall(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const name = text(fd.get("name"));
  if (name.length < 2) return { error: "Nama stan minimal 2 karakter." };
  const supabase = await createClient();
  const { error } = await supabase.from("stalls").insert({
    name,
    emoji: text(fd.get("emoji")) || "🏪",
    description: text(fd.get("description")) || null,
  });
  return result(error, "Stan baru ditambahkan.");
}

export async function assignStallOwner(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_stall_owner", {
    p_stall_id: int(fd.get("stall_id")),
    p_owner_id: text(fd.get("owner_id")) || null,
  });
  return result(error, "Pemilik stan diperbarui.");
}

// ======================== PENGGUNA & SALDO =========================

export async function setUserRole(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const role = text(fd.get("role")) as UserRole;
  if (!["admin", "penjual", "siswa"].includes(role)) return { error: "Peran tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", { p_user_id: text(fd.get("user_id")), p_role: role });
  return result(error, "Peran diperbarui.");
}

export async function topUpBalance(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("top_up_balance", {
    p_student_id: text(fd.get("student_id")),
    p_amount: int(fd.get("amount")),
  });
  return result(error, "Saldo berhasil ditambahkan.");
}
