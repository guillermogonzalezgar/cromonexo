"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function HeaderAlerts() {
  const supabase = useMemo(() => createClient(), []);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from("trade_proposals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("market_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]).then(([trades, requests]) => {
      if (active) setCount((trades.count ?? 0) + (requests.count ?? 0));
    });
    return () => { active = false; };
  }, [supabase]);

  return <Link href="/inicio" aria-label={count ? `${count} avisos pendientes` : "Sin avisos pendientes"} title="Avisos" className="relative grid h-10 w-10 place-items-center rounded-full border border-[#173d2a]/15 bg-white text-[#53665a] transition hover:bg-[#edf1e9]"><Bell size={18}/>{count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff6a3d] px-1 text-[10px] font-black text-white">{count > 9 ? "9+" : count}</span>}</Link>;
}
