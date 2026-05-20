import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/auth");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  if (isPublicPath(pathname)) {
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (owner && user.email?.toLowerCase() !== owner) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "unauthorized");
    const res = NextResponse.redirect(url);
    res.cookies.getAll().forEach((c) => {
      if (c.name.startsWith("sb-")) {
        res.cookies.delete(c.name);
      }
    });
    return res;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
