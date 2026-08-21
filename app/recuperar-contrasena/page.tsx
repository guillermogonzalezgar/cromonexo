"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/actualizar-contrasena`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);
    if (error) {
      setMessage("No hemos podido enviar el correo. Espera unos minutos e inténtalo de nuevo.");
      return;
    }

    setSent(true);
  };

  return <main className="grid min-h-[100svh] place-items-center bg-[#f5f2e9] px-3 py-5 sm:px-4 sm:py-10">
    <section className="w-full max-w-md overflow-hidden rounded-3xl border border-[#173d2a]/15 bg-white shadow-[0_24px_70px_rgba(23,35,27,.12)]">
      <div className="bg-[#164f35] px-5 py-6 text-white sm:px-7 sm:py-8">
        <div className="mb-5 flex items-center gap-2 text-xl font-black tracking-[-.04em]"><BrandLogo className="ring-2 ring-white/15"/>CromoNexo</div>
        <h1 className="text-2xl font-black tracking-[-.04em] sm:text-3xl">Recupera tu contraseña</h1>
        <p className="mt-2 text-sm text-white/70">Te enviaremos un enlace seguro por correo.</p>
      </div>
      <div className="p-5 sm:p-7">
        {sent ? <div role="status" className="space-y-4">
          <div className="rounded-2xl bg-[#eef6d3] p-5 text-sm leading-6 text-[#164f35]">
            <p className="font-black">Revisa tu correo</p>
            <p className="mt-1">Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un enlace para crear una contraseña nueva. Revisa también la carpeta de spam.</p>
          </div>
          <Link href="/login" className="flex items-center justify-center gap-2 rounded-xl border border-[#164f35]/20 px-5 py-3.5 font-bold text-[#164f35]"><ArrowLeft size={18}/>Volver al inicio de sesión</Link>
        </div> : <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-bold">Correo electrónico
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#173d2a]/20 px-3 focus-within:border-[#164f35]"><Mail size={18} className="text-[#718078]"/><input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="tu@email.com" className="w-full bg-transparent py-3 outline-none"/></div>
          </label>
          <button disabled={loading} className="w-full rounded-xl bg-[#164f35] px-5 py-3.5 font-bold text-white shadow-[0_5px_0_#0d3624] active:translate-y-1 active:shadow-none disabled:opacity-50">{loading ? "Enviando…" : "Enviar enlace de recuperación"}</button>
          {message && <p role="alert" className="rounded-xl bg-[#fff0e8] px-4 py-3 text-sm font-semibold text-[#80391d]">{message}</p>}
          <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-[#718078] hover:text-[#164f35]"><ArrowLeft size={16}/>Volver al inicio de sesión</Link>
        </form>}
      </div>
    </section>
  </main>;
}
