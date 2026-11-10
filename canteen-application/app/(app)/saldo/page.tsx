import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, Empty, PageHeader } from "../ui";

export const metadata: Metadata = { title: "Saldo Saya · KantinKu" };

type Mutation = { id: string; at: string; label: string; amount: number };

export default async function SaldoPage() {
  const profile = await requireRole(["siswa"]);
  const supabase = await createClient();
  const [topups, orders] = await Promise.all([
    supabase.from("balance_topups").select("id, amount, created_at").eq("student_id", profile.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("orders").select("id, total, status, created_at, stalls(name)").eq("student_id", profile.id).order("created_at", { ascending: false }).limit(30),
  ]);

  const mutations: Mutation[] = [
    ...(topups.data ?? []).map((t) => ({ id: `t${t.id}`, at: t.created_at, label: "Top up saldo", amount: t.amount })),
    ...((orders.data ?? []) as unknown as { id: number; total: number; status: string; created_at: string; stalls: { name: string } | null }[]).map((o) => ({
      id: `o${o.id}`,
      at: o.created_at,
      label: `Pesanan #${o.id}${o.stalls ? ` · ${o.stalls.name}` : ""}${o.status === "dibatalkan" ? " (dibatalkan, dikembalikan)" : ""}`,
      amount: o.status === "dibatalkan" ? 0 : -o.total,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Saldo Saya 💳" subtitle="Saldo dipakai untuk bayar pesanan jajan." />
      <section className="rounded-3xl bg-gradient-to-r from-violet-600 to-violet-500 p-6 text-white">
        <p className="text-sm text-violet-100">Saldo saat ini</p>
        <p className="mt-1 text-4xl font-bold">{formatRupiah(profile.balance)}</p>
        <p className="mt-3 text-sm text-violet-100">
          Mau top up? Datang ke admin kantin, sebutkan email <b>{profile.email}</b>.
        </p>
      </section>

      <Card>
        <CardTitle title="Riwayat saldo" subtitle="30 transaksi terakhir" />
        {mutations.length === 0 ? (
          <div className="mt-4"><Empty icon="📭">Belum ada transaksi.</Empty></div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {mutations.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.label}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(m.at)}</p>
                </div>
                <span className={`shrink-0 font-semibold ${m.amount > 0 ? "text-emerald-600" : m.amount < 0 ? "text-slate-700" : "text-slate-400"}`}>
                  {m.amount > 0 ? "+" : m.amount < 0 ? "−" : ""}
                  {formatRupiah(Math.abs(m.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
