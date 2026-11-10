import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES, NEXT_STEP, ORDER_SELECT, type Order, type UserRole } from "@/lib/types";
import { ActionForm, SubmitButton } from "../action-form";
import { advanceOrder, cancelOrder } from "../actions";
import { ButtonLink, Card, Empty, PageHeader, StatusBadge } from "../ui";

export const metadata: Metadata = { title: "Pesanan · KantinKu" };

const TITLE: Record<UserRole, { title: string; subtitle: string }> = {
  admin: { title: "Semua Pesanan", subtitle: "Pantau dan bantu proses pesanan di semua stan." },
  penjual: { title: "Pesanan Masuk", subtitle: "Siapkan pesanan lalu tandai saat siap diambil." },
  siswa: { title: "Pesanan Saya", subtitle: "Pantau status pesananmu. Batalkan selama belum disiapkan." },
};

export default async function PesananPage({ searchParams }: PageProps<"/pesanan">) {
  const profile = await getCurrentProfile();
  const { tab } = await searchParams;
  const history = tab === "riwayat";

  // RLS otomatis membatasi: siswa = pesanannya, penjual = pesanan stannya, admin = semua.
  const supabase = await createClient();
  let query = supabase.from("orders").select(ORDER_SELECT);
  query = history
    ? query.in("status", ["selesai", "dibatalkan"]).order("created_at", { ascending: false }).limit(50)
    : query.in("status", ACTIVE_STATUSES).order("created_at", { ascending: true });
  const { data } = await query;
  const orders = (data ?? []) as unknown as Order[];

  const canProcess = profile.role !== "siswa";
  const { title, subtitle } = TITLE[profile.role];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={title} subtitle={subtitle}>
        {profile.role === "siswa" && <ButtonLink href="/jajan">🛒 Pesan lagi</ButtonLink>}
      </PageHeader>

      <div className="flex gap-2">
        {[
          { key: "aktif", label: "Aktif", href: "/pesanan" },
          { key: "riwayat", label: "Riwayat", href: "/pesanan?tab=riwayat" },
        ].map((t) => {
          const on = (t.key === "riwayat") === history;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`rounded-full px-4 py-2 text-sm font-medium ${on ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <Empty icon={history ? "📜" : "😌"}>
          {history ? "Belum ada riwayat pesanan." : "Tidak ada pesanan aktif saat ini."}
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((o) => (
            <Card key={o.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">#{o.id} · {formatDateTime(o.created_at)}</p>
                  <p className="mt-0.5 truncate font-semibold">
                    {profile.role === "siswa"
                      ? `${o.stalls?.emoji ?? ""} ${o.stalls?.name ?? "Stan"}`
                      : `${o.student_name}${o.class_name ? ` · ${o.class_name}` : ""}`}
                  </p>
                  {profile.role === "admin" && o.stalls && (
                    <p className="text-xs text-slate-500">{o.stalls.emoji} {o.stalls.name}</p>
                  )}
                </div>
                <StatusBadge status={o.status} />
              </div>

              <ul className="mt-4 space-y-1.5 text-sm">
                {o.order_items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span>{i.emoji} {i.qty}× {i.name}</span>
                    <span className="text-slate-500">{formatRupiah(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="h-4" />
              {o.note && <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">📝 {o.note}</p>}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <p className="font-bold">{formatRupiah(o.total)}</p>
                <div className="flex flex-wrap justify-end gap-2">
                  {o.status === "menunggu" && (
                    <ActionForm action={cancelOrder} confirm={`Batalkan pesanan #${o.id}?`}>
                      <input type="hidden" name="order_id" value={o.id} />
                      <SubmitButton variant="danger">Batalkan</SubmitButton>
                    </ActionForm>
                  )}
                  {canProcess && NEXT_STEP[o.status] && (
                    <ActionForm action={advanceOrder}>
                      <input type="hidden" name="order_id" value={o.id} />
                      <SubmitButton>{NEXT_STEP[o.status]}</SubmitButton>
                    </ActionForm>
                  )}
                  {!canProcess && o.status === "siap_diambil" && (
                    <span className="text-sm font-medium text-emerald-700">🔔 Ambil di stan</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
