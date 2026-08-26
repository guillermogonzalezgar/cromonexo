"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {Box,CheckCircle2,Send} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
type Action="prepare"|"ship"|"receive";
export default function FulfillmentActions({proposalId,hasPrepared,hasShipped,hasReceived,otherHasShipped}:{proposalId:string;hasPrepared:boolean;hasShipped:boolean;hasReceived:boolean;otherHasShipped:boolean}){
  const supabase=useMemo(()=>createClient(),[]),router=useRouter();const[tracking,setTracking]=useState(""),[busy,setBusy]=useState<Action|null>(null),[message,setMessage]=useState("");
  const run=async(action:Action)=>{setBusy(action);setMessage("");const{error}=await supabase.rpc("update_trade_fulfillment",{p_proposal_id:proposalId,p_action:action,p_tracking_code:action==="ship"?tracking:null});setBusy(null);if(error){setMessage("No se pudo actualizar el intercambio. Recarga la página e inténtalo de nuevo.");return}setMessage(action==="prepare"?"Has empezado a preparar el envío.":action==="ship"?"Envío marcado como realizado.":"Recepción confirmada.");router.refresh()};
  if(hasReceived)return <p className="mt-5 rounded-2xl bg-[#e5efd9] p-4 text-sm font-bold text-[#164f35]">Has confirmado que recibiste los cromos.</p>;
  return <section className="mt-5 rounded-2xl border border-[#173d2a]/10 bg-white p-5"><h2 className="font-black">Tu siguiente paso</h2>
    {!hasPrepared&&!hasShipped&&<button disabled={busy!==null} onClick={()=>run("prepare")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17231b] p-3.5 font-bold text-white disabled:opacity-50"><Box size={18}/>{busy==="prepare"?"Guardando…":"Estoy preparando los cromos"}</button>}
    {!hasShipped&&<div className="mt-4"><label className="text-xs font-bold text-[#607066]">Número de seguimiento <span className="font-normal">(opcional)</span><input value={tracking} onChange={e=>setTracking(e.target.value)} maxLength={100} placeholder="Ej. PQ123456789ES" className="mt-2 w-full rounded-xl border border-[#173d2a]/15 px-4 py-3 text-sm outline-none focus:border-[#164f35]"/></label><button disabled={busy!==null} onClick={()=>run("ship")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#164f35] p-3.5 font-bold text-white disabled:opacity-50"><Send size={18}/>{busy==="ship"?"Guardando…":"Marcar como enviado"}</button></div>}
    {hasShipped&&!otherHasShipped&&<p className="mt-4 rounded-xl bg-[#f0eee7] p-3 text-sm font-semibold text-[#607066]">Tu envío está registrado. Esperando a que la otra persona marque el suyo.</p>}
    {hasShipped&&otherHasShipped&&<button disabled={busy!==null} onClick={()=>run("receive")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9f31d] p-3.5 font-black text-[#17231b] disabled:opacity-50"><CheckCircle2 size={18}/>{busy==="receive"?"Guardando…":"Confirmar que lo he recibido"}</button>}
    {message&&<p role="status" className="mt-3 rounded-xl bg-[#f0eee7] p-3 text-sm font-bold">{message}</p>}</section>;
}
