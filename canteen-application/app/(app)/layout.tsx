import { Suspense } from "react";
import { getCurrentProfile } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import { Sidebar } from "./sidebar";
import { UserCard } from "./user-card";

// Layout untuk semua halaman setelah login. Menu sidebar mengikuti peran user.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar items={NAV[profile.role]} footer={<UserCard profile={profile} />} />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="hidden w-64 border-r border-slate-200 bg-white lg:block" />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto h-40 max-w-6xl animate-pulse rounded-3xl bg-slate-100" />
      </main>
    </div>
  );
}
