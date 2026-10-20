"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DUMMY_ADMIN, SESSION_COOKIE } from "@/lib/auth";

export type LoginState = { error?: string; email?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));

  if (email !== DUMMY_ADMIN.email || password !== DUMMY_ADMIN.password) {
    return { email, error: "Email atau password salah. Coba lagi ya!" };
  }

  (await cookies()).set(SESSION_COOKIE, "admin", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 jam, satu hari sekolah
  });
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
