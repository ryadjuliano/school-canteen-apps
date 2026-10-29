import { DUMMY_ADMIN } from "@/lib/auth";
import { logout } from "../login/actions";
import { Sidebar } from "../dashboard/sidebar";

export default function PesananLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar
        footer={
          <div className="rounded-2xl bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
                {DUMMY_ADMIN.name.split(" ").at(-1)?.[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{DUMMY_ADMIN.name}</p>
                <p className="truncate text-xs text-slate-500">{DUMMY_ADMIN.role}</p>
              </div>
            </div>
            <form action={logout} className="mt-3">
              <button className="w-full rounded-xl bg-white py-2 text-sm font-medium text-slate-600 hover:text-red-600">
                Keluar
              </button>
            </form>
          </div>
        }
      />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
