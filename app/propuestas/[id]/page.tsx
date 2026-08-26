import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowLeft,Check,PackageCheck} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import AppHeader from "@/components/app-header";
import ProposalActions from "./proposal-actions";
import FulfillmentActions from "./fulfillment-actions";
export const dynamic="force-dynamic";
type TradeItem={id:string;direction:string;sticker:{number:string;name:string|null;team:string}|{number:string;name:string|null;team:string}[]|null};
const labels:Record<string,string>={pending:"Pendiente",rejected:"Rechazada",countered:"Contraoferta",cancelled:"Cancelada",accepted:"Aceptada",preparing:"Preparando",shipped:"Enviada",received:"Recibida",completed:"Completada"};

export default async function ProposalPage({params}:{params:Promise<{id:string}>}){
  const{id}=await params;const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const{data:p}=await supabase.from("trade_proposals").select("id,proposer_id,recipient_id,status,fulfillment_status,message,created_at,proposer_prepared_at,recipient_prepared_at,proposer_shipped_at,recipient_shipped_at,proposer_received_at,recipient_received_at,proposer_tracking_code,recipient_tracking_code,proposer:profiles!trade_proposals_proposer_id_fkey(display_name,username),recipient:profiles!trade_proposals_recipient_id_fkey(display_name,username)").eq("id",id).single();
  if(!p)redirect("/mis-matches");
  const{data:items}=await supabase.from("trade_items").select("id,direction,sticker:stickers(number,name,team)").eq("trade_proposal_id",id);
  const isProposer=user.id===p.proposer_id,other=isProposer?p.recipient:p.proposer;
  const otherName=(Array.isArray(other)?other[0]:other)?.display_name||(Array.isArray(other)?other[0]:other)?.username||"Coleccionista";
  const fulfillment=p.fulfillment_status||(p.status==="accepted"?"accepted":null);
  const own={prepared:isProposer?p.proposer_prepared_at:p.recipient_prepared_at,shipped:isProposer?p.proposer_shipped_at:p.recipient_shipped_at,received:isProposer?p.proposer_received_at:p.recipient_received_at};
  const theirs={prepared:isProposer?p.recipient_prepared_at:p.proposer_prepared_at,shipped:isProposer?p.recipient_shipped_at:p.proposer_shipped_at,received:isProposer?p.recipient_received_at:p.proposer_received_at,tracking:isProposer?p.recipient_tracking_code:p.proposer_tracking_code};
  return <div className="min-h-screen pb-24 md:pb-12"><AppHeader active="matches"/><main className="mx-auto max-w-3xl px-4 py-9 md:px-8 md:py-14">
    <Link href="/mis-matches" className="flex items-center gap-2 text-sm font-bold"><ArrowLeft size={18}/>Mis matches</Link>
    <div className="mt-8 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#527060]">Propuesta con {otherName}</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Intercambio</h1></div><span className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase">{labels[fulfillment||p.status]||p.status}</span></div>
    {p.message&&<p className="mt-5 rounded-xl bg-white p-4">“{p.message}”</p>}
    <div className="mt-5 grid gap-4 md:grid-cols-2"><ItemSide title={isProposer?"Tú entregas":"Tú recibes"} items={(items??[]).filter(i=>i.direction==="offered")}/><ItemSide title={isProposer?"Tú recibes":"Tú entregas"} items={(items??[]).filter(i=>i.direction==="requested")}/></div>
    {p.recipient_id===user.id&&p.status==="pending"&&<ProposalActions proposalId={p.id}/>}
    {p.status==="accepted"&&<><TradeProgress own={own} theirs={theirs}/>{fulfillment==="completed"&&<CompletionCelebration/>}{theirs.tracking&&<p className="mt-4 rounded-xl bg-white p-4 text-sm"><span className="font-bold">Seguimiento del envío que recibirás:</span> <span className="font-mono">{theirs.tracking}</span></p>}<FulfillmentActions proposalId={p.id} hasPrepared={Boolean(own.prepared)} hasShipped={Boolean(own.shipped)} hasReceived={Boolean(own.received)} otherHasShipped={Boolean(theirs.shipped)}/></>}
  </main></div>;
}

function TradeProgress({own,theirs}:{own:{prepared:string|null;shipped:string|null;received:string|null};theirs:{prepared:string|null;shipped:string|null;received:string|null}}){
  const steps=[{label:"Aceptado",done:true},{label:"Preparando",done:Boolean(own.prepared||theirs.prepared)},{label:"Ambos enviados",done:Boolean(own.shipped&&theirs.shipped)},{label:"Ambos recibidos",done:Boolean(own.received&&theirs.received)}];
  return <section className="mt-6 rounded-2xl bg-[#17231b] p-5 text-white"><div className="flex items-center gap-2"><PackageCheck className="text-[#c9f31d]"/><h2 className="font-black">Estado del intercambio</h2></div><ol className="mt-5 grid gap-3 sm:grid-cols-4">{steps.map((step,index)=><li key={step.label} className={`rounded-xl p-3 text-xs font-bold ${step.done?"bg-[#c9f31d] text-[#17231b]":"bg-white/10 text-white/55"}`}><span className="mb-2 grid h-6 w-6 place-items-center rounded-full bg-white/80 text-[#17231b]">{step.done?<Check size={14}/>:index+1}</span>{step.label}</li>)}</ol><div className="mt-4 grid gap-2 text-xs text-white/70 sm:grid-cols-2"><p>Tu envío: <strong className="text-white">{own.received?"recibido":own.shipped?"enviado":own.prepared?"preparando":"sin preparar"}</strong></p><p>La otra persona: <strong className="text-white">{theirs.received?"recibido":theirs.shipped?"enviado":theirs.prepared?"preparando":"sin preparar"}</strong></p></div></section>;
}
function ItemSide({title,items}:{title:string;items:TradeItem[]}){return <section className="rounded-2xl bg-white p-5"><h2 className="font-black">{title}</h2><div className="mt-3 space-y-2">{items.map(i=>{const s=Array.isArray(i.sticker)?i.sticker[0]:i.sticker;return <p key={i.id} className="rounded-lg bg-[#f0eee7] px-3 py-2 text-sm font-bold">#{s?.number} · {s?.name??s?.team}</p>})}</div></section>}
function CompletionCelebration(){return <section className="celebration-confetti relative mt-5 overflow-hidden rounded-2xl bg-[#c9f31d] p-6 text-center text-[#17231b]">{Array.from({length:12},(_,index)=><span key={index}/>) }<p className="relative text-3xl">🎉</p><h2 className="relative mt-2 text-xl font-black">Intercambio completado</h2><p className="relative mt-1 text-sm font-semibold">Los dos coleccionistas habéis confirmado la recepción.</p></section>}
