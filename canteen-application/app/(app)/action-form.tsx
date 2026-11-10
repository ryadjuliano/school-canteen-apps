"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/types";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
};

// Form kecil untuk server action: menampilkan pesan error/sukses & status loading.
export function ActionForm({ action, children, className = "", confirm }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state.error && <p className="mt-2 w-full text-xs text-red-600">⚠️ {state.error}</p>}
      {state.success && <p className="mt-2 w-full text-xs text-emerald-700">✅ {state.success}</p>}
    </form>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
}) {
  const style = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    ghost: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  }[variant];
  return (
    <button
      type="submit"
      className={`rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition disabled:opacity-50 ${style}`}
    >
      {children}
    </button>
  );
}
