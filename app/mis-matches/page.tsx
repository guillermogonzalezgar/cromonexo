import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MapPin, Repeat2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/app-header";
import MatchSafetyActions from "./match-safety-actions";
import CollectionSelector from "@/components/collection-selector";

export const dynamic = "force-dynamic";

type MatchRow = {
  matched_user_id: string; username: string | null; display_name: string | null; city: string | null;
  can_receive: string[]; can_give: string[]; receive_count: number; give_count: number; compatibility_score: number;
};
type StickerInfo = { id: string; number: string; name: string | null; team: string };
type ProposalRow = { id:string; proposer_id:string; recipient_id:string; status:string; fulfillment_status:string|null; updated_at:string; proposer:{display_name:string|null;username:string|null}|{display_name:string|null;username:string|null}[]|null; recipient:{display_name:string|null;username:string|null}|{display_name:string|null;username:string|null}[]|null };
const proposalLabels:Record<string,string>={pending:"Pendiente",accepted:"Aceptada",preparing:"Preparando",shipped:"Enviada",received:"Recibida",completed:"Completada",rejected:"Rechazada",cancelled:"Cancelada",countered:"Contraoferta"};

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ coleccion?: string }> }) {
  const { coleccion } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: collections } = await supabase.from("collections").select("id, slug, name").eq("is_active", true).order("created_at");
  const selectedSlug = collections?.some(item => item.slug === coleccion) ? coleccion! : "laliga-este-2026-27";
  const collection = collections?.find(item => item.slug === selectedSlug) ?? collections?.[0];
  if (!collection) throw new Error("La colección no está disponible.");
  const { data, error } = await supabase.rpc("get_user_matches", { p_collection_id: collection.id });
  if (error) throw new Error("No se pudieron calcular los matches.");
  const matches = (data ?? []) as MatchRow[];
  const stickerIds = [...new Set(matches.flatMap(match => [...(match.can_receive ?? []), ...(match.can_give ?? [])]))];
  const { data: stickerRows } = stickerIds.length
    ? await supabase.from("stickers").select("id, number, name, team").in("id", stickerIds)
    : { data: [] as StickerInfo[] };
  const stickers = new Map(((stickerRows ?? []) as StickerInfo[]).map(sticker => [sticker.id, sticker]));
  const {data:proposalRows}=await supabase.from("trade_proposals").select("id,proposer_id,recipient_id,status,fulfillment_status,updated_at,proposer:profiles!trade_proposals_proposer_id_fkey(display_name,username),recipient:profiles!trade_proposals_recipient_id_fkey(display_name,username)").eq("collection_id",collection.id).or(`proposer_id.eq.${user.id},recipient_id.eq.${user.id}`).in("status",["pending","accepted"]).order("updated_at",{ascending:false});
  const proposals=(proposalRows??[]) as ProposalRow[];

  return <div className="min-h-screen pb-24 md:pb-12">
    <AppHeader active="matches"/>
    <main className="mx-auto max-w-6xl px-4 py-9 md:px-8 md:py-14">
      <div className="mb-8 grid gap-5 md:grid-cols-[1fr_20rem] md:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#527060]">{collection.name}</p><h1 className="text-4xl font-black tracking-[-.05em] md:text-5xl">Mis matches</h1><p className="mt-3 max-w-2xl text-[#607066]">Hay match cuando otra persona tiene al menos un cromo que te falta y tú tienes al menos uno de los que busca. No es necesario que coincidan todos.</p>{matches.length>0&&<p className="mt-4 inline-flex rounded-full bg-[#e5efd9] px-4 py-2 text-sm font-black text-[#164f35]">{matches.length} {matches.length===1?"match encontrado":"matches encontrados"}</p>}</div><CollectionSelector collections={(collections ?? []).map(({slug,name})=>({slug,name}))} value={collection.slug}/></div>
      {proposals.length>0&&<section className="mb-8 rounded-3xl bg-[#17231b] p-5 text-white md:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#c9f31d]">Seguimiento</p><h2 className="mt-1 text-2xl font-black">Tus intercambios activos</h2></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{proposals.length}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{proposals.map(proposal=>{const otherRaw=proposal.proposer_id===user.id?proposal.recipient:proposal.proposer;const other=Array.isArray(otherRaw)?otherRaw[0]:otherRaw;const state=proposal.fulfillment_status||proposal.status;return <Link key={proposal.id} href={`/propuestas/${proposal.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-[#17231b] transition hover:-translate-y-0.5"><div><p className="font-black">{other?.display_name||other?.username||"Coleccionista"}</p><p className="mt-1 text-xs text-[#65756b]">Ver cromos y actualizar el envío</p></div><span className="rounded-full bg-[#e5efd9] px-3 py-1 text-[10px] font-black uppercase text-[#164f35]">{proposalLabels[state]||state}</span></Link>})}</div></section>}
      {matches.length ? <div className="space-y-5">{matches.map((match, index) => {
        const receives = (match.can_receive ?? []).map(id => stickers.get(id)).filter(Boolean) as StickerInfo[];
        const gives = (match.can_give ?? []).map(id => stickers.get(id)).filter(Boolean) as StickerInfo[];
        const name = match.display_name || (match.username ? `@${match.username}` : "Coleccionista");
        return <article key={match.matched_user_id} className="surface overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(23,35,27,.1)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#173d2a]/10 p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e6f1db] font-black text-[#164f35]">{index+1}</div><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#718078]">Match {index+1}</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="font-black">{name}</h2>{index === 0 && <span className="rounded-full bg-[#c9f31d] px-2 py-1 text-[10px] font-black uppercase">Mejor match</span>}</div>{match.city && <p className="mt-1 flex items-center gap-1 text-xs text-[#718078]"><MapPin size={13}/>{match.city}</p>}</div></div><div className="rounded-xl bg-[#17231b] px-4 py-2 text-center text-white"><strong className="block text-xl">{match.compatibility_score}</strong><span className="text-[10px] font-bold uppercase tracking-wider text-white/65">Cromos compatibles</span></div></div>
          <div className="grid md:grid-cols-2"><TradeSide title={`Recibes · ${match.receive_count}`} tone="receive" stickers={receives}/><TradeSide title={`Entregas · ${match.give_count}`} tone="give" stickers={gives}/></div>
          <div className="flex items-center justify-between gap-3 border-t border-[#173d2a]/10 p-4"><MatchSafetyActions userId={match.matched_user_id}/><Link href={`/propuestas/nueva?usuario=${match.matched_user_id}&coleccion=${collection.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-[#164f35] px-5 py-3 text-sm font-bold text-white">Proponer intercambio<ArrowRight size={17}/></Link></div>
        </article>;
      })}</div> : <div className="rounded-2xl border border-dashed border-[#173d2a]/25 bg-white/50 px-6 py-16 text-center"><Repeat2 className="mx-auto mb-4 text-[#789083]" size={36}/><h2 className="text-xl font-black">Todavía no hay matches</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#65756b]">Necesitamos otra cuenta con faltantes y repetidos compatibles. Añade más cromos o prueba con un segundo usuario.</p><Link href="/mi-coleccion" className="mt-5 inline-flex rounded-xl bg-[#164f35] px-5 py-3 text-sm font-bold text-white">Volver a mi colección</Link></div>}
    </main>
  </div>;
}

function TradeSide({ title, tone, stickers }: { title: string; tone: "receive" | "give"; stickers: StickerInfo[] }) {
  return <section className={`p-5 md:first:border-r md:first:border-[#173d2a]/10 ${tone === "receive" ? "bg-[#fff7f2]" : "bg-[#f7fbdc]"}`}><h3 className="mb-3 text-sm font-black uppercase tracking-wider">{title}</h3><div className="grid gap-2 sm:grid-cols-2">{stickers.map(sticker => <VisualTradeSticker key={sticker.id} sticker={sticker} tone={tone}/>)}</div></section>;
}
function VisualTradeSticker({sticker,tone}:{sticker:StickerInfo;tone:"receive"|"give"}){const colors=teamColors(sticker.team);return <div title={`${sticker.name??"Sin asignar"} · ${sticker.team}`} className="flex min-w-0 items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"><span className="h-12 w-9 shrink-0 rounded-lg border-2 border-white shadow" style={{background:`repeating-linear-gradient(90deg,${colors[0]} 0,${colors[0]} 25%,${colors[1]} 25%,${colors[1]} 50%)`}}/><span className="min-w-0 flex-1"><strong className="block truncate text-xs">#{sticker.number} · {sticker.name??sticker.team}</strong><small className="mt-1 block truncate text-[10px] text-[#718078]">{sticker.team}</small></span><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone==="receive"?"bg-[#ff6a3d]":"bg-[#9fc814]"}`}/></div>}
function teamColors(team:string):[string,string]{const key=team.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();const map:Record<string,[string,string]>={"atletico de madrid":["#d71920","#fff"],"athletic club de bilbao":["#d71920","#fff"],"fc barcelona":["#a50044","#004d98"],"real betis":["#168c4b","#fff"],"rcd espanyol":["#1975bd","#fff"],"real madrid cf":["#fff","#d8b766"],"osasuna":["#c7182a","#15345b"],"rayo vallecano":["#fff","#df1e35"],"real sociedad":["#1986c8","#fff"],"sevilla":["#fff","#d71920"],"valencia":["#fff","#f39819"],"villarreal":["#ffe147","#1763a6"]};return map[key]??["#164f35","#c9f31d"]}
