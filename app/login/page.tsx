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

  return <main className="grid min-h-[100svh] place-items-center bg-[#f5f6f4] px-3 py-5 sm:px-4 sm:py-10">
    <section className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#dfe3df] bg-white shadow-[0_30px_90px_rgba(16,19,17,.1)] md:grid-cols-[.95fr_1.05fr]">
      <div className="flex min-h-64 flex-col justify-between bg-[#101311] px-6 py-7 text-white sm:px-8 sm:py-9 md:min-h-[36rem]"><div className="flex items-center gap-2 text-xl font-black tracking-[-.04em]"><BrandLogo/>CromoNexo</div><div><p className="mb-4 text-xs font-bold uppercase tracking-[.16em] text-[#b6ef22]">tu colección conectada</p><h1 className="text-4xl font-semibold leading-[.95] tracking-[-.06em] sm:text-5xl">cada cromo cuenta.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/55">Organiza, intercambia, compra y vende desde un único lugar.</p></div></div>
      <div className="flex flex-col justify-center p-5 sm:p-8 md:p-10">
        <div className="mb-7"><h2 className="text-3xl font-semibold tracking-[-.05em]">{mode === "login" ? "bienvenido de nuevo" : "crea tu cuenta"}</h2><p className="mt-2 text-sm text-[#737a75]">{mode === "login" ? "entra para continuar con tu colección" : "empieza a organizar tus cromos gratis"}</p></div>
        <div className="mb-6 grid grid-cols-2 rounded-full bg-[#f0f2ef] p-1"><button onClick={() => { setMode("login"); setMessage(""); }} className={`rounded-full py-2.5 text-sm font-semibold ${mode === "login" ? "bg-white shadow-sm" : "text-[#6c736e]"}`}>entrar</button><button onClick={() => { setMode("register"); setMessage(""); }} className={`rounded-full py-2.5 text-sm font-semibold ${mode === "register" ? "bg-white shadow-sm" : "text-[#6c736e]"}`}>crear cuenta</button></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">correo electrónico<div className="mt-2 flex items-center gap-3 rounded-xl border border-[#d9ddd9] px-3 focus-within:border-[#101311]"><Mail size={18} className="text-[#777d79]"/><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full bg-transparent py-3 outline-none"/></div></label>
          <label className="block text-sm font-semibold">contraseña<div className="mt-2 flex items-center gap-3 rounded-xl border border-[#d9ddd9] px-3 focus-within:border-[#101311]"><LockKeyhole size={18} className="text-[#777d79]"/><input type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" className="w-full bg-transparent py-3 outline-none"/></div></label>
          {mode === "login" && <div className="-mt-1 text-right"><Link href="/recuperar-contrasena" className="text-sm font-bold text-[#164f35] underline decoration-[#9ac51e] decoration-2 underline-offset-4">¿Has olvidado tu contraseña?</Link></div>}
          {mode === "register" && <label className="flex items-start gap-3 text-xs leading-5 text-[#596a60]"><input type="checkbox" required checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1 accent-[#164f35]"/><span>Confirmo que tengo al menos 14 años y acepto las <Link href="/condiciones" className="font-black underline">condiciones de uso</Link> y la <Link href="/privacidad" className="font-black underline">política de privacidad</Link>.</span></label>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#101311] px-5 py-3.5 font-semibold text-white transition hover:bg-[#252a27] disabled:opacity-50">{loading ? "espera…" : mode === "login" ? "entrar" : "crear mi cuenta"}<ArrowRight size={18}/></button>
          {message && <p role="status" className="rounded-xl bg-[#f0eee7] px-4 py-3 text-sm font-semibold">{message}</p>}
        </form>
        <Link href="/" className="mt-5 block text-center text-xs font-semibold text-[#777d79] hover:text-[#101311]">← volver a la portada</Link>
      </div>
    </section>
  </main>;
}
