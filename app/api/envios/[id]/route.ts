import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getManagedShippingOrder} from "@/lib/shipping-orders";
import {parseSenderAddress} from "@/lib/manual-shipping";

type Context = {params: Promise<{id: string}>};
export async function POST(request: Request, {params}: Context) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: "Inicia sesión."}, {status: 401});
  const {id} = await params;
  const {data: ownOrder} = await supabase.from("market_orders").select("id").eq("id", id).eq("seller_id", user.id).eq("shipping_managed_by_platform", true).single();
  if (!ownOrder) return NextResponse.json({error: "Pedido no disponible."}, {status: 404});
  try {
    const sender = parseSenderAddress(await request.json());
    if (!sender) return NextResponse.json({error: "Completa el nombre, dirección, código postal, ciudad y teléfono del remitente en España."}, {status: 400});
    const {admin, order} = await getManagedShippingOrder(id);
    if (order.shipped_at || order.tracking_code) return NextResponse.json({error: "El envío ya está preparado. Contacta con CromoNexo para cambiar los datos."}, {status: 409});
    const {error} = await admin.rpc("save_managed_shipping_sender", {p_order_id: id, p_seller_id: user.id, p_sender: sender});
    if (error) throw error;
    return NextResponse.json({saved: true});
  } catch {
    return NextResponse.json({error: "No se pudieron guardar los datos. Revisa el pedido o inténtalo de nuevo."}, {status: 400});
  }
}
