import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type Profile, type UserRole } from "@/lib/types";
import { ActionForm, SubmitButton } from "../action-form";
import { setUserRole, topUpBalance } from "../actions";
import { Card, Empty, inputClass, PageHeader } from "../ui";

export const metadata: Metadata = { title: "Pengguna & Saldo · KantinKu" };

const ROLES: UserRole[] = ["siswa", "penjual", "admin"];

export default async function PenggunaPage({ searchParams }: PageProps<"/pengguna">) {
  const me = await requireRole(["admin"]);
  const { q = "", role = "" } = (await searchParams) as { q?: string; role?: string };

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role, class_name, phone, avatar_url, balance")
    .order("full_name")
    .limit(100);
  if (ROLES.includes(role as UserRole)) query = query.eq("role", role);
  const search = q.trim().replace(/[,()%]/g, "");
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,class_name.ilike.%${search}%`);
  const { data } = await query;
  const users = (data ?? []) as Profile[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Pengguna & Saldo 👥" subtitle="Atur peran pengguna dan top up saldo jajan siswa." />

      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Cari nama, email, atau kelas..." className={`${inputClass} max-w-sm flex-1`} />
        <select name="role" defaultValue={role} className={`${inputClass} w-auto`}>
          <option value="">Semua peran</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Cari</button>
        {(q || role) && <Link href="/pengguna" className="px-2 py-2 text-sm text-slate-500 hover:underline">Reset</Link>}
      </form>

      {users.length === 0 ? (
        <Empty icon="🔍">Tidak ada pengguna yang cocok.</Empty>
      ) : (
        <Card className="overflow-hidden p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[1fr_auto_auto] lg:items-start">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {u.full_name} {u.id === me.id && <span className="text-xs text-emerald-700">(kamu)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {u.email}
                    {u.class_name && ` · ${u.class_name}`}
                  </p>
                  {u.role === "siswa" && <p className="mt-1 text-sm font-semibold text-violet-700">💳 {formatRupiah(u.balance)}</p>}
                </div>

                {u.id === me.id ? (
                  <span className="self-center text-sm text-slate-500">{ROLE_LABEL[u.role]}</span>
                ) : (
                  <ActionForm action={setUserRole} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="user_id" value={u.id} />
                    <select name="role" defaultValue={u.role} className={`${inputClass} w-auto`}>
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                    <SubmitButton variant="ghost">Ubah peran</SubmitButton>
                  </ActionForm>
                )}

                {u.role === "siswa" ? (
                  <ActionForm action={topUpBalance} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="student_id" value={u.id} />
                    <input name="amount" type="number" required min={1000} max={1000000} step={1000} placeholder="Nominal" className={`${inputClass} w-32`} />
                    <SubmitButton>Top up</SubmitButton>
                  </ActionForm>
                ) : (
                  <span className="hidden lg:block lg:w-[212px]" />
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
