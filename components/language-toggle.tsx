"use client";

import { useLanguage } from "@/lib/language";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex h-10 items-center rounded-full border border-[#dfe3df] bg-white p-1 text-[11px] font-black" aria-label="Idioma">
      {(["es", "en"] as const).map(option => (
        <button
          type="button"
          key={option}
          onClick={() => setLanguage(option)}
          aria-pressed={language === option}
          className={`h-8 rounded-full px-2.5 transition ${language === option ? "bg-[#101311] text-white" : "text-[#6d756f]"}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
