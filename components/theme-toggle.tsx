"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const nextTheme = root.classList.contains("dark") ? "light" : "dark";

    root.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("cromonexo-theme", nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar tema"
      className="grid h-10 w-10 place-items-center rounded-full border border-[#dfe3df] bg-white text-[#555b57] transition hover:rotate-6 hover:bg-[#f1f3f0]"
    >
      <Moon className="dark:hidden" size={18} />
      <Sun className="hidden dark:block" size={18} />
    </button>
  );
}
