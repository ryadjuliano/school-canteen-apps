import Link from "next/link";
import { formatRupiah, hourWib, startOfTodayWib } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES, ORDER_SELECT, type MenuItem, type Order, type Profile } from "@/lib/types";
import { Card, CardTitle, Empty, Hero, OrderRow, Stat } from "../ui";

export async function AdminDashboard({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const [ordersRes, studentsRes, lowStockRes, stallsRes] = await Promise.all([
    supabase.from("orders").select(ORDER_SELECT).gte("created_at", startOfTodayWib()).order("created_at", { ascending: false }),
    supabase.from("profiles").select("balance").eq("role", "siswa"),
    supabase.from("menu_items").select("id, name, emoji, stock, stalls(name)").lte("stock", 5).order("stock").limit(6),
    supabase.from("stalls").select("id, is_open"),
  ]);

  const orders = (ordersRes.data ?? []) as unknown as Order[];
  const valid = orders.filter((o) => o.status !== "dibatalkan");
  const students = studentsRes.data ?? [];
  const lowStock = (lowStockRes.data ?? []) as unknown as (MenuItem & { stalls: { name: string } | null })[];
  const stalls = stallsRes.data ?? [];

  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const waiting = orders.filter((o) => o.status === "menunggu").length;
  const buyers = new Set(valid.map((o) => o.student_id)).size;
  const totalBalance = students.reduce((s, p) => s + p.balance, 0);

  // Pesanan per jam (06–15 WIB)
  const hours = Array.from({ length: 10 }, (_, i) => i + 6);
  const perHour = hours.map((h) => ({ hour: h, count: valid.filter((o) => hourWib(o.created_at) === h).length }));
  const maxPerHour = Math.max(1, ...perHour.map((h) => h.count));

  // Menu terlaris hari ini
  const sold = new Map<string, { name: string; emoji: string; qty: number }>();
  valid.flatMap((o) => o.order_items).forEach((i) => {
    const cur = sold.get(i.name) ?? { name: i.name, emoji: i.emoji, qty: 0 };
    cur.qty += i.qty;
    sold.set(i.name, cur);
  });
  const best = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const maxSold = best[0]?.qty ?? 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Hero eyebrow="Admin Kantin · Hari ini" title={`Selamat datang, ${profile.full_name}! 👋`}>
        Ada <span className="rounded-md bg-white/20 px-1.5 font-semibold">{waiting} pesanan</span> menunggu
        disiapkan dan {orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length} pesanan aktif.
      </Hero>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon="💰" tint="bg-emerald-100" label="Pendapatan hari ini" value={formatRupiah(revenue)} note="tanpa pesanan batal" />
        <Stat
          icon="🧾"
          tint="bg-amber-100"
          label="Pesanan hari ini"
          value={valid.length}
          note={`${stalls.filter((s) => s.is_open).length} dari ${stalls.length} stan buka`}
        />
        <Stat icon="🎒" tint="bg-sky-100" label="Siswa jajan" value={buyers} note={`dari ${students.length} siswa terdaftar`} />
        <Stat icon="💳" tint="bg-violet-100" label="Total saldo siswa" value={formatRupiah(totalBalance)} note="saldo jajan yang belum dipakai" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle title="Pesanan per jam" subtitle="Hari ini (WIB)" />
          <div className="mt-6 flex h-52 items-end gap-2 border-b border-slate-200 sm:gap-4">
            {perHour.map((h) => (
              <div key={h.hour} className="group relative flex h-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-12 rounded-t-lg bg-emerald-400 transition group-hover:bg-emerald-500"
                  style={{ height: `${(h.count / maxPerHour) * 100}%`, minHeight: h.count ? 4 : 0 }}
                />
                <div className="pointer-events-none absolute -top-2 z-10 hidden -translate-y-full rounded-xl bg-slate-900 px-3 py-2 text-xs whitespace-nowrap text-white group-hover:block">
                  {String(h.hour).padStart(2, "0")}.00 · {h.count} pesanan
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 sm:gap-4">
            {perHour.map((h) => (
              <span key={h.hour} className="flex-1 text-center text-xs text-slate-500">
                {String(h.hour).padStart(2, "0")}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle title="Menu terlaris" subtitle="Hari ini" />
          {best.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">Belum ada penjualan hari ini.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {best.map((m, i) => (
                <li key={m.name} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">{m.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{i === 0 && "🏆 "}{m.name}</span>
                      <span className="shrink-0 text-slate-500">{m.qty}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${(m.qty / maxSold) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle
            title="Pesanan terbaru"
            subtitle="Hari ini"
            action={<Link href="/pesanan" className="text-sm font-medium text-emerald-700 hover:underline">Lihat semua →</Link>}
          />
          {orders.length === 0 ? (
            <div className="mt-4"><Empty icon="🧾">Belum ada pesanan hari ini.</Empty></div>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {orders.slice(0, 6).map((o) => <OrderRow key={o.id} order={o} showStall />)}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle
            title="Stok hampir habis"
            subtitle="Sisa 5 atau kurang"
            action={<Link href="/menu" className="text-sm font-medium text-emerald-700 hover:underline">Kelola →</Link>}
          />
          {lowStock.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">Semua stok aman 👍</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {lowStock.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">{s.stalls?.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">sisa {s.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
