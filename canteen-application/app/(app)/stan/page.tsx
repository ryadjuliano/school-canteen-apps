import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Stall } from "@/lib/types";
import { ActionForm, SubmitButton } from "../action-form";
import { assignStallOwner, createStall, toggleStall } from "../actions";
import { Card, CardTitle, inputClass, PageHeader } from "../ui";

export const metadata: Metadata = { title: "Stan Kantin · KantinKu" };

export default async function StanPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const [stallsRes, sellersRes] = await Promise.all([
    supabase.from("stalls").select("id, name, emoji, description, owner_id, is_open, menu_items(count)").order("name"),
    supabase.from("profiles").select("id, full_name, email").eq("role", "penjual").order("full_name"),
  ]);
  const stalls = (stallsRes.data ?? []) as unknown as (Stall & { menu_items: { count: number }[] })[];
  const sellers = sellersRes.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Stan Kantin 🏪" subtitle="Tambah stan, tautkan penjual, dan atur buka/tutup." />

      {sellers.length === 0 && (
        <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
          💡 Belum ada user ber-peran penjual. Ubah peran user di{" "}
          <Link href="/pengguna" className="font-semibold underline">Pengguna &amp; Saldo</Link>.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {stalls.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start gap-3">
              <span className="text-4xl">{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {s.description ?? "—"} · {s.menu_items[0]?.count ?? 0} menu
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.is_open ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
                {s.is_open ? "Buka" : "Tutup"}
              </span>
            </div>

            <ActionForm action={assignStallOwner} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="stall_id" value={s.id} />
              <label className="min-w-0 flex-1 space-y-1">
                <span className="block text-xs font-medium text-slate-500">Penjual</span>
                <select name="owner_id" defaultValue={s.owner_id ?? ""} className={inputClass}>
                  <option value="">— Belum ada —</option>
                  {sellers.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                  ))}
                </select>
              </label>
              <SubmitButton variant="ghost">Simpan</SubmitButton>
            </ActionForm>

            <div className="mt-3 flex gap-2">
              <ActionForm action={toggleStall}>
                <input type="hidden" name="stall_id" value={s.id} />
                <input type="hidden" name="is_open" value={String(!s.is_open)} />
                <SubmitButton variant={s.is_open ? "danger" : "primary"}>{s.is_open ? "Tutup stan" : "Buka stan"}</SubmitButton>
              </ActionForm>
              <Link href={`/menu?stall=${s.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Kelola menu →
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle title="➕ Tambah stan" />
        <ActionForm action={createStall} className="mt-4 grid items-end gap-3 sm:grid-cols-[64px_1fr_1fr_auto]">
          <label className="space-y-1"><span className="block text-xs font-medium text-slate-500">Emoji</span>
            <input name="emoji" defaultValue="🏪" maxLength={4} className={`${inputClass} text-center`} /></label>
          <label className="space-y-1"><span className="block text-xs font-medium text-slate-500">Nama stan</span>
            <input name="name" required minLength={2} placeholder="Warung Bu Siti" className={inputClass} /></label>
          <label className="space-y-1"><span className="block text-xs font-medium text-slate-500">Deskripsi</span>
            <input name="description" placeholder="Gorengan & minuman" className={inputClass} /></label>
          <SubmitButton>Tambah</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
