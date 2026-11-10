import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES, ORDER_SELECT, type Order, type Profile } from "@/lib/types";
import { ButtonLink, Card, CardTitle, Empty, Hero, OrderRow } from "../ui";

export async function SiswaDashboard({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const orders = (data ?? []) as unknown as Order[];
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const ready = active.filter((o) => o.status === "siap_diambil");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Hero eyebrow={`Siswa${profile.class_name ? ` · ${profile.class_name}` : ""}`} title={`Hai, ${profile.full_name}! 👋`}>
        {ready.length > 0
          ? `🔔 ${ready.length} pesananmu sudah siap diambil!`
          : "Lapar? Pesan jajan sekarang, ambil saat istirahat tanpa antre."}
      </Hero>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">💳 Saldo jajan</p>
          <p className="mt-3 text-3xl font-bold">{formatRupiah(profile.balance)}</p>
          <p className="mt-1 text-xs text-slate-500">Top up saldo di admin kantin.</p>
          <Link href="/saldo" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">Riwayat saldo →</Link>
        </Card>
        <Card className="flex flex-col justify-between bg-amber-50">
          <div>
            <p className="text-sm text-amber-800">🛒 Mau jajan apa hari ini?</p>
            <p className="mt-2 text-sm text-slate-600">Pilih menu dari semua stan yang buka.</p>
          </div>
          <div className="mt-4"><ButtonLink href="/jajan">Pesan jajan</ButtonLink></div>
        </Card>
      </section>

      <Card>
        <CardTitle
          title="Pesanan aktif"
          subtitle="Pantau sampai siap diambil"
          action={<Link href="/pesanan" className="text-sm font-medium text-emerald-700 hover:underline">Semua →</Link>}
        />
        {active.length === 0 ? (
          <div className="mt-4"><Empty icon="🍽️">Belum ada pesanan aktif.</Empty></div>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {active.map((o) => <OrderRow key={o.id} order={o} showStall />)}
          </ul>
        )}
      </Card>
    </div>
  );
}
