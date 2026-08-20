"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WaitlistForm() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [ageAccepted, setAgeAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ageAccepted || !privacyAccepted) { setStatus("error"); setMessage("Debes confirmar la edad y aceptar la política de privacidad."); return; }
    setStatus("loading"); setMessage("");
    const { error } = await supabase.from("waitlist_entries").insert({
      email: email.trim().toLowerCase(), display_name: name.trim() || null, city: city.trim() || null,
    });
    if (error?.code === "23505") { setStatus("success"); setMessage("Ya estabas apuntado. Te avisaremos cuando abramos la beta."); return; }
    if (error) { setStatus("error"); setMessage("No hemos podido guardar tus datos. Comprueba que la migración de Supabase esté aplicada."); return; }
    setStatus("success"); setMessage("¡Ya estás dentro! Te avisaremos cuando abramos las primeras plazas.");
    setEmail(""); setName(""); setCity("");
  };

  if (status === "success") return <div className="mx-auto max-w-xl rounded-3xl bg-white p-7 text-left text-[#173d2a] shadow-xl"><CheckCircle2 size={36} className="text-[#7fa800]"/><h3 className="mt-4 text-2xl font-black">Apuntado a la beta</h3><p className="mt-2 text-[#617168]">{message}</p></div>;

  return <form onSubmit={submit} className="mx-auto mt-9 max-w-2xl rounded-3xl bg-white p-5 text-left shadow-[0_18px_45px_rgba(41,67,28,.16)] md:p-7">
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-black">Nombre o alias<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} placeholder="Cómo quieres que te llamemos" className="mt-2 w-full rounded-xl border border-[#173d2a]/15 bg-[#f8f7f1] px-4 py-3 outline-none"/></label><label className="text-sm font-black">Ciudad <span className="font-medium text-[#718078]">(opcional)</span><input value={city} onChange={e=>setCity(e.target.value)} maxLength={80} placeholder="Por ejemplo, Sevilla" className="mt-2 w-full rounded-xl border border-[#173d2a]/15 bg-[#f8f7f1] px-4 py-3 outline-none"/></label></div>
    <label className="mt-3 block text-sm font-black">Correo electrónico<div className="mt-2 flex items-center gap-3 rounded-xl border border-[#173d2a]/15 bg-[#f8f7f1] px-4"><Mail size={18} className="text-[#718078]"/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" className="w-full bg-transparent py-3 outline-none"/></div></label>
    <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-[#53665a]"><input type="checkbox" required checked={ageAccepted} onChange={e=>setAgeAccepted(e.target.checked)} className="mt-1 accent-[#173d2a]"/><span>Confirmo que tengo al menos 14 años.</span></label>
    <label className="mt-2 flex items-start gap-3 text-xs leading-5 text-[#53665a]"><input type="checkbox" required checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)} className="mt-1 accent-[#173d2a]"/><span>Acepto el tratamiento de mis datos para gestionar la lista de espera según la <Link href="/privacidad" className="font-black underline">política de privacidad</Link>.</span></label>
    <button disabled={status==="loading"} className="mt-5 w-full rounded-xl bg-[#173d2a] px-6 py-4 font-black text-white transition hover:bg-[#287051] disabled:opacity-50">{status==="loading"?"Guardando…":"Quiero probar CromoNexo"}</button>
    {status==="error"&&<p role="alert" className="mt-3 rounded-xl bg-[#fff0e9] p-3 text-sm font-bold text-[#a34326]">{message}</p>}
  </form>;
}
