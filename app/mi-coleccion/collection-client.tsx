"use client";

import { useMemo, useState } from "react";
import { Album, Grid2X2, List, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AppHeader from "@/components/app-header";
import CollectionSelector, { type CollectionOption } from "@/components/collection-selector";

type Status = "wanted" | "duplicate" | null;
export type Sticker = { id: string; code: string; name: string | null; section: string; category: string | null; status: Status; quantity?: number };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export default function CollectionClient({ initialStickers, userId, collectionName, collectionSlug, collections }: { initialStickers: Sticker[]; userId: string; collectionName: string; collectionSlug: string; collections: CollectionOption[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [stickers, setStickers] = useState(initialStickers);
  const sections = useMemo(() => [...new Set(initialStickers.map(sticker => sticker.section))], [initialStickers]);
  const [filter, setFilter] = useState<"all" | Exclude<Status, null>>("all");
  const [query, setQuery] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [bulkStatus, setBulkStatus] = useState<Exclude<Status, null>>("wanted");
  const [bulkSection, setBulkSection] = useState(sections[0]);
  const [bulkMessage, setBulkMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const visible = useMemo(() => stickers.filter(s => s.status && (filter === "all" || s.status === filter) && (`${s.code} ${s.name ?? ""} ${s.section}`.toLowerCase().includes(query.toLowerCase()))), [stickers, filter, query]);
  const counts = (status: Status) => stickers.filter(s => s.status === status).length;
  const toggle = async (id: string, status: Exclude<Status, null>) => {
    const previous = stickers.find(sticker => sticker.id === id);
    if (!previous) return;
    const nextStatus = previous.status === status ? null : status;
    setSaveMessage("Guardando…");
    setStickers(list => list.map(s => s.id === id ? { ...s, status: nextStatus, quantity: nextStatus === "duplicate" ? (s.quantity ?? 2) : undefined } : s));
    const result = nextStatus
      ? await supabase.from("user_stickers").upsert({ user_id: userId, sticker_id: id, status: nextStatus, quantity: nextStatus === "duplicate" ? 2 : 1 })
      : await supabase.from("user_stickers").delete().eq("user_id", userId).eq("sticker_id", id);
    if (result.error) {
      setStickers(list => list.map(s => s.id === id ? previous : s));
      setSaveMessage("No se pudo guardar. Inténtalo de nuevo.");
    } else setSaveMessage("Guardado");
  };
  const addMany = async () => {
    const terms = [...new Set(bulkNumbers.split(/[,;\n]+/).map(normalize).filter(Boolean))];
    const matches = stickers.filter(s => s.section === bulkSection && terms.some(term => normalize(s.code) === term || (s.name && normalize(s.name) === term)));
    const matchedTerms = new Set(matches.flatMap(s => [normalize(s.code), s.name ? normalize(s.name) : ""]));
    const missing = terms.filter(term => !matchedTerms.has(term));
    if (!matches.length) { setBulkMessage(`No encontrados: ${missing.join(", ")}`); return; }
    const { error } = await supabase.from("user_stickers").upsert(matches.map(match => ({ user_id: userId, sticker_id: match.id, status: bulkStatus, quantity: bulkStatus === "duplicate" ? 2 : 1 })));
    if (error) { setBulkMessage("No se pudieron guardar los cromos. Inténtalo de nuevo."); return; }
    setStickers(list => list.map(s => matches.some(match => match.id === s.id) ? { ...s, status: bulkStatus, quantity: bulkStatus === "duplicate" ? 2 : undefined } : s));
    setBulkMessage(missing.length ? `Añadidos ${matches.length}. No encontrados: ${missing.join(", ")}` : `${matches.length} cromos añadidos y guardados.`);
    if (!missing.length) setBulkNumbers("");
  };

  return <div className="min-h-screen pb-24 md:pb-12">
    <AppHeader active="collection"/>

    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#527060]">Tu álbum digital</p><h1 className="text-4xl font-black tracking-[-.05em] md:text-5xl">Mi colección</h1><p className="mt-3 text-[#607066]">Organiza tus cromos. Nosotros encontraremos el intercambio.</p></div>
        <button onClick={() => setBulkOpen(v => !v)} className="flex items-center justify-center gap-2 rounded-xl bg-[#164f35] px-5 py-3.5 font-bold text-white shadow-[0_5px_0_#0d3624] transition active:translate-y-1 active:shadow-none"><Plus size={19}/>Añadir varios cromos</button>
      </div>

      {bulkOpen && <section className="mb-6 rounded-2xl border border-[#173d2a]/15 bg-white p-4 shadow-lg md:p-6">
        <div className="mb-4"><h2 className="text-xl font-black">Añadir varios cromos</h2><p className="mt-1 text-sm text-[#65756b]">Primero selecciona el equipo o categoría y después escribe sus números separados por comas.</p></div>
        <label className="mb-3 block text-sm font-bold">Equipo o categoría<select value={bulkSection} onChange={e => { setBulkSection(e.target.value); setBulkMessage(""); }} className="mt-2 w-full rounded-xl border border-[#173d2a]/20 bg-[#fbfaf5] px-4 py-3 outline-none focus:border-[#164f35]">{sections.map(section => <option key={section}>{section}</option>)}</select></label>
        <textarea autoFocus value={bulkNumbers} onChange={e => { setBulkNumbers(e.target.value); setBulkMessage(""); }} aria-label="Números o nombres de cromos" placeholder="1, 7, 12, 18A, 20" className="min-h-24 w-full resize-none rounded-xl border border-[#173d2a]/20 bg-[#fbfaf5] p-4 font-mono outline-none focus:border-[#164f35]"/>
        <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setBulkStatus("wanted")} className={`rounded-xl px-4 py-3 font-bold ${bulkStatus === "wanted" ? "bg-[#ff6a3d] text-white" : "bg-[#f0eee7]"}`}>Me faltan</button><button onClick={() => setBulkStatus("duplicate")} className={`rounded-xl px-4 py-3 font-bold ${bulkStatus === "duplicate" ? "bg-[#c9f31d]" : "bg-[#f0eee7]"}`}>Repetidos</button></div>
        <button onClick={addMany} disabled={!bulkNumbers.trim()} className="mt-3 w-full rounded-xl bg-[#17231b] px-5 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Guardar cromos</button>
        {bulkMessage && <p role="status" className="mt-3 rounded-lg bg-[#f0eee7] px-3 py-2 text-sm font-semibold">{bulkMessage}</p>}
      </section>}

      <section className="mb-6 overflow-hidden rounded-2xl border border-[#173d2a]/15 bg-white">
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_20rem] md:items-end md:p-5"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e6f1db] text-[#164f35]"><Album/></div><div><p className="text-xs font-bold uppercase tracking-wider text-[#6e8075]">{stickers.length} cromos disponibles</p><h2 className="font-extrabold">{collectionName}</h2></div></div><CollectionSelector collections={collections} value={collectionSlug}/></div>
        <div className="grid grid-cols-2 border-t border-[#173d2a]/10 bg-[#fbfaf5] text-center"><Stat value={counts("wanted")} label="Me faltan"/><Stat value={counts("duplicate")} label="Repetidos"/></div>
      </section>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">{([['all','Todos'],['wanted','Me faltan'],['duplicate','Repetidos']] as const).map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${filter===key?'bg-[#17231b] text-white':'border border-[#173d2a]/15 bg-white'}`}>{label}</button>)}</div>
        <div className="flex gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#173d2a]/15 bg-white px-3 lg:w-72"><Search size={18} className="text-[#718078]"/><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Buscar cromos" placeholder="Número, cromo o equipo" className="w-full bg-transparent py-3 outline-none"/></label><button aria-label="Vista de cuadrícula" className="rounded-xl bg-[#17231b] p-3 text-white"><Grid2X2 size={19}/></button><button aria-label="Vista de lista" className="rounded-xl border border-[#173d2a]/15 bg-white p-3"><List size={19}/></button></div>
      </div>

      <div className="mb-3 flex flex-col gap-1 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between"><p className="text-sm font-semibold text-[#637168]">Mostrando {visible.length} cromos marcados</p><p role="status" className="text-xs text-[#7b887f]">{saveMessage || "Guardado automático activado"}</p></div>
      <section className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {visible.map(sticker => <article key={sticker.id} className="group overflow-hidden rounded-2xl border border-[#173d2a]/15 bg-white transition hover:-translate-y-1 hover:shadow-lg">
          <div className="relative grid aspect-[4/3] place-items-center bg-[linear-gradient(135deg,#e9eee5,#f9f8f3)]"><span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 font-mono text-xs font-bold shadow-sm">#{sticker.code}</span><div className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-[#164f35]/25 text-2xl font-black text-[#164f35]/30">CN</div>{sticker.quantity && <span className="absolute right-3 top-3 rounded-full bg-[#ff6a3d] px-2 py-1 text-xs font-black text-white">×{sticker.quantity}</span>}</div>
          <div className="p-3"><p className="truncate font-bold">{sticker.name ?? `Cromo ${sticker.code}`}</p><p className="mb-3 truncate text-xs text-[#708078]">{sticker.section}</p><div className="flex gap-1"><button onClick={()=>toggle(sticker.id,"wanted")} aria-label="Marcar como me falta" className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${sticker.status==='wanted'?'bg-[#ff6a3d] text-white':'bg-[#f0eee7] text-[#7b776f]'}`}>Me falta</button><button onClick={()=>toggle(sticker.id,"duplicate")} aria-label="Marcar como repetido" className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${sticker.status==='duplicate'?'bg-[#c9f31d] text-[#17231b]':'bg-[#f0eee7] text-[#7b776f]'}`}>Repetido</button></div></div>
        </article>)}
      </section>
      {!visible.length && <div className="rounded-2xl border border-dashed border-[#173d2a]/25 bg-white/50 px-6 py-14 text-center"><Album className="mx-auto mb-3 text-[#789083]"/><h2 className="text-lg font-black">Todavía no has marcado ningún cromo</h2><p className="mt-1 text-sm text-[#65756b]">Usa “Añadir varios cromos” para registrar tus faltantes o repetidos.</p></div>}
    </main>
  </div>;
}

function Stat({value,label}:{value:number,label:string}) { return <div className="border-r border-[#173d2a]/10 px-2 py-4 last:border-0"><strong className="block text-2xl font-black">{value}</strong><span className="text-xs font-semibold text-[#6e7d74]">{label}</span></div> }
