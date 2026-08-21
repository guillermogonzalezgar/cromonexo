import Link from "next/link";
import { Album, CircleHelp, Home, Repeat2, Store, UserRound } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import HeaderAlerts from "@/components/header-alerts";

const links = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/mi-coleccion", label: "Colección", icon: Album },
  { href: "/mis-matches", label: "Matches", icon: Repeat2 },
  { href: "/mercado", label: "Mercado", icon: Store },
];

export default function AppHeader({ active }: { active?: "home" | "collection" | "matches" | "market" | "profile" }) {
  const activeHref = active === "home" ? "/inicio" : active === "collection" ? "/mi-coleccion" : active === "matches" ? "/mis-matches" : active === "market" ? "/mercado" : "";
  return <>
    <header className="app-header"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
      <Link href="/mi-coleccion" className="flex items-center gap-2.5 text-xl font-black tracking-[-.04em]"><BrandLogo/><span>Cromo<span className="text-[#287051]">Nexo</span></span></Link>
      <nav className="hidden items-center gap-1 rounded-full border border-[#173d2a]/10 bg-white/75 p-1 shadow-sm md:flex">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${activeHref===href?"bg-[#173d2a] text-white":"text-[#53665a] hover:bg-[#edf1e9] hover:text-[#173d2a]"}`}><Icon size={16}/>{label}</Link>)}</nav>
      <div className="flex items-center gap-2"><Link href="/ayuda" aria-label="Ayuda" title="Ayuda" className="hidden h-10 w-10 place-items-center rounded-full border border-[#173d2a]/15 bg-white text-[#53665a] transition hover:bg-[#edf1e9] sm:grid"><CircleHelp size={18}/></Link><HeaderAlerts/><Link href="/perfil" aria-label="Mi perfil" className={`grid h-10 w-10 place-items-center rounded-full transition ${active==="profile"?"bg-[#c9f31d] text-[#173d2a]":"bg-[#173d2a] text-white hover:bg-[#287051]"}`}><UserRound size={18}/></Link></div>
    </div></header>
    <nav className="mobile-nav md:hidden">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={activeHref===href?"active":""}><Icon/><span>{label}</span></Link>)}<Link href="/perfil" className={active==="profile"?"active":""}><UserRound/><span>Perfil</span></Link></nav>
  </>;
}
