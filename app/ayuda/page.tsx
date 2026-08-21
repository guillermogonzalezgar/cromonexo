import Link from "next/link";
import { CircleHelp, Mail, Repeat2, ShieldCheck, ShoppingBag, Sticker } from "lucide-react";
import AppHeader from "@/components/app-header";

const topics = [
  { icon: Sticker, title: "Organizar mi colección", text: "Marca únicamente los cromos que te faltan o tienes repetidos. También puedes añadir varios números de una vez." },
  { icon: Repeat2, title: "Cómo funcionan los matches", text: "Existe un match cuando ambos tenéis al menos un cromo que el otro busca. Las coincidencias aparecen ordenadas por compatibilidad." },
  { icon: ShoppingBag, title: "Mercado", text: "Puedes publicar cromos y recibir solicitudes. CromoNexo no procesa pagos, cobros ni envíos; el acuerdo se realiza entre usuarios." },
  { icon: ShieldCheck, title: "Intercambios seguros", text: "No compartas contraseñas ni códigos. Comprueba el estado de los cromos y acuerda claramente la entrega con la otra persona." },
];

export default function HelpPage() {
  return <div className="min-h-screen pb-24 md:pb-12"><AppHeader/><main className="mx-auto max-w-5xl px-4 py-9 md:px-8 md:py-14"><div className="max-w-2xl"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#527060]"><CircleHelp size={16}/>Centro de ayuda</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">¿Cómo podemos ayudarte?</h1><p className="mt-3 text-[#607066]">Una guía rápida para utilizar CromoNexo y cuidar la comunidad.</p></div><section className="mt-8 grid gap-4 sm:grid-cols-2">{topics.map(({icon:Icon,title,text})=><article key={title} className="surface rounded-3xl p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e5efd9] text-[#287051]"><Icon size={21}/></span><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[#65756b]">{text}</p></article>)}</section><section className="mt-6 rounded-3xl bg-[#173d2a] p-6 text-white md:p-8"><h2 className="text-2xl font-black">¿Tienes otra duda o sugerencia?</h2><p className="mt-2 text-white/65">Escríbenos desde el formulario o mediante correo electrónico.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link href="/contacto" className="inline-flex items-center justify-center rounded-xl bg-[#c9f31d] px-5 py-3 font-black text-[#173d2a]">Enviar una sugerencia</Link><a href="mailto:hola@cromonexo.com" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-bold"><Mail size={17}/>hola@cromonexo.com</a></div></section></main></div>;
}
