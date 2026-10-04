"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import type {SenderAddress} from "@/lib/manual-shipping";
import {createClient} from "@/lib/supabase/client";

type Props = {orderId: string; sender?: SenderAddress | null; tracking?: string | null; labelReady?: boolean};
export default function ManagedShipping({orderId, sender, tracking, labelReady}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/envios/${orderId}`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudieron guardar los datos.");
      router.refresh();
    } catch (e) {setError(e instanceof Error ? e.message : "No se pudo conectar.");}
    finally {setBusy(false);}
  }
  async function dispatch() {
    setBusy(true); setError("");
    try {
      const {error} = await createClient().rpc("ship_market_order", {p_order_id: orderId, p_carrier: "Correos", p_tracking_code: tracking});
      if (error) throw error;
      router.refresh();
    } catch {setError("No se pudo confirmar el envío. Inténtalo de nuevo.");}
    finally {setBusy(false);}
  }
  return <section className="mt-4 rounded-xl border border-[#173d2a]/15 bg-white p-4">
    <h3 className="font-black">CromoNexo gestiona este envío</h3>
    <p className="mt-2 text-sm text-[#65756b]">Los 3,99 € de envío se destinan a contratar Correos. No compres otro envío por tu cuenta.</p>
    {tracking && labelReady ? <div className="mt-4 space-y-3">
      <p className="text-sm font-bold">Etiqueta preparada · {tracking}</p>
      <a href={`/api/envios/${orderId}/etiqueta`} target="_blank" rel="noreferrer" className="inline-block rounded-xl border px-4 py-3 text-sm font-bold">Descargar etiqueta PDF</a>
      <p className="text-sm text-[#65756b]">Imprime la etiqueta, prepara el paquete y entrégalo en Correos. Confirma abajo solo cuando lo hayas entregado.</p>
      <button disabled={busy} onClick={dispatch} className="rounded-xl bg-[#164f35] px-4 py-3 text-sm font-bold text-white disabled:opacity-40">{busy ? "Guardando…" : "Paquete entregado en Correos"}</button>
    </div> : <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
      <p className="text-sm font-semibold sm:col-span-2">{sender ? "Datos recibidos. Estamos preparando tu etiqueta; puedes corregir los datos mientras tanto." : "Indica tus datos como remitente para preparar la etiqueta."}</p>
      <label className="text-sm font-bold sm:col-span-2">Nombre y apellidos<input required name="name" minLength={2} maxLength={120} defaultValue={sender?.name} autoComplete="name" className="mt-1 w-full rounded-lg border p-3 font-normal"/></label>
      <label className="text-sm font-bold sm:col-span-2">Dirección en España<input required name="address" minLength={5} maxLength={200} defaultValue={sender?.address} autoComplete="street-address" className="mt-1 w-full rounded-lg border p-3 font-normal"/></label>
      <label className="text-sm font-bold">Código postal<input required name="postalCode" pattern="[0-9]{5}" maxLength={5} defaultValue={sender?.postalCode} autoComplete="postal-code" className="mt-1 w-full rounded-lg border p-3 font-normal"/></label>
      <label className="text-sm font-bold">Ciudad<input required name="city" minLength={2} maxLength={100} defaultValue={sender?.city} autoComplete="address-level2" className="mt-1 w-full rounded-lg border p-3 font-normal"/></label>
      <label className="text-sm font-bold sm:col-span-2">Teléfono<input required type="tel" name="phone" minLength={9} maxLength={20} defaultValue={sender?.phone} autoComplete="tel" className="mt-1 w-full rounded-lg border p-3 font-normal"/></label>
      <p className="text-xs text-[#65756b] sm:col-span-2">Usaremos estos datos para gestionar el envío y facilitarlos a Correos.</p>
      <button disabled={busy} className="rounded-xl bg-[#164f35] px-4 py-3 font-bold text-white disabled:opacity-40 sm:col-span-2">{busy ? "Guardando…" : sender ? "Actualizar datos" : "Enviar datos a CromoNexo"}</button>
    </form>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
