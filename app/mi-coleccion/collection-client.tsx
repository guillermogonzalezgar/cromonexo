"use client";

import { useMemo, useState } from "react";
import { Album, Eye, Grid2X2, List, Plus, Search, X } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const visible = useMemo(() => stickers.filter(s => s.status && (filter === "all" || s.status === filter) && (`${s.code} ${s.name ?? ""} ${s.section}`.toLowerCase().includes(query.toLowerCase()))), [stickers, filter, query]);
  const selectedSticker = selectedId ? stickers.find(sticker => sticker.id === selectedId) ?? null : null;
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
  const clearStatus = async (id: string) => {
    const previous = stickers.find(sticker => sticker.id === id);
    if (!previous?.status) return;
    setSaveMessage("Guardando…");
    setStickers(list => list.map(sticker => sticker.id === id ? { ...sticker, status: null, quantity: undefined } : sticker));
    const { error } = await supabase.from("user_stickers").delete().eq("user_id", userId).eq("sticker_id", id);
    if (error) {
      setStickers(list => list.map(sticker => sticker.id === id ? previous : sticker));
      setSaveMessage("No se pudo desmarcar. Inténtalo de nuevo.");
    } else setSaveMessage("Cromo desmarcado");
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
        {visible.map(sticker => <article key={sticker.id} onClick={()=>setSelectedId(sticker.id)} className="group cursor-pointer overflow-hidden rounded-2xl border border-[#173d2a]/15 bg-white transition hover:-translate-y-1 hover:shadow-lg">
          <StickerArtwork sticker={sticker}/>
          <div className="p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-bold">{sticker.name ?? `Cromo ${sticker.code}`}</p><p className="truncate text-xs text-[#708078]">{sticker.section}</p></div><Eye size={16} className="mt-1 shrink-0 text-[#789083]"/></div>{sticker.category&&<p className="mt-2 truncate text-[10px] font-black uppercase tracking-wider text-[#789083]">{sticker.category}</p>}<div className="mt-3 flex gap-1"><button onClick={event=>{event.stopPropagation();toggle(sticker.id,"wanted")}} aria-label="Marcar como me falta" className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${sticker.status==='wanted'?'bg-[#ff6a3d] text-white':'bg-[#f0eee7] text-[#7b776f]'}`}>Me falta</button><button onClick={event=>{event.stopPropagation();toggle(sticker.id,"duplicate")}} aria-label="Marcar como repetido" className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${sticker.status==='duplicate'?'bg-[#c9f31d] text-[#17231b]':'bg-[#f0eee7] text-[#7b776f]'}`}>Repetido</button></div>{sticker.status&&<button onClick={event=>{event.stopPropagation();clearStatus(sticker.id)}} className="mt-2 w-full rounded-lg border border-[#173d2a]/15 py-2 text-[11px] font-bold text-[#65756b] hover:bg-[#f0eee7]">Desmarcar</button>}</div>
        </article>)}
      </section>
      {!visible.length && <div className="rounded-2xl border border-dashed border-[#173d2a]/25 bg-white/50 px-6 py-14 text-center"><Album className="mx-auto mb-3 text-[#789083]"/><h2 className="text-lg font-black">Todavía no has marcado ningún cromo</h2><p className="mt-1 text-sm text-[#65756b]">Usa “Añadir varios cromos” para registrar tus faltantes o repetidos.</p></div>}
      {selectedSticker&&<StickerDetail sticker={selectedSticker} close={()=>setSelectedId(null)} toggle={toggle} clearStatus={clearStatus}/>} 
    </main>
  </div>;
}

function Stat({value,label}:{value:number,label:string}) { return <div className="border-r border-[#173d2a]/10 px-2 py-4 last:border-0"><strong className="block text-2xl font-black">{value}</strong><span className="text-xs font-semibold text-[#6e7d74]">{label}</span></div> }

