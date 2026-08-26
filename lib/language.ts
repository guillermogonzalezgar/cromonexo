"use client";

import { useSyncExternalStore } from "react";

export type Language = "es" | "en";
const eventName = "cromonexo-language-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
}

function getLanguage(): Language {
  return localStorage.getItem("cromonexo-language") === "en" ? "en" : "es";
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getLanguage, () => "es" as Language);
  const setLanguage = (next: Language) => {
    localStorage.setItem("cromonexo-language", next);
    document.documentElement.lang = next;
    window.dispatchEvent(new Event(eventName));
  };
  return { language, setLanguage };
}

