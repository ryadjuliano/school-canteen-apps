import type { Metadata } from "next";
import { DUMMY_ADMIN } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import {
  BEST_SELLERS,
  LOW_STOCK,
  ORDERS_PER_HOUR,
  TODAY_ORDERS,
  TODAY_STATS,
  orderTotal,
  type OrderStatus,
} from "@/lib/dummy-data";

export const metadata: Metadata = { title: "Dashboard · KantinKu" };

const STATUS_STYLE: Record<OrderStatus, string> = {
  Menunggu: "bg-amber-100 text-amber-800",
  Disiapkan: "bg-sky-100 text-sky-800",
  "Siap diambil": "bg-emerald-100 text-emerald-800",
  Selesai: "bg-slate-100 text-slate-600",
};

const STATUS_ICON: Record<OrderStatus, string> = {
  Menunggu: "⏳",
  Disiapkan: "👩‍🍳",
  "Siap diambil": "✅",
  Selesai: "✔️",
};

export default function DashboardPage() {
  const waiting = TODAY_ORDERS.filter((o) => o.status === "Menunggu").length;
  const maxPerHour = Math.max(...ORDERS_PER_HOUR.map((h) => h.orders));
  const maxSold = BEST_SELLERS[0].sold;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Sapaan */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white sm:p-8">
        <span className="absolute -right-4 -bottom-6 hidden text-9xl opacity-25 select-none sm:block">
          🍱
        </span>
        <p className="text-sm text-emerald-100">Data dummy · Hari ini</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Selamat datang, {DUMMY_ADMIN.name}! 👋
        </h1>
        <p className="mt-2 max-w-xl text-emerald-50">
          Istirahat kedua mulai pukul 12.00. Ada{" "}
          <span className="rounded-md bg-white/20 px-1.5 font-semibold">{waiting} pesanan</span>{" "}
          menunggu disiapkan.
        </p>
      </section>

      {/* Statistik */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon="💰"
          tint="bg-emerald-100"
          label="Pendapatan hari ini"
          value={formatRupiah(TODAY_STATS.revenue)}
          note={`▲ ${TODAY_STATS.revenueChange}% dari kemarin`}
          noteClass="text-emerald-700"
        />
        <Stat icon="🧾" tint="bg-amber-100" label="Pesanan hari ini" value={TODAY_STATS.orders} note="dari 4 stan kantin" />
        <Stat
          icon="🎒"
          tint="bg-sky-100"
          label="Siswa jajan"
          value={TODAY_STATS.students}
          note={`dari ${TODAY_STATS.studentsTotal} siswa terdaftar`}
        />
        <Stat
          icon="💳"
          tint="bg-violet-100"
          label="Total saldo siswa"
          value={formatRupiah(TODAY_STATS.balance)}
          note="saldo jajan yang belum dipakai"
        />
      </section>

      {/* Grafik + menu terlaris */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle title="Pesanan per jam" subtitle="Ramai saat jam istirahat" />
          <div className="mt-6 flex h-52 items-end gap-2 border-b border-slate-200 sm:gap-4">
            {ORDERS_PER_HOUR.map((h) => (
              <div key={h.hour} className="group relative flex h-full flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-12 rounded-t-lg transition ${
                    h.recess ? "bg-emerald-500" : "bg-emerald-200 group-hover:bg-emerald-300"
                  }`}
                  style={{ height: `${(h.orders / maxPerHour) * 100}%` }}
                />
                <div className="pointer-events-none absolute -top-2 z-10 hidden -translate-y-full rounded-xl bg-slate-900 px-3 py-2 text-xs whitespace-nowrap text-white group-hover:block">
                  <p className="font-semibold">{h.hour}.00 – {h.hour}.59</p>
                  <p>{h.orders} pesanan</p>
                  {h.recess && <p className="text-emerald-300">Jam istirahat</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 sm:gap-4">
            {ORDERS_PER_HOUR.map((h) => (
              <span key={h.hour} className="flex-1 text-center text-xs text-slate-500">
                {h.hour}.00
              </span>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span className="h-3 w-3 rounded bg-emerald-500" /> Jam istirahat
            <span className="ml-3 h-3 w-3 rounded bg-emerald-200" /> Jam pelajaran
          </p>
        </Card>

        <Card>
          <CardTitle title="Menu terlaris" subtitle="Hari ini" />
          <ul className="mt-5 space-y-4">
            {BEST_SELLERS.map((m, i) => (
              <li key={m.name} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
                  {m.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-medium">
                      {i === 0 && "🏆 "}
                      {m.name}
                    </span>
                    <span className="shrink-0 text-slate-500">{m.sold}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(m.sold / maxSold) * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Pesanan */}
      <section>
        <Card className="overflow-hidden p-0">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle title="Pesanan terbaru" subtitle="Istirahat pertama" />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Siswa</th>
                  <th className="px-3 py-3 font-medium">Pesanan</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TODAY_ORDERS.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3">
                      <p className="font-medium whitespace-nowrap">{o.student}</p>
                      <p className="text-xs text-slate-500">
                        {o.className} · {o.time}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p>{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                      <p className="text-xs text-slate-500">{o.stall}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_STYLE[o.status]}`}
                      >
                        {STATUS_ICON[o.status]} {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">
                      {formatRupiah(orderTotal(o))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Stok + tips */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle title="Stok hampir habis" subtitle="Segera isi ulang" />
          <ul className="mt-5 space-y-3">
            {LOW_STOCK.map((s) => (
              <li key={s.name} className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-3">
                <span className="text-2xl">{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-slate-500">{s.stall}</p>
                </div>
                <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                  sisa {s.left}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex items-center rounded-3xl bg-sky-50 p-6 text-sm text-sky-900">
          <p>
            💡 <span className="font-semibold">Tips:</span> tambahkan buah dan susu
            ke menu supaya pilihan jajan siswa lebih sehat.
          </p>
        </div>
      </section>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function Stat({
  icon,
  tint,
  label,
  value,
  note,
  noteClass = "text-slate-500",
}: {
  icon: string;
  tint: string;
  label: string;
  value: string | number;
  note: string;
  noteClass?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${tint}`}>
          {icon}
        </span>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className={`mt-1 text-xs ${noteClass}`}>{note}</p>
    </Card>
  );
}
