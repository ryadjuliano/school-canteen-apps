import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

// Ambil profil user yang sedang login (sekali per request).
// Redirect ke /login jika belum login. Membaca cookie → harus di dalam <Suspense>.
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, class_name, phone, avatar_url, balance")
    .eq("id", userId)
    .single<Profile>();

  if (!profile) redirect("/login");
  return profile;
});

// Pastikan user punya salah satu peran; kalau tidak, kembalikan ke dashboard.
export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}
