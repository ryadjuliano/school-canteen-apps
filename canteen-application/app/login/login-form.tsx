"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "./actions";

const input =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <form action={action} className="mt-8 space-y-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@sekolah.sch.id"
            defaultValue={state.email}
            key={state.email}
            className={input}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${input} pr-20`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 text-xs font-medium text-emerald-700"
            >
              {showPassword ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
        </label>

        {state.error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Sebentar ya..." : "Masuk"}
        </button>
      </form>

      <div className="mt-8 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-sm">
        <p className="font-semibold text-amber-900">🔑 Akun demo</p>
        <p className="mt-1 text-amber-800">admin@kantinku.sch.id</p>
        <p className="text-amber-800">kantin123</p>
      </div>
    </>
  );
}
