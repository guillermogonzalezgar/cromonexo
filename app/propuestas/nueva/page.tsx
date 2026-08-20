import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewProposalClient from "./proposal-client";

export const dynamic = "force-dynamic";
type MatchRow = { matched_user_id:string; display_name:string|null; username:string|null; can_receive:string[]; can_give:string[] };
type StickerRow = { id:string; number:string; name:string|null; team:string };

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ usuario?: string }> }) {
  const { usuario } = await searchParams; if (!usuario) redirect("/mis-matches");
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
  const {data:collection}=await supabase.from("collections").select("id,name").eq("slug","laliga-este-2026-27").single(); if(!collection) redirect("/mis-matches");
  const {data}=await supabase.rpc("get_user_matches",{p_collection_id:collection.id});
  const match=((data??[]) as MatchRow[]).find(item=>item.matched_user_id===usuario); if(!match) redirect("/mis-matches");
  const ids=[...new Set([...match.can_receive,...match.can_give])]; const {data:stickers}=await supabase.from("stickers").select("id,number,name,team").in("id",ids);
  const map=new Map((stickers??[]).map(s=>[s.id,s]));
  const exists=(sticker:StickerRow|undefined):sticker is StickerRow=>Boolean(sticker);
  return <NewProposalClient collectionId={collection.id} recipientId={usuario} recipientName={match.display_name||(match.username?`@${match.username}`:"Coleccionista")} offered={match.can_give.map(id=>map.get(id)).filter(exists)} requested={match.can_receive.map(id=>map.get(id)).filter(exists)}/>;
}
