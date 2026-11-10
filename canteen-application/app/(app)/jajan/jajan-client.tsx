"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { formatRupiah } from "@/lib/format";
import type { MenuItem, Stall } from "@/lib/types";
import { placeOrder } from "../actions";

type StallWithMenu = Stall & { menu_items: MenuItem[] };

export function JajanClient({ stalls, balance }: { stalls: StallWithMenu[]; balance: number }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const items = useMemo(() => new Map(stalls.flatMap((s) => s.menu_items.map((m) => [m.id, m]))), [stalls]);
  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ item: items.get(Number(id))!, qty }))
    .filter((l) => l.item && l.qty > 0);
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const enough = balance >= total;

  const change = (m: MenuItem, delta: number) =>
    setCart((c) => {
      const qty = Math.max(0, Math.min(m.stock, 20, (c[m.id] ?? 0) + delta));
      return { ...c, [m.id]: qty };
    });

  const checkout = () => {
    setError(undefined);
    startTransition(async () => {
      const res = await placeOrder(
        lines.map((l) => ({ menu_item_id: l.item.id, qty: l.qty })),
        note,
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      setCart({});
      router.push("/pesanan");
    });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {stalls.length === 0 && <p className="text-sm text-slate-500">Belum ada stan.</p>}
        {stalls.map((s) => (
          <section key={s.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{s.emoji}</span>
              <div className="flex-1">
                <h2 className="font-semibold">{s.name}</h2>
                {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
              </div>
              {!s.is_open && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Tutup</span>}
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {s.menu_items
                .slice().sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => {
                  const soldOut = !m.is_available || m.stock === 0;
                  const disabled = soldOut || !s.is_open;
                  const qty = cart[m.id] ?? 0;
                  return (
                    <li key={m.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${qty ? "border-emerald-300 bg-emerald-50/50" : "border-slate-100"} ${disabled ? "opacity-50" : ""}`}>
                      <span className="text-2xl">{m.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatRupiah(m.price)} · {soldOut ? "habis" : `sisa ${m.stock}`}
                        </p>
                      </div>
                      {!disabled && (
                        <div className="flex items-center gap-1">
                          {qty > 0 && (
                            <>
                              <QtyButton onClick={() => change(m, -1)} label={`Kurangi ${m.name}`}>−</QtyButton>
                              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                            </>
                          )}
                          <QtyButton onClick={() => change(m, 1)} label={`Tambah ${m.name}`} disabled={qty >= m.stock}>+</QtyButton>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>

      <aside className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:sticky lg:top-8">
        <h2 className="font-semibold">🧺 Keranjang</h2>
        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Belum ada menu dipilih.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((l) => (
              <li key={l.item.id} className="flex justify-between gap-2">
                <span>{l.item.emoji} {l.qty}× {l.item.name}</span>
                <span className="shrink-0 text-slate-500">{formatRupiah(l.item.price * l.qty)}</span>
              </li>
            ))}
          </ul>
        )}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="Catatan (opsional), mis. tidak pedas"
          className="mt-4 w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <dl className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Saldo</dt><dd>{formatRupiah(balance)}</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatRupiah(total)}</dd></div>
          {lines.length > 0 && (
            <div className={`flex justify-between ${enough ? "text-slate-500" : "text-red-600"}`}>
              <dt>Sisa saldo</dt><dd>{formatRupiah(balance - total)}</dd>
            </div>
          )}
        </dl>
        {!enough && <p className="mt-3 text-xs text-red-600">Saldo tidak cukup. Minta top up ke admin kantin.</p>}
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">⚠️ {error}</p>}
        <button
          type="button"
          onClick={checkout}
          disabled={pending || lines.length === 0 || !enough}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Memproses..." : `Pesan · ${formatRupiah(total)}`}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">Pesanan dari beberapa stan dipisah per stan.</p>
      </aside>
    </div>
  );
}

function QtyButton({ children, onClick, label, disabled }: { children: React.ReactNode; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
