"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Clock3, Flag, Plus, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type S = { id:string; number:string; name:string|null; team:string };
type Seller = { display_name:string|null; username:string|null; city:string|null };
type Relation<T> = T|T[]|null;
type L = { id:string; seller_id:string; price_cents:number; verification_id?:string|null; seller:Relation<Seller>; sticker:Relation<S> };
type VerificationRow = { verification_id:string; verification_code:string; expires_at:string };
type Verification = { id:string; code:string; expiresAt:string };
type PhotoKind = "front"|"back"|"proof";

const one = <T,>(value:Relation<T>) => Array.isArray(value) ? value[0] ?? null : value;

export default function MarketClient({ userId, listings, availableStickers }:{ userId:string; listings:L[]; availableStickers:S[] }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [open,setOpen] = useState(false);
  const [sticker,setSticker] = useState(availableStickers[0]?.id ?? "");
  const [price,setPrice] = useState("1.00");
  const [message,setMessage] = useState("");
  const [verification,setVerification] = useState<Verification|null>(null);
  const [photos,setPhotos] = useState<Partial<Record<PhotoKind,File>>>({});
  const [loading,setLoading] = useState(false);

  const resetVerification = () => { setVerification(null); setPhotos({}); setMessage(""); };
  const startVerification = async () => {
    if (!sticker) return;
    setLoading(true); setMessage("");
    const { data,error } = await supabase.rpc("start_listing_verification", { p_sticker_id:sticker });
    const row = (data as VerificationRow[]|null)?.[0];
    if (error || !row) setMessage("No se pudo generar el código. Inténtalo de nuevo.");
    else { setVerification({id:row.verification_id,code:row.verification_code,expiresAt:row.expires_at}); setPhotos({}); }
    setLoading(false);
  };
  const setPhoto = (kind:PhotoKind,file?:File) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8*1024*1024) {
      setMessage("Cada foto debe ser JPG, PNG o WebP y pesar menos de 8 MB."); return;
    }
    setPhotos(current => ({...current,[kind]:file})); setMessage("");
  };
  const uploadPhoto = async (kind:PhotoKind,file:File) => {
    if (!verification) throw new Error("verification missing");
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${verification.id}/${kind}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("sticker-verifications").upload(path,file,{contentType:file.type,upsert:false});
    if (error) throw error;
    return path;
  };
  const publish = async () => {
    const cents = Math.round(Number(price.replace(",","."))*100);
    if (!sticker || !Number.isInteger(cents) || cents<1) { setMessage("Introduce un cromo y un precio válido."); return; }
    if (!verification) { setMessage("Genera primero el código de comprobación."); return; }
    if (!photos.front || !photos.back || !photos.proof) { setMessage("Añade las tres fotografías antes de publicar."); return; }
    if (new Date(verification.expiresAt) <= new Date()) { setMessage("El código ha caducado. Genera uno nuevo."); return; }
    setLoading(true); setMessage("Subiendo las fotografías…");
    try {
      const [frontPath,backPath,proofPath] = await Promise.all([
        uploadPhoto("front",photos.front),uploadPhoto("back",photos.back),uploadPhoto("proof",photos.proof),
      ]);
      const { error:submitError } = await supabase.rpc("submit_listing_verification",{
        p_verification_id:verification.id,p_front_path:frontPath,p_back_path:backPath,p_proof_path:proofPath,
      });
      if (submitError) throw submitError;
      const { error:listingError } = await supabase.rpc("create_verified_market_listing",{
        p_sticker_id:sticker,p_price_cents:cents,p_verification_id:verification.id,
      });
      if (listingError) throw listingError;
      setMessage("Anuncio publicado con prueba fotográfica."); setOpen(false); resetVerification(); router.refresh();
    } catch { setMessage("No se pudo completar la comprobación. Revisa las fotos o genera un código nuevo."); }
    finally { setLoading(false); }
  };
  const request = async (id:string) => {
    const {error}=await supabase.rpc("request_market_purchase",{p_listing_id:id,p_message:null});
    setMessage(error?"No se pudo enviar la solicitud.":"Solicitud de compra enviada al vendedor.");
  };

  return <>
    <div className="my-7 flex flex-wrap justify-end gap-3"><Link href="/mercado/solicitudes" className="rounded-xl border border-[#164f35] px-5 py-3 font-bold">Mis solicitudes</Link><button onClick={()=>setOpen(!open)} className="flex items-center gap-2 rounded-xl bg-[#164f35] px-5 py-3 font-bold text-white"><Plus/>Publicar cromo</button></div>
    <aside className="mb-5 rounded-2xl border border-[#d3b85f]/30 bg-[#fff9df] p-4 text-sm text-[#64572e]"><strong>Compra con prudencia.</strong> CromoNexo no procesa pagos ni envíos. La prueba fotográfica acredita que se aportaron imágenes recientes, pero no certifica oficialmente la autenticidad. <Link href="/condiciones" className="font-black underline">Ver normas</Link>.</aside>
    {open&&<section className="mb-6 rounded-3xl border border-[#173d2a]/10 bg-white p-5 shadow-sm md:p-7">
      <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e6f1db] text-[#164f35]"><ShieldCheck/></span><div><h2 className="text-xl font-black">Comprobar y publicar</h2><p className="mt-1 text-sm text-[#65756b]">Selecciona el cromo, genera el código y sube tres fotografías tomadas ahora.</p></div></div>
      {availableStickers.length?<div className="mt-6 grid gap-3 sm:grid-cols-[1fr_160px]"><select value={sticker} onChange={e=>{setSticker(e.target.value);resetVerification();}} className="min-w-0 rounded-xl border p-3">{availableStickers.map(s=><option key={s.id} value={s.id}>{s.team} · #{s.number} · {s.name??"Sin asignar"}</option>)}</select><label className="flex items-center rounded-xl border px-3"><input value={price} onChange={e=>setPrice(e.target.value)} inputMode="decimal" className="w-full py-3 outline-none"/> €</label></div>:<p className="mt-3 text-sm">No se pudo cargar el catálogo.</p>}
      {!verification?<button onClick={startVerification} disabled={loading||!sticker} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17231b] px-5 py-3.5 font-bold text-white disabled:opacity-50"><Camera size={18}/>Generar código de comprobación</button>:<>
        <div className="mt-5 rounded-2xl bg-[#17231b] p-5 text-white"><p className="text-xs font-bold uppercase tracking-[.16em] text-white/55">Escribe este código en un papel</p><strong className="mt-2 block font-mono text-3xl tracking-wider text-[#c9f31d]">{verification.code}</strong><p className="mt-3 flex items-center gap-2 text-xs text-white/60"><Clock3 size={14}/>Caduca en 30 minutos. Coloca el papel junto al cromo para la tercera foto.</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><PhotoInput label="Parte delantera" selected={photos.front} onFile={file=>setPhoto("front",file)}/><PhotoInput label="Parte trasera" selected={photos.back} onFile={file=>setPhoto("back",file)}/><PhotoInput label={`Cromo + ${verification.code}`} selected={photos.proof} onFile={file=>setPhoto("proof",file)}/></div>
        <button onClick={publish} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#164f35] px-5 py-3.5 font-bold text-white disabled:opacity-50"><ShieldCheck size={18}/>{loading?"Comprobando…":"Publicar con prueba fotográfica"}</button>
      </>}
    </section>}
    {message&&<p role="status" className="mb-5 rounded-xl bg-white p-3 text-sm font-bold">{message}</p>}
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.map(l=>{const s=one(l.sticker),seller=one(l.seller);return <article key={l.id} className="rounded-2xl border border-[#173d2a]/15 bg-white p-5"><div className="flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e6f1db] font-black text-[#164f35]">#{s?.number}</div>{l.verification_id&&<span className="flex items-center gap-1 rounded-full bg-[#e6f1db] px-2.5 py-1 text-[10px] font-black uppercase text-[#164f35]"><ShieldCheck size={13}/>Fotos aportadas</span>}</div><h2 className="mt-4 font-black">{s?.name??s?.team}</h2><p className="text-xs text-[#718078]">{s?.team}</p><p className="mt-4 text-2xl font-black">{(l.price_cents/100).toFixed(2).replace(".",",")} €</p><p className="mt-1 text-xs text-[#718078]">{seller?.display_name||seller?.username||"Coleccionista"}{seller?.city?` · ${seller.city}`:""}</p>{l.seller_id===userId?<span className="mt-4 block rounded-xl bg-[#f0eee7] p-3 text-center text-sm font-bold">Tu anuncio</span>:<><button onClick={()=>request(l.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#164f35] p-3 text-sm font-bold text-white"><ShoppingBag size={17}/>Solicitar compra</button><ReportButton listingId={l.id} onMessage={setMessage}/></>}</article>})}</section>
    {!listings.length&&<div className="rounded-2xl border border-dashed p-12 text-center"><Store className="mx-auto"/><h2 className="mt-3 font-black">Todavía no hay anuncios</h2></div>}
  </>;
}

function PhotoInput({label,selected,onFile}:{label:string;selected?:File;onFile:(file?:File)=>void}) {
  return <label className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-3 text-center ${selected?"border-[#7fa800] bg-[#f4fbdc]":"border-[#173d2a]/25 bg-[#fafbf9]"}`}><Camera size={21} className="mb-2 text-[#557064]"/><span className="text-xs font-black">{selected?"Foto añadida":label}</span>{selected&&<small className="mt-1 max-w-full truncate text-[10px] text-[#6d7b72]">{selected.name}</small>}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={e=>onFile(e.target.files?.[0])}/></label>;
}

type ReportReason="fraud"|"prohibited"|"misleading"|"harassment"|"other";
function ReportButton({listingId,onMessage}:{listingId:string;onMessage:(message:string)=>void}){const supabase=useMemo(()=>createClient(),[]),[open,setOpen]=useState(false),[reason,setReason]=useState<ReportReason>("misleading"),[details,setDetails]=useState("");const submit=async()=>{const {error}=await supabase.rpc("report_market_listing",{p_listing_id:listingId,p_reason:reason,p_details:details||null});onMessage(error?"No se pudo enviar la denuncia.":"Denuncia enviada. Gracias por ayudar a proteger la comunidad.");if(!error)setOpen(false)};return <div className="mt-2">{!open?<button onClick={()=>setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#718078] hover:bg-[#f5f2e9]"><Flag size={14}/>Denunciar anuncio</button>:<div className="rounded-xl bg-[#f5f2e9] p-3"><label className="text-xs font-black">Motivo<select value={reason} onChange={e=>setReason(e.target.value as ReportReason)} className="mt-1 w-full rounded-lg border bg-white p-2"><option value="misleading">Información engañosa</option><option value="fraud">Posible fraude</option><option value="prohibited">Artículo prohibido</option><option value="harassment">Acoso</option><option value="other">Otro</option></select></label><textarea value={details} onChange={e=>setDetails(e.target.value)} maxLength={500} placeholder="Describe el problema (opcional)" className="mt-2 min-h-20 w-full rounded-lg border bg-white p-2 text-xs"/><div className="mt-2 flex gap-2"><button onClick={submit} className="flex-1 rounded-lg bg-[#173d2a] p-2 text-xs font-bold text-white">Enviar</button><button onClick={()=>setOpen(false)} className="rounded-lg border px-3 text-xs font-bold">Cancelar</button></div></div>}</div>}
