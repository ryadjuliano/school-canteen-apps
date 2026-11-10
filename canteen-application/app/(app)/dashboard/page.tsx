import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/auth";
import { AdminDashboard } from "./admin-dashboard";
import { PenjualDashboard } from "./penjual-dashboard";
import { SiswaDashboard } from "./siswa-dashboard";

export const metadata: Metadata = { title: "Dashboard · KantinKu" };

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  if (profile.role === "admin") return <AdminDashboard profile={profile} />;
  if (profile.role === "penjual") return <PenjualDashboard profile={profile} />;
  return <SiswaDashboard profile={profile} />;
}
