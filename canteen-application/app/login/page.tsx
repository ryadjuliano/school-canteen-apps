import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk · KantinKu" };

const FOODS = ["🍱", "🥪", "🍜", "🍌", "🥛", "🍙", "🥗", "🍎"];

export default function LoginPage() {
  return (
    <main className="grid flex-1 lg:grid-cols-2">
      {/* Panel ilustrasi */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 grid grid-cols-4 place-items-center gap-8 p-10 text-6xl opacity-15 select-none">
          {[...FOODS, ...FOODS].map((f, i) => (
            <span key={i} className={i % 2 ? "rotate-12" : "-rotate-12"}>
              {f}
            </span>
          ))}
        </div>

        <Logo light />

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-bold">
            Jajan sehat, antre lebih singkat. 🍱
          </h2>
          <p className="mt-4 text-emerald-50">
            Kelola menu, pesanan siswa, dan saldo jajan kantin sekolah dalam
            satu tempat.
          </p>
          <div className="mt-8 flex gap-3">
            {[
              ["24", "menu sehat"],
              ["4", "stan kantin"],
              ["600+", "siswa"],
            ].map(([n, label]) => (
              <div key={label} className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xl font-bold">{n}</p>
                <p className="text-xs text-emerald-50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-emerald-100">SMA Nusantara · Tahun ajaran 2026/2027</p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold">Halo, selamat datang! 👋</h1>
          <p className="mt-1 text-slate-500">Masuk ke panel admin kantin.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="relative flex items-center gap-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-xl">
        🍽️
      </span>
      <span className={`text-xl font-bold ${light ? "text-white" : "text-slate-800"}`}>
        Kantin<span className={light ? "text-amber-300" : "text-emerald-600"}>Ku</span>
      </span>
    </div>
  );
}
