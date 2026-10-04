import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isShippingAdmin} from "@/lib/shipping-admin";
import {getManagedShippingOrder} from "@/lib/shipping-orders";

export const runtime = "nodejs";
export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!isShippingAdmin(user)) return NextResponse.json({error: "Acceso restringido."}, {status: 403});
  const {id} = await params;
  try {
    const form = await request.formData();
    const tracking = String(form.get("tracking") ?? "").trim();
    const file = form.get("label");
    if (!/^[a-zA-Z0-9-]{5,80}$/.test(tracking) || (!file || typeof file === "string") || file.size < 5 || file.size > 4 * 1024 * 1024) {
      return NextResponse.json({error: "Añade un seguimiento válido y una etiqueta PDF de hasta 4 MB."}, {status: 400});
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({error: "La etiqueta debe ser un PDF."}, {status: 400});
    const {admin, order} = await getManagedShippingOrder(id);
    if (order.shipped_at || order.received_at) return NextResponse.json({error: "El paquete ya está enviado."}, {status: 409});
    const path = `${id}/${randomUUID()}.pdf`;
    const {error: uploadError} = await admin.storage.from("market-shipping-labels").upload(path, bytes, {contentType: "application/pdf", upsert: false});
    if (uploadError) throw uploadError;
    const {error} = await admin.rpc("register_managed_shipping_label", {p_order_id: id, p_tracking: tracking, p_label_path: path});
    if (error) {
      await admin.storage.from("market-shipping-labels").remove([path]);
      throw error;
    }
    return NextResponse.json({saved: true});
  } catch {
    return NextResponse.json({error: "No se pudo guardar la etiqueta. Comprueba que el vendedor ha enviado sus datos y que el pago está confirmado."}, {status: 400});
  }
}
