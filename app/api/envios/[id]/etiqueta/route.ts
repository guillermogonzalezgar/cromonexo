import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isShippingAdmin} from "@/lib/shipping-admin";

export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "Inicia sesión."}, {status: 401});
  const {id} = await params;
  const admin = supabase;
  const {data: order} = await admin.from("market_orders").select("seller_id,payment_status,shipping_managed_by_platform").eq("id", id).single();
  if (!order || (order.seller_id !== user.id && !isShippingAdmin(user)) || !order.shipping_managed_by_platform || order.payment_status !== "paid") {
    return NextResponse.json({error: "Etiqueta no disponible."}, {status: 404});
  }
  const {data: details} = await admin.from("market_shipping_details").select("label_path").eq("order_id", id).single();
  if (!details?.label_path) return NextResponse.json({error: "La etiqueta todavía no está preparada."}, {status: 404});
  const {data, error} = await admin.storage.from("market-shipping-labels").createSignedUrl(details.label_path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({error: "No se pudo abrir la etiqueta."}, {status: 500});
  return NextResponse.redirect(data.signedUrl, {headers: {"Cache-Control": "private, no-store"}});
}
