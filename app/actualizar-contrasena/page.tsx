"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/client";

export default function ActualizarContrasenaPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setReady(Boolean(data.user));
      if (!data.user) setMessage("El enlace no es válido o ha caducado. Solicita uno nuevo.");
    });
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage("No hemos podido actualizar la contraseña. Solicita un enlace nuevo.");
      return;
    }
    setSuccess(true);
  };

  return <main className="grid min-h-[100svh] place-items-center bg-[#f5f2e9] px-3 py-5 sm:px-4 sm:py-10">
    <section className="w-full max-w-md overflow-hidden rounded-3xl border border-[#173d2a]/15 bg-white shadow-[0_24px_70px_rgba(23,35,27,.12)]">
      <div className="bg-[#164f35] px-5 py-6 text-white sm:px-7 sm:py-8">
        <div className="mb-5 flex items-center gap-2 text-xl font-black tracking-[-.04em]"><BrandLogo className="ring-2 ring-white/15"/>CromoNexo</div>
        <h1 className="text-2xl font-black tracking-[-.04em] sm:text-3xl">Crea una contraseña nueva</h1>
        <p className="mt-2 text-sm text-white/70">Utiliza al menos 8 caracteres.</p>
      </div>
      <div className="p-5 sm:p-7">
        {success ? <div className="space-y-5 text-center">
          <CheckCircle2 className="mx-auto text-[#78a313]" size={48}/>
          <div><p className="text-xl font-black">Contraseña actualizada</p><p className="mt-2 text-sm text-[#596a60]">Ya puedes entrar en CromoNexo con tu nueva contraseña.</p></div>
          <Link href="/login" className="block rounded-xl bg-[#164f35] px-5 py-3.5 font-bold text-white">Ir al inicio de sesión</Link>
        </div> : <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-bold">Nueva contraseña<div className="mt-2 flex items-center gap-3 rounded-xl border border-[#173d2a]/20 px-3 focus-within:border-[#164f35]"><LockKeyhole size={18} className="text-[#718078]"/><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full bg-transparent py-3 outline-none"/></div></label>
          <label className="block text-sm font-bold">Repite la contraseña<div className="mt-2 flex items-center gap-3 rounded-xl border border-[#173d2a]/20 px-3 focus-within:border-[#164f35]"><LockKeyhole size={18} className="text-[#718078]"/><input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full bg-transparent py-3 outline-none"/></div></label>
          <button disabled={loading || !ready} className="w-full rounded-xl bg-[#164f35] px-5 py-3.5 font-bold text-white shadow-[0_5px_0_#0d3624] active:translate-y-1 active:shadow-none disabled:opacity-50">{loading ? "Guardando…" : "Guardar nueva contraseña"}</button>
          {message && <p role="alert" className="rounded-xl bg-[#fff0e8] px-4 py-3 text-sm font-semibold text-[#80391d]">{message}</p>}
          {!ready && <Link href="/recuperar-contrasena" className="block text-center text-sm font-bold text-[#164f35] underline">Solicitar otro enlace</Link>}
        </form>}
      </div>
    </section>
  </main>;
}
