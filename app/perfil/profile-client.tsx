"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CircleHelp, LogOut, MapPin, MessageSquareText, Trash2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AppHeader from "@/components/app-header";

type Profile = { username: string; displayName: string; city: string };

export default function ProfileClient({ userId, email, initialProfile }: { userId: string; email: string; initialProfile: Profile }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage("");
    const username = profile.username.trim().toLowerCase();
    if (username && !/^[a-z0-9_]{3,30}$/.test(username)) { setSaving(false); setMessage("El usuario debe tener entre 3 y 30 caracteres: letras, números o guion bajo."); return; }
    const { error } = await supabase.from("profiles").update({ username: username || null, display_name: profile.displayName.trim() || null, city: profile.city.trim() || null, updated_at: new Date().toISOString() }).eq("id", userId);
    setSaving(false);
    if (error?.code === "23505") setMessage("Ese nombre de usuario ya está ocupado.");
    else if (error) setMessage("No se pudo guardar el perfil. Inténtalo de nuevo.");
    else { setProfile(current => ({ ...current, username })); setMessage("Perfil guardado correctamente."); router.refresh(); }
  };
  const signOut = async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); };
  const deleteAccount = async () => {
    if (deleteConfirmation !== "ELIMINAR") return;
    setDeleting(true); setMessage("");
    const { error } = await supabase.rpc("delete_my_account");
    if (error) { setDeleting(false); setMessage("No se pudo eliminar la cuenta. Inténtalo de nuevo o contacta con nosotros."); return; }
    await supabase.auth.signOut(); router.push("/"); router.refresh();
  };

  return <div className="min-h-screen pb-24 md:pb-12">
    <AppHeader active="profile"/>
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#527060]">Tu cuenta</p><h1 className="text-4xl font-black tracking-[-.05em] md:text-5xl">Mi perfil</h1><p className="mt-3 text-[#607066]">La información básica que verán otros coleccionistas.</p></div>
      <div className="grid gap-5 md:grid-cols-[1fr_280px]">
        <form onSubmit={save} className="surface rounded-3xl p-5 md:p-7">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#e6f1db] text-[#164f35]"><UserRound size={30}/></div>
          <div className="space-y-5">
            <label className="block text-sm font-bold">Nombre visible<input value={profile.displayName} maxLength={80} onChange={e => setProfile({ ...profile, displayName: e.target.value })} placeholder="Cómo quieres que te llamen" className="mt-2 w-full rounded-xl border border-[#173d2a]/20 bg-[#fbfaf5] px-4 py-3 outline-none focus:border-[#164f35]"/></label>
            <label className="block text-sm font-bold">Nombre de usuario<div className="mt-2 flex items-center rounded-xl border border-[#173d2a]/20 bg-[#fbfaf5] px-4 focus-within:border-[#164f35]"><span className="text-[#718078]">@</span><input value={profile.username} maxLength={30} onChange={e => setProfile({ ...profile, username: e.target.value })} placeholder="tu_usuario" className="w-full bg-transparent py-3 outline-none"/></div></label>
            <label className="block text-sm font-bold">Ciudad o zona aproximada<div className="mt-2 flex items-center gap-2 rounded-xl border border-[#173d2a]/20 bg-[#fbfaf5] px-4 focus-within:border-[#164f35]"><MapPin size={18} className="text-[#718078]"/><input value={profile.city} maxLength={80} onChange={e => setProfile({ ...profile, city: e.target.value })} placeholder="Por ejemplo, Sevilla" className="w-full bg-transparent py-3 outline-none"/></div><span className="mt-2 block text-xs font-normal text-[#718078]">No introduzcas una dirección exacta.</span></label>
            <label className="block text-sm font-bold">Correo<input value={email} readOnly className="mt-2 w-full rounded-xl border border-[#173d2a]/10 bg-[#efede7] px-4 py-3 text-[#718078]"/></label>
          </div>
          <button disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#164f35] px-5 py-3.5 font-bold text-white shadow-[0_5px_0_#0d3624] active:translate-y-1 active:shadow-none disabled:opacity-50"><Check size={18}/>{saving ? "Guardando…" : "Guardar perfil"}</button>
          {message && <p role="status" className="mt-4 rounded-xl bg-[#f0eee7] px-4 py-3 text-sm font-semibold">{message}</p>}
        </form>
        <aside className="h-fit rounded-2xl border border-[#173d2a]/15 bg-white p-5"><h2 className="font-black">Cuenta</h2><p className="mt-2 text-sm text-[#65756b]">Tu sesión está protegida por Supabase Auth.</p><div className="mt-5 space-y-2"><Link href="/ayuda" className="flex w-full items-center gap-2 rounded-xl border border-[#173d2a]/15 px-4 py-3 text-sm font-bold"><CircleHelp size={17}/>Centro de ayuda</Link><Link href="/contacto" className="flex w-full items-center gap-2 rounded-xl border border-[#173d2a]/15 px-4 py-3 text-sm font-bold"><MessageSquareText size={17}/>Enviar sugerencia</Link><button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#173d2a]/20 px-4 py-3 text-sm font-bold"><LogOut size={17}/>Cerrar sesión</button></div><div className="mt-5 border-t border-[#173d2a]/10 pt-5">{!deleteOpen?<button onClick={()=>setDeleteOpen(true)} className="flex items-center gap-2 text-xs font-bold text-[#a53f27]"><Trash2 size={15}/>Eliminar mi cuenta</button>:<div className="rounded-xl bg-[#fff0e8] p-3"><p className="text-xs font-black text-[#80391d]">Esta acción elimina definitivamente tu perfil, colección, propuestas y anuncios.</p><label className="mt-3 block text-xs font-bold">Escribe ELIMINAR<input value={deleteConfirmation} onChange={event=>setDeleteConfirmation(event.target.value)} className="mt-1 w-full rounded-lg border border-[#80391d]/20 bg-white px-3 py-2 outline-none"/></label><div className="mt-2 flex gap-2"><button onClick={deleteAccount} disabled={deleteConfirmation!=="ELIMINAR"||deleting} className="flex-1 rounded-lg bg-[#a53f27] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{deleting?"Eliminando…":"Eliminar definitivamente"}</button><button onClick={()=>{setDeleteOpen(false);setDeleteConfirmation("")}} className="rounded-lg border border-[#173d2a]/15 bg-white px-3 py-2 text-xs font-bold">Cancelar</button></div></div>}</div></aside>
      </div>
    </main>
  </div>;
}
