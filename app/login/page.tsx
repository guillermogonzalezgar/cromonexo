"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    if (mode === "register" && !termsAccepted) { setMessage("Debes confirmar que tienes al menos 14 años y aceptar las condiciones."); return; }
    setLoading(true);
    const supabase = createClient();
    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      setLoading(false);
      if (error) { setMessage(error.message); return; }
      if (!data.session) { setMessage("Revisa tu correo y confirma la cuenta para continuar."); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setMessage("Correo o contraseña incorrectos."); return; }
    }
    router.push("/inicio"); router.refresh();
  };

  return <main className="grid min-h-[100svh] place-items-center bg-[#f5f2e9] px-3 py-5 sm:px-4 sm:py-10">
    <section className="w-full max-w-md overflow-hidden rounded-3xl border border-[#173d2a]/15 bg-white shadow-[0_24px_70px_rgba(23,35,27,.12)]">
      <div className="bg-[#164f35] px-5 py-6 text-white sm:px-7 sm:py-8"><div className="mb-5 flex items-center gap-2 text-xl font-black tracking-[-.04em] sm:mb-7"><BrandLogo className="ring-2 ring-white/15"/>CromoNexo</div><h1 className="text-2xl font-black tracking-[-.04em] sm:text-3xl">Tu próxima pieza está más cerca.</h1><p className="mt-2 text-sm text-white/70">Gestiona faltantes y repetidos en un solo lugar.</p></div>
      <div className="p-5 sm:p-7">
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#f0eee7] p-1"><button onClick={() => { setMode("login"); setMessage(""); }} className={`rounded-lg py-2.5 text-sm font-bold ${mode === "login" ? "bg-white shadow-sm" : "text-[#6c786f]"}`}>Entrar</button><button onClick={() => { setMode("register"); setMessage(""); }} className={`rounded-lg py-2.5 text-sm font-bold ${mode === "register" ? "bg-white shadow-sm" : "text-[#6c786f]"}`}>Crear cuenta</button></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-bold">Correo electrónico<div className="mt-2 flex items-center gap-3 rounded-xl border border-[#173d2a]/20 px-3 focus-within:border-[#164f35]"><Mail size={18} className="text-[#718078]"/><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full bg-transparent py-3 outline-none"/></div></label>
          <label className="block text-sm font-bold">Contraseña<div className="mt-2 flex items-center gap-3 rounded-xl border border-[#173d2a]/20 px-3 focus-within:border-[#164f35]"><LockKeyhole size={18} className="text-[#718078]"/><input type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-transparent py-3 outline-none"/></div></label>
          {mode === "register" && <label className="flex items-start gap-3 text-xs leading-5 text-[#596a60]"><input type="checkbox" required checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1 accent-[#164f35]"/><span>Confirmo que tengo al menos 14 años y acepto las <Link href="/condiciones" className="font-black underline">condiciones de uso</Link> y la <Link href="/privacidad" className="font-black underline">política de privacidad</Link>.</span></label>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#164f35] px-5 py-3.5 font-bold text-white shadow-[0_5px_0_#0d3624] active:translate-y-1 active:shadow-none disabled:opacity-50">{loading ? "Espera…" : mode === "login" ? "Entrar" : "Crear mi cuenta"}<ArrowRight size={18}/></button>
          {message && <p role="status" className="rounded-xl bg-[#f0eee7] px-4 py-3 text-sm font-semibold">{message}</p>}
        </form>
        <Link href="/" className="mt-5 block text-center text-xs font-bold text-[#718078] hover:text-[#164f35]">← Volver a la portada</Link>
      </div>
    </section>
  </main>;
}
