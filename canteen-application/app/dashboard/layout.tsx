import { Suspense } from "react";
import { UserCard, UserCardSkeleton } from "../components/user-card";
import { Sidebar } from "./sidebar";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar
        footer={
          <Suspense fallback={<UserCardSkeleton />}>
            <UserCard />
          </Suspense>
        }
      />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