type TeamPalette={primary:string;secondary:string;ink:string;soft:string};
const teamPalettes:Record<string,TeamPalette>={
  "deportivo alaves":{primary:"#1763a6",secondary:"#ffffff",ink:"#123d67",soft:"#e5f1fb"},"athletic club de bilbao":{primary:"#d71920",secondary:"#ffffff",ink:"#111111",soft:"#fff0f0"},"atletico de madrid":{primary:"#d71920",secondary:"#ffffff",ink:"#1b2b52",soft:"#fff0f0"},"fc barcelona":{primary:"#a50044",secondary:"#004d98",ink:"#061f45",soft:"#f3e9ef"},"real betis":{primary:"#168c4b",secondary:"#ffffff",ink:"#12572f",soft:"#e7f5ec"},"rc celta de vigo":{primary:"#8ac8e8",secondary:"#ffffff",ink:"#244e70",soft:"#eaf7fc"},"deportivo":{primary:"#1763a6",secondary:"#ffffff",ink:"#123d67",soft:"#e5f1fb"},"elche cf":{primary:"#168c4b",secondary:"#ffffff",ink:"#173d2a",soft:"#e9f6ed"},"rcd espanyol":{primary:"#1975bd",secondary:"#ffffff",ink:"#17446b",soft:"#e8f3fb"},"getafe cf":{primary:"#1255a3",secondary:"#f2f7ff",ink:"#0b356a",soft:"#e7f0fb"},"levante ud":{primary:"#b71833",secondary:"#1d4f91",ink:"#142d55",soft:"#f3e8ed"},"real madrid cf":{primary:"#ffffff",secondary:"#d8b766",ink:"#172b56",soft:"#f6f3e9"},"malaga cf":{primary:"#63b6df",secondary:"#ffffff",ink:"#1e5471",soft:"#e8f6fc"},"osasuna":{primary:"#c7182a",secondary:"#15345b",ink:"#102844",soft:"#f8e8ea"},"racing de santander":{primary:"#159447",secondary:"#ffffff",ink:"#124d2b",soft:"#e8f6ed"},"rayo vallecano":{primary:"#ffffff",secondary:"#df1e35",ink:"#313131",soft:"#f7eeee"},"real sociedad":{primary:"#1986c8",secondary:"#ffffff",ink:"#164e72",soft:"#e7f4fb"},"sevilla":{primary:"#ffffff",secondary:"#d71920",ink:"#272727",soft:"#faeeee"},"valencia":{primary:"#ffffff",secondary:"#f39819",ink:"#1d1d1d",soft:"#fff2df"},"villarreal":{primary:"#ffe147",secondary:"#1763a6",ink:"#173e68",soft:"#fff9d8"},
  "adn / laliga prime":{primary:"#7d22ce",secondary:"#e6ff39",ink:"#351052",soft:"#f3e9fc"},"laliga fantasy":{primary:"#00a7a7",secondary:"#d7ff45",ink:"#075252",soft:"#e5f8f6"},"draft 23":{primary:"#ea5b24",secondary:"#232323",ink:"#3b2118",soft:"#fff0e8"},"draft 23 kromix":{primary:"#ec3da6",secondary:"#33d3c8",ink:"#522043",soft:"#fdebf7"},"extra sticker bronce":{primary:"#b97845",secondary:"#f1c49b",ink:"#59351e",soft:"#faeee4"},"extra sticker plata":{primary:"#9da6ae",secondary:"#f4f6f7",ink:"#424a50",soft:"#eff2f4"},"extra sticker oro":{primary:"#d5a919",secondary:"#fff0a0",ink:"#59460d",soft:"#fbf3d7"}
};
const fallbackPalettes:TeamPalette[]=[{primary:"#164f35",secondary:"#c9f31d",ink:"#123e2a",soft:"#edf7d6"},{primary:"#204c61",secondary:"#8ee2e7",ink:"#173848",soft:"#e5f6f7"},{primary:"#3d315b",secondary:"#c5a9ff",ink:"#2b213f",soft:"#f0eaff"}];
function paletteFor(value:string){const key=normalize(value);if(teamPalettes[key])return teamPalettes[key];let hash=0;for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))>>>0;return fallbackPalettes[hash%fallbackPalettes.length]}
function categoryColor(value:string|null){const key=normalize(value||"");if(key.includes("portero"))return{bg:"#f4c430",text:"#332800"};if(key.includes("defensa"))return{bg:"#2186d1",text:"#fff"};if(key.includes("medio"))return{bg:"#25a55f",text:"#fff"};if(key.includes("delantero"))return{bg:"#f05a35",text:"#fff"};if(key.includes("entrenador"))return{bg:"#7756b3",text:"#fff"};if(key.includes("oro"))return{bg:"#d5a919",text:"#342900"};if(key.includes("plata"))return{bg:"#9da6ae",text:"#202428"};if(key.includes("bronce"))return{bg:"#b97845",text:"#fff"};return{bg:"#17231b",text:"#fff"}}
function StickerArtwork({sticker,large=false}:{sticker:Sticker;large?:boolean}){const palette=paletteFor(sticker.section),category=categoryColor(sticker.category);return <div className={`relative overflow-hidden ${large?"aspect-[4/3] rounded-2xl":"aspect-[4/3]"}`} style={{background:`linear-gradient(145deg,${palette.soft},#fff 68%)`}}><div className="absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-75" style={{background:palette.primary}}/><div className="absolute -bottom-12 -left-10 h-32 w-32 rotate-12 rounded-[2rem]" style={{background:palette.ink}}/><span className="absolute left-3 top-3 z-10 rounded-md bg-white/95 px-2 py-1 font-mono text-xs font-black shadow-sm">#{sticker.code}</span><div className="absolute inset-0 grid place-items-center"><TeamEmblem team={sticker.section} palette={palette} large={large}/></div>{sticker.quantity&&<span className="absolute right-3 top-3 rounded-full bg-[#ff6a3d] px-2 py-1 text-xs font-black text-white">×{sticker.quantity}</span>}<span className="absolute bottom-3 right-3 max-w-[65%] truncate rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider" style={{background:category.bg,color:category.text}}>{sticker.category||"Colección base"}</span></div>}
function teamPattern(team:string,palette:TeamPalette){const key=normalize(team);const vertical=["deportivo alaves","athletic club de bilbao","atletico de madrid","fc barcelona","real betis","rc celta de vigo","deportivo","elche cf","rcd espanyol","levante ud","malaga cf","racing de santander","real sociedad"],diagonal=["rayo vallecano"],solid=["getafe cf","osasuna","villarreal"],light=["real madrid cf","sevilla","valencia"];if(vertical.includes(key))return `repeating-linear-gradient(90deg,${palette.primary} 0,${palette.primary} 23%,${palette.secondary} 23%,${palette.secondary} 46%)`;if(diagonal.includes(key))return `linear-gradient(125deg,${palette.primary} 0 42%,${palette.secondary} 42% 57%,${palette.primary} 57%)`;if(solid.includes(key))return `radial-gradient(circle at 50% 40%,${palette.secondary} 0 23%,transparent 24%),${palette.primary}`;if(light.includes(key))return `linear-gradient(155deg,${palette.primary} 0 68%,${palette.secondary} 68% 79%,${palette.ink} 79%)`;if(key.includes("oro"))return `linear-gradient(135deg,#fff3a6,#c7960a 48%,#fff0a0)`;if(key.includes("plata"))return `linear-gradient(135deg,#f8fafb,#8f9aa3 48%,#eef1f3)`;if(key.includes("bronce"))return `linear-gradient(135deg,#f0c49c,#9c5b31 48%,#e1a56f)`;return `linear-gradient(135deg,${palette.primary} 0 48%,${palette.secondary} 48% 62%,${palette.primary} 62%)`}
function TeamEmblem({team,palette,large}:{team:string;palette:TeamPalette;large:boolean}){return <div className={`${large?"h-32 w-28":"h-20 w-[4.5rem]"} relative overflow-hidden border-[5px] border-white shadow-xl`} style={{clipPath:"polygon(50% 0,92% 14%,88% 70%,50% 100%,12% 70%,8% 14%)",background:teamPattern(team,palette)}}><div className="absolute inset-[12%] opacity-80" style={{clipPath:"polygon(50% 0,92% 14%,88% 70%,50% 100%,12% 70%,8% 14%)",border:`2px solid ${palette.ink}`}}/><div className={`absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${large?"h-10 w-10":"h-7 w-7"}`} style={{borderColor:palette.ink,background:"rgba(255,255,255,.42)"}}/><div className="absolute bottom-[20%] left-[25%] right-[25%] h-1 rounded-full" style={{background:palette.ink}}/></div>}
function StickerDetail({sticker,close,toggle,clearStatus}:{sticker:Sticker;close:()=>void;toggle:(id:string,status:Exclude<Status,null>)=>Promise<void>;clearStatus:(id:string)=>Promise<void>}){return <div role="dialog" aria-modal="true" aria-label={`Ficha de ${sticker.name??sticker.code}`} onClick={close} className="fixed inset-0 z-[80] grid place-items-end bg-[#101311]/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"><article onClick={event=>event.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-[#f5f6f4] p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem]"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.16em] text-[#527060]">Ficha del cromo</p><button onClick={close} aria-label="Cerrar ficha" className="grid h-10 w-10 place-items-center rounded-full bg-white"><X size={19}/></button></div><StickerArtwork sticker={sticker} large/><h2 className="mt-5 text-3xl font-black tracking-[-.04em]">{sticker.name??`Cromo ${sticker.code}`}</h2><dl className="mt-4 grid grid-cols-2 gap-3"><Info label="Número" value={`#${sticker.code}`}/><Info label="Estado" value={sticker.status==="wanted"?"Me falta":sticker.status==="duplicate"?"Repetido":"Sin marcar"}/><Info label="Equipo" value={sticker.section}/><Info label="Categoría" value={sticker.category||"Colección base"}/></dl><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>toggle(sticker.id,"wanted")} className={`rounded-xl p-3 font-bold ${sticker.status==="wanted"?"bg-[#ff6a3d] text-white":"bg-white"}`}>Me falta</button><button onClick={()=>toggle(sticker.id,"duplicate")} className={`rounded-xl p-3 font-bold ${sticker.status==="duplicate"?"bg-[#c9f31d]":"bg-white"}`}>Repetido</button></div>{sticker.status&&<button onClick={()=>clearStatus(sticker.id)} className="mt-2 w-full rounded-xl border border-[#173d2a]/15 bg-white p-3 text-sm font-bold text-[#65756b]">Desmarcar cromo</button>}</article></div>}
function Info({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-white p-3"><dt className="text-[10px] font-black uppercase tracking-wider text-[#789083]">{label}</dt><dd className="mt-1 truncate text-sm font-bold">{value}</dd></div>}
