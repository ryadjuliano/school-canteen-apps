import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MenuItem, Stall } from "@/lib/types";
import { PageHeader } from "../ui";
import { JajanClient } from "./jajan-client";

export const metadata: Metadata = { title: "Pesan Jajan · KantinKu" };

export default async function JajanPage() {
  const profile = await requireRole(["siswa"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("stalls")
    .select("id, name, emoji, description, owner_id, is_open, menu_items(id, stall_id, name, emoji, price, stock, is_available)")
    .order("name");
  const stalls = (data ?? []) as (Stall & { menu_items: MenuItem[] })[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Pesan Jajan 🛒" subtitle="Pilih menu, bayar pakai saldo, ambil di stan saat siap." />
      <JajanClient stalls={stalls} balance={profile.balance} />
    </div>
  );
}
