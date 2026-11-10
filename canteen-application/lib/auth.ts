import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "penjual" | "siswa";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  class_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin Kantin",
  penjual: "Penjual",
  siswa: "Siswa",
};

// Ambil profil user yang sedang login. Redirect ke /login jika belum login.
// Membaca cookie, jadi pemanggilnya harus berada di dalam <Suspense>.
export async function getCurrentProfile(): Promise<Profile> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, class_name, phone, avatar_url")
    .eq("id", userId)
    .single<Profile>();

  if (!profile) redirect("/login");
  return profile;
}
