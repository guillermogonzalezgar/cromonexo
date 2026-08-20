import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MapPin, Repeat2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/app-header";

export const dynamic = "force-dynamic";

type MatchRow = {
  matched_user_id: string; username: string | null; display_name: string | null; city: string | null;
  can_receive: string[]; can_give: string[]; receive_count: number; give_count: number; compatibility_score: number;
};
type StickerInfo = { id: string; number: string; name: string | null; team: string };

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: collection } = await supabase.from("collections").select("id, name").eq("slug", "laliga-este-2026-27").single();
  if (!collection) throw new Error("La colección no está disponible.");
  const { data, error } = await supabase.rpc("get_user_matches", { p_collection_id: collection.id });
  if (error) throw new Error("No se pudieron calcular los matches.");
  const matches = (data ?? []) as MatchRow[];
  const stickerIds = [...new Set(matches.flatMap(match => [...(match.can_receive ?? []), ...(match.can_give ?? [])]))];
  const { data: stickerRows } = stickerIds.length
    ? await supabase.from("stickers").select("id, number, name, team").in("id", stickerIds)
    : { data: [] as StickerInfo[] };
  const stickers = new Map(((stickerRows ?? []) as StickerInfo[]).map(sticker => [sticker.id, sticker]));

  return <div className="min-h-screen pb-24 md:pb-12">
    <AppHeader active="matches"/>
    <main className="mx-auto max-w-6xl px-4 py-9 md:px-8 md:py-14">
      <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#527060]">{collection.name}</p><h1 className="text-4xl font-black tracking-[-.05em] md:text-5xl">Mis matches</h1><p className="mt-3 max-w-2xl text-[#607066]">Personas que tienen al menos un cromo que te falta y necesitan al menos uno de tus repetidos.</p></div>
      {matches.length ? <div className="space-y-5">{matches.map((match, index) => {
        const receives = (match.can_receive ?? []).map(id => stickers.get(id)).filter(Boolean) as StickerInfo[];
        const gives = (match.can_give ?? []).map(id => stickers.get(id)).filter(Boolean) as StickerInfo[];
        const name = match.display_name || (match.username ? `@${match.username}` : "Coleccionista");
        return <article key={match.matched_user_id} className="surface overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(23,35,27,.1)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#173d2a]/10 p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#e6f1db] font-black text-[#164f35]">{name.slice(0,2).toUpperCase()}</div><div><div className="flex items-center gap-2"><h2 className="font-black">{name}</h2>{index === 0 && <span className="rounded-full bg-[#c9f31d] px-2 py-1 text-[10px] font-black uppercase">Mejor match</span>}</div>{match.city && <p className="mt-1 flex items-center gap-1 text-xs text-[#718078]"><MapPin size={13}/>{match.city}</p>}</div></div><div className="rounded-xl bg-[#17231b] px-4 py-2 text-center text-white"><strong className="block text-xl">{match.compatibility_score}</strong><span className="text-[10px] font-bold uppercase tracking-wider text-white/65">Compatibilidad</span></div></div>
          <div className="grid md:grid-cols-2"><TradeSide title={`Recibes · ${match.receive_count}`} tone="receive" stickers={receives}/><TradeSide title={`Entregas · ${match.give_count}`} tone="give" stickers={gives}/></div>
          <div className="border-t border-[#173d2a]/10 p-4 text-right"><Link href={`/propuestas/nueva?usuario=${match.matched_user_id}`} className="inline-flex items-center gap-2 rounded-xl bg-[#164f35] px-5 py-3 text-sm font-bold text-white">Proponer intercambio<ArrowRight size={17}/></Link></div>
        </article>;
      })}</div> : <div className="rounded-2xl border border-dashed border-[#173d2a]/25 bg-white/50 px-6 py-16 text-center"><Repeat2 className="mx-auto mb-4 text-[#789083]" size={36}/><h2 className="text-xl font-black">Todavía no hay matches</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#65756b]">Necesitamos otra cuenta con faltantes y repetidos compatibles. Añade más cromos o prueba con un segundo usuario.</p><Link href="/mi-coleccion" className="mt-5 inline-flex rounded-xl bg-[#164f35] px-5 py-3 text-sm font-bold text-white">Volver a mi colección</Link></div>}
    </main>
  </div>;
}

function TradeSide({ title, tone, stickers }: { title: string; tone: "receive" | "give"; stickers: StickerInfo[] }) {
  return <section className={`p-5 md:first:border-r md:first:border-[#173d2a]/10 ${tone === "receive" ? "bg-[#fff7f2]" : "bg-[#f7fbdc]"}`}><h3 className="mb-3 text-sm font-black uppercase tracking-wider">{title}</h3><div className="flex flex-wrap gap-2">{stickers.map(sticker => <span key={sticker.id} title={`${sticker.name ?? "Sin asignar"} · ${sticker.team}`} className={`rounded-lg px-3 py-2 text-xs font-bold ${tone === "receive" ? "bg-[#ff6a3d] text-white" : "bg-[#c9f31d] text-[#17231b]"}`}>#{sticker.number} · {sticker.name ?? sticker.team}</span>)}</div></section>;
}
