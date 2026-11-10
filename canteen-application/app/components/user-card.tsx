import { getCurrentProfile, ROLE_LABEL } from "@/lib/auth";
import { logout } from "../login/actions";

// Kartu user di sidebar. Membaca sesi → bungkus dengan <Suspense>.
export async function UserCard() {
  const profile = await getCurrentProfile();

  return (
    <div className="rounded-2xl bg-emerald-50 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
          {profile.full_name.split(" ").at(-1)?.[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{profile.full_name}</p>
          <p className="truncate text-xs text-slate-500">{ROLE_LABEL[profile.role]}</p>
        </div>
      </div>
      <form action={logout} className="mt-3">
        <button className="w-full rounded-xl bg-white py-2 text-sm font-medium text-slate-600 hover:text-red-600">
          Keluar
        </button>
      </form>
    </div>
  );
}

export function UserCardSkeleton() {
  return <div className="h-[116px] animate-pulse rounded-2xl bg-emerald-50" />;
}

export async function UserName() {
  const profile = await getCurrentProfile();
  return <>{profile.full_name}</>;
}
