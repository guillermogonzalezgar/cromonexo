import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
export async function middleware(request: NextRequest) { return updateSession(request); }
export const config = { matcher: [
  "/inicio/:path*",
  "/mi-coleccion/:path*",
  "/mis-matches/:path*",
  "/mercado/:path*",
  "/perfil/:path*",
  "/propuestas/:path*",
] };
