import { NextResponse, type NextRequest } from "next/server";
import { PROTECTED_PATHS } from "@/lib/nav";
import { updateSession } from "@/lib/supabase/proxy";

const AUTH_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { response, claims } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    // Bawa cookie sesi yang baru di-refresh ke response redirect.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!claims && PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return redirectTo("/login");
  }
  if (claims && AUTH_PAGES.includes(pathname)) {
    return redirectTo("/dashboard");
  }
  return response;
}

// Pemeriksaan peran dilakukan di tiap halaman (requireRole) dan di database (RLS).
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pesanan/:path*",
    "/jajan/:path*",
    "/saldo/:path*",
    "/menu/:path*",
    "/stan/:path*",
    "/pengguna/:path*",
    "/login",
    "/register",
  ],
};
