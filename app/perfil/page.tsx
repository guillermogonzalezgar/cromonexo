import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("username, display_name, city").eq("id", user.id).single();
  return <ProfileClient userId={user.id} email={user.email ?? ""} initialProfile={{ username: profile?.username ?? "", displayName: profile?.display_name ?? "", city: profile?.city ?? "" }} />;
}
