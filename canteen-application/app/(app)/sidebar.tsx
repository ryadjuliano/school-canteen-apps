"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavItem } from "@/lib/nav";



export function Sidebar({ items, footer }: { items: NavItem[]; footer: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bar atas di HP */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white p-5 shadow-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none lg:border-r lg:border-slate-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="text-slate-400 lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Menu
          </p>
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">{footer}</div>
      </aside>
    </>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-lg">
        🍽️
      </span>
      <span className="text-lg font-bold">
        Kantin<span className="text-emerald-600">Ku</span>
      </span>
    </span>
  );
}
