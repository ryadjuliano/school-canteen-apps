import Link from "next/link";
import { formatRupiah, formatTime } from "@/lib/format";
import { STATUS_META, type Order, type OrderStatus } from "@/lib/types";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Hero({ eyebrow, title, children, emoji = "🍱" }: { eyebrow: string; title: string; children?: React.ReactNode; emoji?: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white sm:p-8">
      <span className="absolute -right-4 -bottom-6 hidden text-9xl opacity-25 select-none sm:block">{emoji}</span>
      <p className="text-sm text-emerald-100">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
      {children && <div className="relative mt-2 max-w-xl text-emerald-50">{children}</div>}
    </section>
  );
}

export function Stat({
  icon,
  tint,
  label,
  value,
  note,
}: {
  icon: string;
  tint: string;
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${tint}`}>{icon}</span>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </Card>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${m.style}`}>
      {m.icon} {m.label}
    </span>
  );
}

export function Empty({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
      <p className="text-4xl">{icon}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
    >
      {children}
    </Link>
  );
}

// Ringkasan pesanan singkat (dipakai di dashboard)
export function OrderRow({ order, showStall = false }: { order: Order; showStall?: boolean }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
        {order.stalls?.emoji ?? "🧾"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          #{order.id} · {order.student_name}
          {order.class_name && <span className="text-slate-500"> ({order.class_name})</span>}
        </p>
        <p className="truncate text-xs text-slate-500">
          {formatTime(order.created_at)} · {order.order_items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
          {showStall && order.stalls && ` · ${order.stalls.name}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <StatusBadge status={order.status} />
        <p className="mt-1 text-xs font-semibold">{formatRupiah(order.total)}</p>
      </div>
    </li>
  );
}

export const inputClass =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500";
