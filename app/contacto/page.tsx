"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Mail, MessageSquareText } from "lucide-react";
import AppHeader from "@/components/app-header";
import { createClient } from "@/lib/supabase/client";

type FeedbackKind = "problem" | "suggestion" | "other";

export default function ContactPage() {
  const supabase = useMemo(() => createClient(), []);
  const [kind, setKind] = useState<FeedbackKind>("suggestion");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    if (message.trim().length < 10) { setStatus("Escribe al menos 10 caracteres."); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setStatus("Inicia sesión para enviar el mensaje."); return; }
    const { error } = await supabase.from("feedback_messages").insert({ user_id: user.id, kind, message: message.trim(), page_url: document.referrer || window.location.href });
    setLoading(false);
    if (error) { setStatus("No se pudo enviar. Inténtalo de nuevo dentro de unos minutos."); return; }
    setSent(true);
  };

  return <div className="min-h-screen pb-24 md:pb-12"><AppHeader/><main className="mx-auto max-w-3xl px-4 py-9 md:px-8 md:py-14">
    <p className="text-xs font-black uppercase tracking-[.18em] text-[#527060]">Contacto</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em] md:text-5xl">Ayúdanos a mejorar CromoNexo</h1><p className="mt-3 max-w-2xl text-[#607066]">Cuéntanos si has encontrado un problema o si tienes una idea. Leemos todos los mensajes.</p>
    {sent ? <section className="surface mt-8 rounded-3xl p-8 text-center"><CheckCircle2 className="mx-auto text-[#78a313]" size={50}/><h2 className="mt-4 text-2xl font-black">Mensaje enviado</h2><p className="mt-2 text-[#607066]">Gracias por ayudarnos a mejorar.</p><Link href="/inicio" className="mt-6 inline-flex rounded-xl bg-[#164f35] px-5 py-3 font-bold text-white">Volver al inicio</Link></section> : <form onSubmit={submit} className="surface mt-8 rounded-3xl p-5 md:p-7">
      <label className="block text-sm font-bold">Tipo de mensaje<select value={kind} onChange={event => setKind(event.target.value as FeedbackKind)} className="mt-2 w-full rounded-xl border border-[#173d2a]/20 bg-[#fbfaf5] px-4 py-3 outline-none focus:border-[#164f35]"><option value="suggestion">Sugerencia</option><option value="problem">He encontrado un problema</option><option value="other">Otro</option></select></label>
      <label className="mt-5 block text-sm font-bold">Mensaje<div className="mt-2 flex items-start gap-3 rounded-xl border border-[#173d2a]/20 bg-[#fbfaf5] px-4 focus-within:border-[#164f35]"><MessageSquareText size={18} className="mt-4 shrink-0 text-[#718078]"/><textarea required minLength={10} maxLength={1500} value={message} onChange={event => setMessage(event.target.value)} placeholder="Explícanos tu idea o qué ha ocurrido…" className="min-h-36 w-full resize-y bg-transparent py-3 outline-none"/></div><span className="mt-2 block text-right text-xs font-normal text-[#718078]">{message.length}/1500</span></label>
      <button disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#164f35] px-5 py-3.5 font-bold text-white disabled:opacity-50"><Mail size={18}/>{loading ? "Enviando…" : "Enviar mensaje"}</button>{status && <p role="alert" className="mt-4 rounded-xl bg-[#fff0e8] px-4 py-3 text-sm font-semibold text-[#80391d]">{status}</p>}
    </form>}
  </main></div>;
}
