import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request }); const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => {
    items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  } } });
  // Netlify ejecuta este código en Edge. Si Supabase tarda, no dejamos que
  // la renovación de sesión agote el tiempo máximo de toda la navegación.
  await Promise.race([
    supabase.auth.getUser().catch(()=>null),
    new Promise<null>(resolve=>setTimeout(()=>resolve(null),4000)),
  ]);
  return response;
}
