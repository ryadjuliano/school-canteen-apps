import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { MenuItem, Stall } from "@/lib/types";
import { ActionForm, SubmitButton } from "../action-form";
import { deleteMenuItem, saveMenuItem } from "../actions";
import { Card, CardTitle, Empty, inputClass, PageHeader } from "../ui";

export const metadata: Metadata = { title: "Menu · KantinKu" };

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  const profile = await requireRole(["admin", "penjual"]);
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  // Admin bisa pilih stan mana pun; penjual hanya stannya sendiri.
  const { data: stallData } = await supabase.from("stalls").select("id, name, emoji, description, owner_id, is_open").order("name");
  const allStalls = (stallData ?? []) as Stall[];
  const stalls = isAdmin ? allStalls : allStalls.filter((s) => s.owner_id === profile.id);

  if (stalls.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Menu & Stok" />
        <Empty icon="🏪">
          {isAdmin ? (
            <>Belum ada stan. <Link href="/stan" className="font-semibold text-emerald-700">Tambah stan dulu →</Link></>
          ) : (
            "Kamu belum terhubung ke stan. Minta admin kantin menautkan akunmu."
          )}
        </Empty>
      </div>
    );
  }

  const { stall: stallParam } = await searchParams;
  const stall = stalls.find((s) => String(s.id) === stallParam) ?? stalls[0];
  const { data } = await supabase
    .from("menu_items")
    .select("id, stall_id, name, emoji, price, stock, is_available")
    .eq("stall_id", stall.id)
    .order("name");
  const menu = (data ?? []) as MenuItem[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={isAdmin ? "Menu Makanan" : "Menu & Stok"}
        subtitle={isAdmin ? "Kelola menu dan stok semua stan." : `Atur menu, harga, dan stok ${stall.name}.`}
      />

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          {stalls.map((s) => (
            <Link
              key={s.id}
              href={`/menu?stall=${s.id}`}
              className={`rounded-full px-4 py-2 text-sm font-medium ${s.id === stall.id ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {s.emoji} {s.name}
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardTitle title="➕ Tambah menu" subtitle={`ke ${stall.emoji} ${stall.name}`} />
        <ActionForm action={saveMenuItem} className="mt-4 grid grid-cols-2 items-end gap-3 sm:grid-cols-[64px_1fr_120px_90px_auto]">
          <input type="hidden" name="stall_id" value={stall.id} />
          <input type="hidden" name="is_available" value="on" />
          <Field label="Emoji"><input name="emoji" defaultValue="🍱" maxLength={4} className={`${inputClass} text-center`} /></Field>
          <Field label="Nama menu"><input name="name" required minLength={2} placeholder="Nasi Uduk" className={inputClass} /></Field>
          <Field label="Harga (Rp)"><input name="price" type="number" required min={500} step={500} placeholder="10000" className={inputClass} /></Field>
          <Field label="Stok"><input name="stock" type="number" required min={0} defaultValue={20} className={inputClass} /></Field>
          <SubmitButton>Tambah</SubmitButton>
        </ActionForm>
      </Card>

      <Card className="p-0 sm:p-0">
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle title={`Daftar menu ${stall.name}`} subtitle="Ubah harga/stok lalu klik Simpan. Matikan “Dijual” untuk menyembunyikan sementara." />
        </div>
        {menu.length === 0 ? (
          <div className="p-6"><Empty icon="🍽️">Belum ada menu.</Empty></div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {menu.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-3 px-5 py-4 sm:px-6">
                <ActionForm action={saveMenuItem} className="grid flex-1 grid-cols-2 items-end gap-3 sm:grid-cols-[64px_1fr_120px_90px_auto_auto]">
                  <input type="hidden" name="id" value={m.id} />
                  <Field label="Emoji"><input name="emoji" defaultValue={m.emoji} maxLength={4} className={`${inputClass} text-center`} /></Field>
                  <Field label="Nama"><input name="name" defaultValue={m.name} required minLength={2} className={inputClass} /></Field>
                  <Field label={`Harga · ${formatRupiah(m.price)}`}><input name="price" type="number" defaultValue={m.price} min={500} step={500} required className={inputClass} /></Field>
                  <Field label="Stok">
                    <input name="stock" type="number" defaultValue={m.stock} min={0} required className={`${inputClass} ${m.stock <= 5 ? "border-red-300 bg-red-50" : ""}`} />
                  </Field>
                  <label className="flex h-[42px] items-center gap-2 text-sm">
                    <input type="checkbox" name="is_available" defaultChecked={m.is_available} className="h-4 w-4 accent-emerald-600" />
                    Dijual
                  </label>
                  <SubmitButton variant="ghost">Simpan</SubmitButton>
                </ActionForm>
                <ActionForm action={deleteMenuItem} confirm={`Hapus menu ${m.name}?`} className="self-end">
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton variant="danger">Hapus</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className="block truncate text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
