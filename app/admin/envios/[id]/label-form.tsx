"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function LabelForm({orderId, tracking}: {orderId: string; tracking?: string | null}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/admin/envios/${orderId}`, {method: "POST", body: new FormData(form)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar.");
      setMessage("Etiqueta guardada. El vendedor ya puede descargarla desde su pedido.");
      router.refresh();
    } catch (e) {setMessage(e instanceof Error ? e.message : "Error de conexión.");}
    finally {setBusy(false);}
  }
  return <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border bg-white p-5">
    <h2 className="text-xl font-black">Registrar el envío contratado</h2>
    <p className="text-sm text-[#65756b]">Contrata Correos por tu cuenta con los datos de arriba y sube la etiqueta. El vendedor confirmará la entrega física del paquete.</p>
    <label className="block text-sm font-bold">Número de seguimiento<input required name="tracking" pattern="[a-zA-Z0-9-]{5,80}" maxLength={80} defaultValue={tracking || ""} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>
    <label className="block text-sm font-bold">Etiqueta PDF (máximo 4 MB)<input required type="file" name="label" accept="application/pdf,.pdf" className="mt-1 block w-full rounded-xl border p-3 font-normal"/></label>
    <button disabled={busy} className="rounded-xl bg-[#164f35] px-5 py-3 font-bold text-white disabled:opacity-40">{busy ? "Guardando…" : "Guardar etiqueta y seguimiento"}</button>
    {message && <p role="status" className="text-sm font-semibold">{message}</p>}
  </form>;
}
