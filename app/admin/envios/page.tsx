import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {isShippingAdmin} from "@/lib/shipping-admin";
import {stripeLiveMode} from "@/lib/stripe";

export const dynamic = "force-dynamic";
export default async function ShippingAdminPage({searchParams}: {searchParams: Promise<{page?: string}>}) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isShippingAdmin(user)) notFound();
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(params.page) || 1)));
  const {data: orders, error} = await supabase.from("market_orders")
    .select("id,created_at,item_cents,shipping_cents,tracking_code,shipped_at,received_at", {count: "exact"})
    .eq("shipping_managed_by_platform", true).eq("payment_status", "paid")
    .like("stripe_checkout_session_id", stripeLiveMode() ? "cs_live_%" : "cs_test_%")
    .order("created_at", {ascending: false}).range((page - 1) * 30, page * 30 - 1);
  return <main className="min-h-screen bg-[#f5f2e9] px-4 py-8"><div className="mx-auto max-w-3xl">
    <Link href="/mercado/solicitudes" className="text-sm font-bold">← Volver a pedidos</Link>
    <h1 className="mt-6 text-3xl font-black">Gestionar envíos</h1>
    <p className="mt-2 text-sm text-[#65756b]">Pedidos con seguimiento gestionados por CromoNexo · {stripeLiveMode() ? "pagos reales" : "modo de prueba"}.</p>
    {error ? <p role="alert" className="mt-5 rounded-xl bg-white p-4">No se pudieron cargar los envíos. Comprueba la migración de Supabase y la configuración del servidor.</p> : <div className="mt-6 space-y-3">
      {(orders || []).map(order => <Link key={order.id} href={`/admin/envios/${order.id}`} className="block rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-black">Pedido {order.id.slice(0, 8)} · {(order.item_cents / 100).toFixed(2)} €</p>
        <p className="mt-1 text-sm">Envío cobrado: {(order.shipping_cents / 100).toFixed(2)} € · {order.received_at ? "Recibido" : order.shipped_at ? "Enviado" : order.tracking_code ? "Etiqueta preparada" : "Pendiente de contratar"}</p>
        <p className="mt-2 text-xs text-[#65756b]">{new Date(order.created_at).toLocaleDateString("es-ES")}</p>
      </Link>)}
      {!orders?.length && <p className="rounded-xl bg-white p-5">No hay pedidos en esta página.</p>}
      <nav className="flex justify-between py-4">{page > 1 ? <Link href={`/admin/envios?page=${page - 1}`}>← Anteriores</Link> : <span/>}{orders?.length === 30 && <Link href={`/admin/envios?page=${page + 1}`}>Siguientes →</Link>}</nav>
    </div>}
  </div></main>;
}
