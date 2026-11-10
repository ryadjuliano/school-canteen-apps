"use client";

import { useActionState } from "react";
import { register, type RegisterState } from "../login/actions";

const input =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500";

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(register, {});
  const v = state.values;

  return (
    <form action={action} className="mt-8 space-y-4" key={JSON.stringify(v)}>
      <Field label="Nama lengkap">
        <input name="full_name" required autoComplete="name" placeholder="Alya Putri" defaultValue={v?.full_name} className={input} />
      </Field>
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" placeholder="nama@sekolah.sch.id" defaultValue={v?.email} className={input} />
      </Field>
      <Field label="Kelas (opsional)">
        <input name="class_name" placeholder="XI IPA-1" defaultValue={v?.class_name} className={input} />
      </Field>
      <Field label="Password">
        <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Minimal 8 karakter" className={input} />
      </Field>
      <Field label="Ulangi password">
        <input name="confirm_password" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" className={input} />
      </Field>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {state.error}</p>
      )}
      {state.success && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">✅ {state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Sebentar ya..." : "Daftar"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
