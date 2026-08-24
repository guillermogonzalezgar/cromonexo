import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/app-header";
import CollectionSelector from "@/components/collection-selector";
import MarketClient from "./market-client";
import { sortByChecklist } from "@/lib/sticker-order";

export const dynamic = "force-dynamic";
type Sticker = { id: string; number: string; name: string | null; team: string; collection_id?: string };

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ coleccion?: string }> }) {
  const { coleccion } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: collections } = await supabase.from("collections").select("id,slug,name").eq("is_active", true).order("created_at");
  const selectedSlug = collections?.some(item => item.slug === coleccion) ? coleccion! : "laliga-este-2026-27";
  const collection = collections?.find(item => item.slug === selectedSlug) ?? collections?.[0];
  if (!collection) throw new Error("No hay ninguna colección disponible.");

  const [{ data: listingRows }, { data: catalog }] = await Promise.all([
    supabase.from("market_listings").select("id,seller_id,price_cents,status,created_at,seller:profiles(display_name,username,city),sticker:stickers(id,number,name,team,collection_id)").eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("stickers").select("id,number,name,team").eq("collection_id", collection.id),
  ]);
  const listings = (listingRows ?? []).filter(listing => {
    const sticker = Array.isArray(listing.sticker) ? listing.sticker[0] : listing.sticker;
    return sticker?.collection_id === collection.id;
  });
  const availableStickers = sortByChecklist((catalog ?? []) as Sticker[]);

  return <div className="min-h-screen pb-24 md:pb-12"><AppHeader active="market"/><main className="mx-auto max-w-6xl px-4 py-9 md:px-8 md:py-14">
    <div className="grid gap-6 md:grid-cols-[1fr_20rem] md:items-end"><div className="max-w-2xl"><span className="inline-flex rounded-full bg-[#e5efd9] px-3 py-1 text-xs font-black uppercase tracking-[.16em] text-[#287051]">Comunidad CromoNexo</span><h1 className="mt-4 text-4xl font-black tracking-[-.055em] md:text-6xl">El cromo que buscas,<br/><span className="text-[#287051]">más cerca.</span></h1><p className="mt-4 text-[#65756b] md:text-lg">Publica cualquier cromo que tengas para vender y conecta directamente con otros coleccionistas. Sin comisiones ni intermediarios por ahora.</p></div><CollectionSelector collections={(collections ?? []).map(({slug,name})=>({slug,name}))} value={collection.slug}/></div>
    <MarketClient userId={user.id} listings={listings} availableStickers={availableStickers}/>
  </main></div>;
}
