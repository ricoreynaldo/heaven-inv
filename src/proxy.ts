import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth/session";

/**
 * Pemeriksaan awal (optimistic) untuk area admin: tanpa token valid, halaman
 * admin dialihkan ke login dan API admin mendapat 401. Otorisasi sebenarnya
 * tetap dilakukan requireAdmin()/getCurrentAdmin() di setiap halaman,
 * server action, dan route handler.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);

  if (pathname.startsWith("/api/admin")) {
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    // requireAdmin() mengirim ke sini dengan ?expired=1 bila token masih sah
    // secara kriptografis tapi akunnya sudah tidak valid: hapus cookie agar
    // tidak terjadi redirect bolak-balik.
    if (request.nextUrl.searchParams.has("expired")) {
      const response = NextResponse.next();
      response.cookies.delete(ADMIN_COOKIE);
      return response;
    }
    return session ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }

  if (!session) {
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
