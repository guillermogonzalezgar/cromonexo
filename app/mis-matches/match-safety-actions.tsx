"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Flag, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MatchSafetyActions({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");

  const report = async () => {
    const { error } = await supabase.rpc("report_user", { p_reported_id: userId, p_reason: reason, p_details: details || null });
    setMessage(error ? "No se pudo enviar la denuncia." : "Denuncia enviada. Gracias.");
    if (!error) setReporting(false);
  };
  const block = async () => {
    if (!window.confirm("¿Quieres bloquear a este usuario? Dejará de aparecer en tus matches.")) return;
    const { error } = await supabase.rpc("block_user", { p_blocked_id: userId });
    if (error) { setMessage("No se pudo bloquear al usuario."); return; }
    router.refresh();
  };

  return <div className="relative text-left"><button onClick={()=>setOpen(value=>!value)} aria-label="Opciones de seguridad" className="grid h-11 w-11 place-items-center rounded-xl border border-[#173d2a]/15 bg-white"><MoreHorizontal size={18}/></button>{open&&<div className="absolute bottom-13 left-0 z-20 w-64 rounded-2xl border border-[#173d2a]/15 bg-white p-3 shadow-xl sm:left-auto sm:right-0">{reporting?<div><label className="text-xs font-black">Motivo<select value={reason} onChange={event=>setReason(event.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2"><option value="spam">Spam</option><option value="fraud">Posible fraude</option><option value="harassment">Acoso</option><option value="other">Otro</option></select></label><textarea value={details} onChange={event=>setDetails(event.target.value)} maxLength={500} placeholder="Detalles opcionales" className="mt-2 min-h-20 w-full rounded-lg border p-2 text-xs"/><div className="mt-2 flex gap-2"><button onClick={report} className="flex-1 rounded-lg bg-[#173d2a] p-2 text-xs font-bold text-white">Enviar</button><button onClick={()=>setReporting(false)} className="rounded-lg border px-3 text-xs font-bold">Cancelar</button></div></div>:<div className="space-y-1"><button onClick={()=>setReporting(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold hover:bg-[#f5f2e9]"><Flag size={15}/>Denunciar usuario</button><button onClick={block} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#a53f27] hover:bg-[#fff0e8]"><Ban size={15}/>Bloquear usuario</button></div>}{message&&<p className="mt-2 text-xs font-bold text-[#607066]">{message}</p>}</div>}</div>;
}
