import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {isShippingAdmin} from "@/lib/shipping-admin";
import {getManagedShippingOrder} from "@/lib/shipping-orders";
import {parseSenderAddress} from "@/lib/manual-shipping";
import LabelForm from "./label-form";

export const dynamic = "force-dynamic";
export default async function ShippingOrderPage({params}: {params: Promise<{id: string}>}) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isShippingAdmin(user)) notFound();
  const {id} = await params;
  const result = await getManagedShippingOrder(id).catch(() => null);
  if (!result) return <main className="mx-auto max-w-3xl p-8"><Link href="/admin/envios">← Envíos</Link><p className="mt-5">Pedido no disponible o pago no verificable en Stripe. No contrates el envío hasta poder verificarlo.</p></main>;
  const {admin, order, session} = result;
  const [{data: details}, {data: seller}] = await Promise.all([
    admin.from("market_shipping_details").select("sender,label_path").eq("order_id", id).maybeSingle(),
    admin.rpc("managed_shipping_seller_email", {p_order_id: id}),
  ]);
  const sender = parseSenderAddress(details?.sender);
  const destination = session.collected_information?.shipping_details || session.shipping_details;
  const address = destination?.address;
  return <main className="min-h-screen bg-[#f5f2e9] px-4 py-8"><div className="mx-auto max-w-3xl">
    <Link href="/admin/envios" className="text-sm font-bold">← Todos los envíos</Link>
    <h1 className="mt-6 text-3xl font-black">Pedido {id.slice(0, 8)}</h1>
    <p className="mt-2 text-sm">Envío: {(order.shipping_cents / 100).toFixed(2)} € · Comisión: {(order.platform_fee_cents / 100).toFixed(2)} €</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl bg-white p-5"><h2 className="font-black">Remitente (vendedor)</h2>{sender ? <div className="mt-3 space-y-1 text-sm"><p>{sender.name}</p><p>{sender.address}</p><p>{sender.postalCode} · {sender.city} · España</p><p>{sender.phone}</p></div> : <p className="mt-3 text-sm">El vendedor todavía debe completar sus datos en el pedido.</p>}<p className="mt-3 break-all text-sm">{seller}</p></section>
      <section className="rounded-2xl bg-white p-5"><h2 className="font-black">Destinatario (comprador)</h2>{address ? <div className="mt-3 space-y-1 text-sm"><p>{destination?.name}</p><p>{address.line1}</p><p>{address.line2}</p><p>{address.postal_code} · {address.city}</p><p>{address.state} · {address.country}</p><p>{session.customer_details?.phone}</p><p className="break-all">{session.customer_details?.email}</p></div> : <p className="mt-3 text-sm">Falta la dirección en Stripe. Contacta con el comprador antes de contratar.</p>}</section>
    </div>
    {order.tracking_code && <p className="mt-5 font-bold">Seguimiento: {order.tracking_code}</p>}
    {details?.label_path && <a href={`/api/envios/${id}/etiqueta`} target="_blank" rel="noreferrer" className="mt-3 inline-block font-bold underline">Ver etiqueta PDF</a>}
    {order.shipped_at ? <p className="mt-6 rounded-xl bg-white p-4">El vendedor ya ha confirmado la entrega en Correos.</p> : sender && address ? <LabelForm orderId={id} tracking={order.tracking_code}/> : <p className="mt-6 rounded-xl bg-white p-4">Necesitas los datos de remitente y destinatario para preparar el envío.</p>}
  </div></main>;
}
