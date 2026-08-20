import Link from "next/link";
import { legal, legalIsComplete } from "@/lib/legal";
import BrandLogo from "@/components/brand-logo";

export default function LegalShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#f5f2e9] px-4 py-10 text-[#17231b] md:py-16">
    <article className="mx-auto max-w-3xl rounded-3xl border border-[#173d2a]/12 bg-white p-6 shadow-[0_20px_60px_rgba(23,35,27,.08)] md:p-10">
      <Link href="/" className="inline-flex items-center gap-2 text-lg font-black"><BrandLogo/>Cromo<span className="text-[#7fa800]">Nexo</span></Link>
      {!legalIsComplete && <div className="mt-7 rounded-2xl border border-[#d86a40]/25 bg-[#fff0e9] p-4 text-sm font-bold text-[#9c3f21]">Documento preparado, pero todavía debes completar los datos del responsable antes de publicar la web.</div>}
      <p className="mt-10 text-xs font-black uppercase tracking-[.18em] text-[#287051]">Información legal</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">{title}</h1>
      <p className="mt-4 leading-7 text-[#617168]">{intro}</p>
      <div className="legal-copy mt-10 space-y-8">{children}</div>
      <div className="mt-12 border-t border-[#173d2a]/10 pt-6 text-sm text-[#718078]">Última actualización: {legal.updatedAt}</div>
    </article>
  </main>;
}

export function LegalIdentity() {
  return <dl className="grid gap-3 rounded-2xl bg-[#f5f2e9] p-5 text-sm sm:grid-cols-[150px_1fr]"><dt className="font-black">Responsable</dt><dd>{legal.ownerName}</dd><dt className="font-black">NIF/NIE</dt><dd>{legal.taxId}</dd><dt className="font-black">Domicilio</dt><dd>{legal.address}</dd><dt className="font-black">Teléfono</dt><dd>{legal.phone}</dd><dt className="font-black">Correo</dt><dd>{legal.email}</dd></dl>;
}
