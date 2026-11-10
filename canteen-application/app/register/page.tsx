import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Daftar · KantinKu" };

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-xl">
            🍽️
          </span>
          <span className="text-xl font-bold text-slate-800">
            Kantin<span className="text-emerald-600">Ku</span>
          </span>
        </div>
        <h1 className="text-2xl font-bold">Buat akun baru ✨</h1>
        <p className="mt-1 text-slate-500">Daftar untuk mulai jajan di kantin sekolah.</p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
