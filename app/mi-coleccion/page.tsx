import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollectionClient, { type Sticker } from "./collection-client";
import { sortByChecklist } from "@/lib/sticker-order";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ searchParams }: { searchParams: Promise<{ coleccion?: string }> }) {
  const { coleccion } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: collections } = await supabase.from("collections").select("id, slug, name").eq("is_active", true).order("created_at");
  const selectedSlug = collections?.some(item => item.slug === coleccion) ? coleccion! : "laliga-este-2026-27";
  const collection = collections?.find(item => item.slug === selectedSlug) ?? collections?.[0];
  if (!collection) throw new Error("No hay ninguna colección disponible.");

  const [{ data: catalog, error: catalogError }, { data: userStickers, error: userError }] = await Promise.all([
    supabase.from("stickers").select("id, number, name, team, category").eq("collection_id", collection.id),
    supabase.from("user_stickers").select("sticker_id, status, quantity").eq("user_id", user.id),
  ]);
  if (catalogError || userError) throw new Error("No se pudo cargar la colección.");

  const states = new Map((userStickers ?? []).map(item => [item.sticker_id, item]));
  const stickers: Sticker[] = sortByChecklist(catalog ?? []).map(item => {
    const saved = states.get(item.id);
    return { id: item.id, code: item.number, name: item.name, section: item.team, category: item.category, status: saved?.status ?? null, quantity: saved?.quantity };
  });

  return <CollectionClient initialStickers={stickers} userId={user.id} collectionName={collection.name} collectionSlug={collection.slug} collections={(collections ?? []).map(({ slug, name }) => ({ slug, name }))} />;
}
