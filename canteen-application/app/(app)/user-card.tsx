import { ROLE_LABEL, type Profile } from "@/lib/types";
import { logout } from "../login/actions";

export function UserCard({ profile }: { profile: Profile }) {
  return (
    <div className="rounded-2xl bg-emerald-50 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
          {profile.full_name.trim()[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{profile.full_name}</p>
          <p className="truncate text-xs text-slate-500">
            {ROLE_LABEL[profile.role]}
            {profile.class_name && ` · ${profile.class_name}`}
          </p>
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
