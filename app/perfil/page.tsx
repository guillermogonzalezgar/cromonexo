import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{data:profile},{count:completed},{count:listings},{count:marked}]=await Promise.all([
    supabase.from("profiles").select("username, display_name, city").eq("id",user.id).single(),
    supabase.from("trade_proposals").select("id",{count:"exact",head:true}).eq("fulfillment_status","completed"),
    supabase.from("market_listings").select("id",{count:"exact",head:true}).eq("seller_id",user.id).eq("status","active"),
    supabase.from("user_stickers").select("sticker_id",{count:"exact",head:true}).eq("user_id",user.id),
  ]);
  return <ProfileClient userId={user.id} email={user.email ?? ""} stats={{completed:completed??0,listings:listings??0,marked:marked??0}} initialProfile={{ username: profile?.username ?? "", displayName: profile?.display_name ?? "", city: profile?.city ?? "" }} />;
}
