import Link from "next/link";
import { formatRupiah, startOfTodayWib } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES, ORDER_SELECT, type MenuItem, type Order, type Profile, type Stall } from "@/lib/types";
import { ActionForm, SubmitButton } from "../action-form";
import { toggleStall } from "../actions";
import { Card, CardTitle, Empty, Hero, OrderRow, Stat } from "../ui";

export async function PenjualDashboard({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const { data: stall } = await supabase
    .from("stalls")
    .select("id, name, emoji, description, owner_id, is_open")
    .eq("owner_id", profile.id)
    .maybeSingle<Stall>();

  if (!stall) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Hero eyebrow="Penjual" title={`Halo, ${profile.full_name}! 👋`} />
        <Empty icon="🏪">
          Kamu belum terhubung ke stan mana pun.
          <br />
          Minta admin kantin menautkan akunmu ke stan di menu <b>Stan Kantin</b>.
        </Empty>
      </div>
    );
  }

  const [ordersRes, menuRes] = await Promise.all([
    supabase.from("orders").select(ORDER_SELECT).eq("stall_id", stall.id).gte("created_at", startOfTodayWib()).order("created_at", { ascending: false }),
    supabase.from("menu_items").select("id, name, emoji, stock, is_available").eq("stall_id", stall.id).order("stock"),
  ]);
  const orders = (ordersRes.data ?? []) as unknown as Order[];
  const menu = (menuRes.data ?? []) as MenuItem[];
  const valid = orders.filter((o) => o.status !== "dibatalkan");
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const waiting = orders.filter((o) => o.status === "menunggu").length;
  const lowStock = menu.filter((m) => m.stock <= 5);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Hero eyebrow={`Penjual · ${stall.name}`} title={`Halo, ${profile.full_name}! 👋`} emoji={stall.emoji}>
        {waiting > 0 ? (
          <>Ada <span className="rounded-md bg-white/20 px-1.5 font-semibold">{waiting} pesanan baru</span> menunggu disiapkan.</>
        ) : (
          "Belum ada pesanan baru. Siap-siap jam istirahat!"
        )}
      </Hero>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Status stan</p>
          <p className={`mt-3 text-2xl font-bold ${stall.is_open ? "text-emerald-600" : "text-red-600"}`}>
            {stall.is_open ? "🟢 Buka" : "🔴 Tutup"}
          </p>
          <ActionForm action={toggleStall} className="mt-3">
            <input type="hidden" name="stall_id" value={stall.id} />
            <input type="hidden" name="is_open" value={String(!stall.is_open)} />
            <SubmitButton variant={stall.is_open ? "danger" : "primary"}>
              {stall.is_open ? "Tutup stan" : "Buka stan"}
            </SubmitButton>
          </ActionForm>
        </Card>
        <Stat icon="💰" tint="bg-emerald-100" label="Pendapatan hari ini" value={formatRupiah(valid.reduce((s, o) => s + o.total, 0))} />
        <Stat icon="🧾" tint="bg-amber-100" label="Pesanan hari ini" value={valid.length} note={`${active.length} masih aktif`} />
        <Stat icon="🍱" tint="bg-sky-100" label="Menu tersedia" value={menu.filter((m) => m.is_available && m.stock > 0).length} note={`dari ${menu.length} menu`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle
            title="Pesanan aktif"
            subtitle="Proses di halaman Pesanan Masuk"
            action={<Link href="/pesanan" className="text-sm font-medium text-emerald-700 hover:underline">Proses →</Link>}
          />
          {active.length === 0 ? (
            <div className="mt-4"><Empty icon="😌">Tidak ada pesanan aktif.</Empty></div>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {active.slice(0, 6).map((o) => <OrderRow key={o.id} order={o} />)}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle
            title="Stok hampir habis"
            subtitle="Sisa 5 atau kurang"
            action={<Link href="/menu" className="text-sm font-medium text-emerald-700 hover:underline">Isi stok →</Link>}
          />
          {lowStock.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">Semua stok aman 👍</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {lowStock.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-3">
                  <span className="text-2xl">{m.emoji}</span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{m.name}</p>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">sisa {m.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
