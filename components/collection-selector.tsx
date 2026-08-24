"use client";

import { usePathname, useRouter } from "next/navigation";

export type CollectionOption = { slug: string; name: string };

export default function CollectionSelector({ collections, value }: { collections: CollectionOption[]; value: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return <label className="block text-xs font-bold uppercase tracking-wider text-[#6e8075]">
    colección activa
    <select
      value={value}
      onChange={event => router.push(`${pathname}?coleccion=${encodeURIComponent(event.target.value)}`)}
      className="mt-2 w-full rounded-xl border border-[#173d2a]/15 bg-white px-4 py-3 text-sm font-bold normal-case tracking-normal text-[#17231b] outline-none focus:border-[#164f35]"
    >
      {collections.map(collection => <option key={collection.slug} value={collection.slug}>{collection.name}</option>)}
    </select>
  </label>;
}
