import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollectionClient, { type Sticker } from "./collection-client";
import { sortByChecklist } from "@/lib/sticker-order";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: collection } = await supabase.from("collections").select("id, name").eq("slug", "laliga-este-2026-27").single();
  if (!collection) throw new Error("La colección LaLiga ESTE 2026/27 no está disponible.");

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

  return <CollectionClient initialStickers={stickers} userId={user.id} userEmail={user.email ?? "usuario"} collectionName={collection.name} />;
}
