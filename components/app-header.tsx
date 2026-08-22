import Link from "next/link";
import { Album, CircleHelp, Home, Repeat2, Store, UserRound } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import HeaderAlerts from "@/components/header-alerts";

const links = [
  { href: "/inicio", label: "inicio", icon: Home },
  { href: "/mi-coleccion", label: "colección", icon: Album },
  { href: "/mis-matches", label: "matches", icon: Repeat2 },
  { href: "/mercado", label: "mercado", icon: Store },
];

export default function AppHeader({ active }: { active?: "home" | "collection" | "matches" | "market" | "profile" }) {
  const activeHref = active === "home" ? "/inicio" : active === "collection" ? "/mi-coleccion" : active === "matches" ? "/mis-matches" : active === "market" ? "/mercado" : "";
  return <>
    <header className="app-header"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
      <Link href="/mi-coleccion" className="flex items-center gap-2.5 text-xl font-black tracking-[-.04em]"><BrandLogo/><span>Cromo<span className="text-[#287051]">Nexo</span></span></Link>
      <nav className="hidden items-center gap-7 md:flex">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={`flex items-center gap-2 border-b-2 py-5 text-sm font-semibold transition ${activeHref===href?"border-[#101311] text-[#101311]":"border-transparent text-[#777d79] hover:text-[#101311]"}`}><Icon size={16}/>{label}</Link>)}</nav>
      <div className="flex items-center gap-2"><Link href="/ayuda" aria-label="ayuda" title="ayuda" className="hidden h-10 w-10 place-items-center rounded-full border border-[#dfe3df] bg-white text-[#555b57] transition hover:bg-[#f1f3f0] sm:grid"><CircleHelp size={18}/></Link><HeaderAlerts/><Link href="/perfil" aria-label="mi perfil" className={`flex h-10 items-center justify-center gap-2 rounded-full px-3 transition ${active==="profile"?"bg-[#b6ef22] text-[#101311]":"bg-[#101311] text-white hover:bg-[#252a27]"}`}><UserRound size={18}/><span className="hidden text-sm font-semibold lg:inline">mi perfil</span></Link></div>
    </div></header>
    <nav className="mobile-nav md:hidden">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={activeHref===href?"active":""}><Icon/><span>{label}</span></Link>)}<Link href="/perfil" className={active==="profile"?"active":""}><UserRound/><span>perfil</span></Link></nav>
  </>;
}
