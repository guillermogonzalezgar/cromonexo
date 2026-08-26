"use client";

import Link from "next/link";
import { ArrowRight, Check, CircleDollarSign, Repeat2, Search, Store } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import LanguageToggle from "@/components/language-toggle";
import { useLanguage } from "@/lib/language";

const steps = [
  { number: "01", title: "marca lo importante", text: "Añade únicamente los cromos que te faltan y los que tienes repetidos." },
  { number: "02", title: "encuentra coincidencias", text: "CromoNexo localiza coleccionistas que tienen lo que buscas y necesitan lo que tú tienes." },
  { number: "03", title: "elige cómo conseguirlo", text: "Propón un intercambio o utiliza el mercado para comprar y vender directamente." },
];

export default function LandingPage() {
  const { language } = useLanguage();
  const copy = language === "es" ? {
    how:"cómo funciona", possibilities:"posibilidades", login:"iniciar sesión", account:"crear cuenta", kicker:"cromos · intercambios · mercado",
    hero1:"tu colección.", hero2:"sin", hero3:"complicaciones.", lead:"Organiza tus faltantes y repetidos, encuentra coleccionistas compatibles y decide si quieres intercambiar, comprar o vender.", start:"empezar gratis", see:"ver cómo funciona",
    noAlbum:"sin marcar todo el álbum", free:"gratis para empezar", myCollection:"mi colección", active:"activa", wanted:"me faltan", duplicates:"repetidos", latest:"últimos cromos", newMatch:"nuevo match", compatible:"cromos compatibles",
    works:"así funciona", connections1:"menos listas.", connections2:"más conexiones.", connectionsText:"Convertimos la información de tu colección en oportunidades reales con otros coleccionistas.", connected:"todo conectado", collectionWorks:"una colección que trabaja para ti.", collectionText:"Tus repetidos dejan de estar parados y tus faltantes dejan de ser una búsqueda interminable.", today:"empieza hoy", movement:"pon tu colección en movimiento.", finalText:"Crea tu cuenta, añade tus cromos y descubre tus primeras coincidencias."
  } : {
    how:"how it works", possibilities:"possibilities", login:"sign in", account:"create account", kicker:"stickers · trades · marketplace",
    hero1:"your collection.", hero2:"made", hero3:"simple.", lead:"Organise your wanted and duplicate stickers, find compatible collectors and choose whether to trade, buy or sell.", start:"start for free", see:"see how it works",
    noAlbum:"no need to mark the whole album", free:"free to get started", myCollection:"my collection", active:"active", wanted:"wanted", duplicates:"duplicates", latest:"latest stickers", newMatch:"new match", compatible:"compatible stickers",
    works:"how it works", connections1:"fewer lists.", connections2:"more connections.", connectionsText:"We turn your collection data into real opportunities with other collectors.", connected:"everything connected", collectionWorks:"a collection that works for you.", collectionText:"Put your duplicates to work and make your wanted list easier to complete.", today:"start today", movement:"put your collection in motion.", finalText:"Create your account, add your stickers and discover your first matches."
  };
  const visibleSteps = language === "es" ? steps : [
    { number:"01", title:"mark what matters", text:"Only add the stickers you want and the duplicates you can offer." },
    { number:"02", title:"find connections", text:"CromoNexo finds collectors who have what you want and need what you have." },
    { number:"03", title:"choose how to get it", text:"Suggest a trade or use the marketplace to buy and sell directly." },
  ];
  return <main className="landing-page overflow-hidden">
    <header className="landing-header"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
      <Link href="/" className="flex items-center gap-2.5 text-xl font-black tracking-[-.045em]"><BrandLogo/><span>Cromo<span className="text-[#8dbd12]">Nexo</span></span></Link>
      <nav className="hidden items-center gap-8 text-sm font-semibold text-[#555b57] md:flex"><a href="#como-funciona">{copy.how}</a><a href="#posibilidades">{copy.possibilities}</a><Link href="/login">{copy.login}</Link></nav>
      <div className="flex items-center gap-2"><LanguageToggle/><Link href="/login" className="landing-nav-cta hidden sm:inline-flex">{copy.account}</Link></div>
    </div></header>

    <section className="landing-hero mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 md:px-8 lg:grid-cols-[1.08fr_.92fr] lg:pb-24 lg:pt-16">
      <div><p className="landing-kicker">{copy.kicker}</p><h1><span className="hero-title-line">{copy.hero1}</span><span className="hero-title-accent">{copy.hero2}</span><span className="hero-title-accent">{copy.hero3}</span></h1><p className="landing-lead">{copy.lead}</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/login" className="landing-primary-action">{copy.start} <ArrowRight size={19}/></Link><a href="#como-funciona" className="landing-secondary-action">{copy.see}</a></div><div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[#666d68]"><span className="flex items-center gap-2"><Check size={17} className="text-[#79a900]"/>{copy.noAlbum}</span><span className="flex items-center gap-2"><Check size={17} className="text-[#79a900]"/>{copy.free}</span></div></div>
      <div className="landing-product-card"><div className="flex items-center justify-between"><div><p className="landing-kicker text-white/45">{copy.myCollection}</p><p className="mt-2 text-2xl font-semibold text-white">LALIGA ESTE 2026/27</p></div><span className="landing-live-dot">{copy.active}</span></div><div className="mt-12 grid grid-cols-2 gap-3"><Metric value="42" label={copy.wanted} accent/><Metric value="27" label={copy.duplicates}/></div><div className="mt-4 rounded-[1.35rem] bg-white p-4 text-[#101311]"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{copy.latest}</p><Search size={17} className="text-[#727873]"/></div><div className="mt-4 space-y-2"><Sticker number="12" status={copy.wanted}/><Sticker number="47" status={copy.duplicates}/><Sticker number="83" status={copy.wanted}/></div></div><div className="landing-match"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#b6ef22] text-black"><Repeat2 size={18}/></span><span><small>{copy.newMatch}</small><strong>8 {copy.compatible}</strong></span><ArrowRight size={18}/></div></div>
    </section>

    <section id="como-funciona" className="landing-dark-section"><div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><p className="landing-kicker text-[#b6ef22]">{copy.works}</p><div className="mt-5 grid gap-6 lg:grid-cols-2 lg:items-end"><h2>{copy.connections1}<br/>{copy.connections2}</h2><p className="max-w-lg text-lg leading-8 text-white/55">{copy.connectionsText}</p></div><div className="mt-14 grid border-t border-white/15 md:grid-cols-3">{visibleSteps.map(step=><article key={step.number} className="landing-step"><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>

    <section id="posibilidades" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-start"><div className="lg:sticky lg:top-28"><p className="landing-kicker text-[#698a16]">{copy.connected}</p><h2 className="landing-section-title">{copy.collectionWorks}</h2><p className="mt-5 max-w-md text-lg leading-8 text-[#666d68]">{copy.collectionText}</p></div><div className="grid gap-3"><Feature icon={<Repeat2/>} title={language==="es"?"intercambia":"trade"} text={language==="es"?"Recibe matches ordenados por compatibilidad y prepara propuestas claras.":"See matches ordered by compatibility and prepare clear offers."}/><Feature icon={<Store/>} title={language==="es"?"vende":"sell"} text={language==="es"?"Publica cualquier cromo que tengas y gestiona las solicitudes recibidas.":"List any sticker you own and manage incoming requests."}/><Feature icon={<CircleDollarSign/>} title={language==="es"?"compra":"buy"} text={language==="es"?"Encuentra publicaciones de otros coleccionistas y solicita el cromo que buscas.":"Browse other collectors' listings and request the sticker you need."}/></div></div></section>

    <section className="landing-final-cta"><div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-24"><p className="landing-kicker">{copy.today}</p><h2>{copy.movement}</h2><p className="mx-auto mt-5 max-w-xl text-lg text-black/60">{copy.finalText}</p><Link href="/login" className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-black px-8 font-semibold text-white">{copy.account} <ArrowRight size={19}/></Link></div></section>
    <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 text-sm text-[#6b716d] md:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="font-black text-[#101311]">Cromo<span className="text-[#8dbd12]">Nexo</span></p><p>hecho para coleccionistas · @cromonexo</p></div><nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold"><Link href="/ayuda">ayuda</Link><Link href="/contacto">contacto</Link><Link href="/aviso-legal">aviso legal</Link><Link href="/privacidad">privacidad</Link><Link href="/condiciones">condiciones de uso</Link></nav></footer>
  </main>;
}

function Metric({value,label,accent=false}:{value:string;label:string;accent?:boolean}) { return <div className={`rounded-[1.35rem] p-5 ${accent?"bg-[#b6ef22] text-black":"bg-[#252a27] text-white"}`}><strong className="text-4xl font-semibold tracking-[-.06em]">{value}</strong><p className={`mt-2 text-sm ${accent?"text-black/60":"text-white/45"}`}>{label}</p></div> }
function Sticker({number,status}:{number:string;status:string}) { return <div className="flex items-center gap-3 rounded-xl bg-[#f1f3f0] p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-black text-xs font-semibold text-white">{number}</span><span className="flex-1 text-sm font-medium">cromo #{number}</span><span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#555b57]">{status}</span></div> }
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) { return <article className="landing-feature"><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight className="ml-auto shrink-0" size={20}/></article> }
