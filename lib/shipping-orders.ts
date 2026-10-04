import "server-only";
import {createClient} from "@/lib/supabase/server";
import {stripeLiveMode, stripeRequest} from "@/lib/stripe";

export type ShippingAddress = {name?: string; address?: {line1?: string; line2?: string; postal_code?: string; city?: string; state?: string; country?: string}};
type ShippingSession = {
  id: string;
  livemode: boolean;
  payment_status: string;
  amount_total: number;
  metadata?: {shipping_management?: string};
  shipping_details?: ShippingAddress | null;
  collected_information?: {shipping_details?: ShippingAddress | null};
  customer_details?: {email?: string; phone?: string};
};

// Only call after authenticating the seller or the shipping administrator.
export async function getManagedShippingOrder(id: string) {
  const admin = await createClient();
  const {data: order, error} = await admin.from("market_orders")
    .select("id,seller_id,buyer_id,total_cents,shipping_cents,platform_fee_cents,stripe_checkout_session_id,tracking_code,shipped_at,received_at")
    .eq("id", id).eq("shipping_managed_by_platform", true).eq("payment_status", "paid").eq("delivery_method", "shipping").single();
  if (error || !order) throw new Error("Pedido no disponible.");
  const session = await stripeRequest<ShippingSession>(`/checkout/sessions/${encodeURIComponent(order.stripe_checkout_session_id)}`, undefined, "GET");
  if (session.payment_status !== "paid" || session.livemode !== stripeLiveMode() || session.metadata?.shipping_management !== "cromonexo_manual" || session.amount_total !== order.total_cents) {
    throw new Error("No se ha podido verificar el pago del envío.");
  }
  return {admin, order, session};
}
