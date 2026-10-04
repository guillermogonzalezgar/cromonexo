"use client";
import ManagedShipping from "./managed-shipping";
import type {SenderAddress} from "@/lib/manual-shipping";
import {useState}from"react";import{useRouter}from"next/navigation";import{CreditCard,Mail,MapPin,PackageCheck,Truck}from"lucide-react";import{createClient}from"@/lib/supabase/client";import{marketPaymentsAvailable,shippingCentsFor,shippingLabelFor,TRACKED_MAIL_THRESHOLD_CENTS}from"@/lib/market-policy";

export function ConnectPayments(){const[busy,setBusy]=useState(false),[error,setError]=useState("");const open=async()=>{setBusy(true);setError("");const response=await fetch("/api/stripe/connect",{method:"POST"}),data=await response.json();setBusy(false);if(data.url)location.href=data.url;else setError(data.error||"No se pudo abrir Stripe.")};return <div><button disabled={busy} onClick={open} className="flex items-center gap-2 rounded-xl bg-[#635bff] px-5 py-3 font-bold text-white disabled:opacity-50"><CreditCard size={18}/>{busy?"Abriendo Stripe…":"Configurar cobros con Stripe"}</button>{error&&<p className="mt-2 text-xs font-bold text-red-700">{error}</p>}</div>}

export function CheckoutActions({requestId,priceCents}:{requestId:string;priceCents:number}){const[busy,setBusy]=useState(false),[error,setError]=useState(""),available=marketPaymentsAvailable(),shipping=shippingCentsFor(priceCents),tracked=priceCents>TRACKED_MAIL_THRESHOLD_CENTS;const checkout=async(delivery:"shipping"|"pickup")=>{setBusy(true);setError("");const response=await fetch("/api/stripe/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId,delivery})}),data=await response.json();setBusy(false);if(data.url)location.href=data.url;else setError(data.error||"No se pudo iniciar el pago.")};if(!available)return <div className="mt-4 rounded-xl bg-[#f1f7df] p-4 text-sm"><p className="font-black">Pagos disponibles el 1 de octubre</p><p className="mt-1 text-[#647269]">La solicitud queda preparada. Todas las compras se pagarán de forma segura desde CromoNexo.</p></div>;const ShippingIcon=tracked?Truck:Mail;return <div className="mt-4"><p className="mb-2 text-xs font-black uppercase tracking-wider text-[#718078]">Elige la entrega y paga siempre en CromoNexo</p><div className="grid gap-2 sm:grid-cols-2"><button disabled={busy} onClick={()=>checkout("shipping")} className="flex items-center justify-center gap-2 rounded-xl bg-[#164f35] p-3 text-sm font-bold text-white"><ShippingIcon size={17}/>{shippingLabelFor(priceCents)} · {(shipping/100).toFixed(2).replace(".",",")} €</button><button disabled={busy} onClick={()=>checkout("pickup")} className="flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold"><MapPin size={17}/>Entrega en mano · gratis</button></div>{tracked&&<p className="mt-3 text-xs text-[#65756b]">CromoNexo contrata el envío con seguimiento por 3,99 €. El vendedor recibirá la etiqueta en su pedido.</p>}{error&&<p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-bold text-red-700">{error}</p>}</div>}

type OrderActionsProps = {
  orderId: string;
  incoming: boolean;
  delivery: "shipping" | "pickup";
  shippingCents: number;
  shipped: boolean;
  received: boolean;
  managed?: boolean;
  sender?: SenderAddress | null;
  trackingCode?: string | null;
  labelReady?: boolean;
};

export function OrderActions({orderId, incoming, delivery, shippingCents, shipped, received, managed = false, sender, trackingCode, labelReady}: OrderActionsProps) {
  const router = useRouter();
  const tracked = shippingCents > 149;
  const [carrier, setCarrier] = useState("Correos");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const updateOrder = async (action: "ship" | "receive") => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const result = action === "ship"
        ? await supabase.rpc("ship_market_order", {
            p_order_id: orderId,
            p_carrier: tracked ? carrier.trim() : "Correos",
            p_tracking_code: tracked ? tracking.trim() : "",
          })
        : await supabase.rpc("receive_market_order", {p_order_id: orderId});
      if (result.error) throw result.error;
      router.refresh();
    } catch {
      setError("No se pudo guardar el cambio. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  // Payment confirmation does not prove a physical handover took place.
  if (delivery === "pickup") {
    return <p className="mt-3 text-sm text-[#718078]">Entrega en mano gratuita. Acordad el lugar y la hora. No tenéis que marcar el envío ni confirmar la recepción en la web.</p>;
  }
  if (received) {
    return <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[#287051]"><PackageCheck size={18}/>Pedido recibido y completado</p>;
  }

  if (managed && incoming && !shipped) {
    return <ManagedShipping orderId={orderId} sender={sender} tracking={trackingCode} labelReady={labelReady}/>;
  }
  if (managed && !incoming && !shipped) {
    return <p className="mt-4 text-sm text-[#718078]">{trackingCode ? "Etiqueta preparada. Pendiente de entrega del paquete en Correos por el vendedor." : "CromoNexo está gestionando el envío. Aquí aparecerá el seguimiento cuando esté preparado."}</p>;
  }
  return <div className="mt-4">
    {incoming && !shipped ? tracked ? <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <input aria-label="Transportista" value={carrier} onChange={e => setCarrier(e.target.value)} maxLength={80} placeholder="Transportista" className="rounded-xl border p-3"/>
      <input aria-label="Número de seguimiento" value={tracking} onChange={e => setTracking(e.target.value)} maxLength={120} placeholder="Número de seguimiento" className="rounded-xl border p-3"/>
      <button disabled={busy || carrier.trim().length < 2 || tracking.trim().length < 3} onClick={() => updateOrder("ship")} className="rounded-xl bg-[#164f35] px-4 py-3 font-bold text-white disabled:opacity-40">{busy ? "Guardando…" : "Marcar enviado"}</button>
    </div> : <div>
      <p className="mb-2 text-sm text-[#718078]">Deposita la carta con su sello y pulsa el botón cuando la hayas enviado. No necesitas número de seguimiento.</p>
      <button disabled={busy} onClick={() => updateOrder("ship")} className="rounded-xl bg-[#164f35] px-4 py-3 text-sm font-bold text-white disabled:opacity-40">{busy ? "Guardando…" : "Carta enviada"}</button>
    </div> : !incoming && shipped ? <button disabled={busy} onClick={() => updateOrder("receive")} className="rounded-xl bg-[#c9f31d] px-4 py-3 text-sm font-black disabled:opacity-40">{busy ? "Guardando…" : "Confirmar recepción"}</button> : <p className="text-sm text-[#718078]">{shipped ? "Enviado. Pendiente de recepción por el comprador." : "Pendiente de envío por el vendedor."}</p>}
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </div>;
}
