"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Email belum dikonfirmasi. Cek kotak masuk email kamu ya!"
        : "Email atau password salah. Coba lagi ya!";
    return { email, error: message };
  }

  redirect("/dashboard");
}

export type RegisterState = {
  error?: string;
  success?: string;
  values?: { full_name: string; email: string; class_name: string };
};

export async function register(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values = {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    class_name: String(formData.get("class_name") ?? "").trim(),
  };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (values.full_name.length < 2) {
    return { values, error: "Nama lengkap minimal 2 karakter." };
  }
  if (password.length < 8) {
    return { values, error: "Password minimal 8 karakter." };
  }
  if (password !== confirm) {
    return { values, error: "Konfirmasi password tidak sama." };
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: {
      // Dibaca trigger handle_new_user untuk mengisi tabel profiles.
      data: { full_name: values.full_name, class_name: values.class_name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    const message =
      error.code === "user_already_exists"
        ? "Email ini sudah terdaftar. Silakan masuk."
        : error.code === "weak_password"
          ? "Password terlalu lemah, coba yang lebih kuat."
          : "Gagal mendaftar. Coba lagi sebentar lagi.";
    return { values, error: message };
  }

  // Jika "Confirm email" aktif di Supabase, sesi belum ada sampai email dikonfirmasi.
  if (!data.session) {
    return {
      values,
      success: "Pendaftaran berhasil! Cek email kamu untuk konfirmasi akun, lalu masuk.",
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
