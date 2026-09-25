"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Pref = "system" | "light" | "dark";
const ORDER: Pref[] = ["system", "light", "dark"];
const LABEL: Record<Pref, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };
const EVENT = "themechange";

function read(): Pref {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (read() === "system") apply("system");
  };
  mq.addEventListener("change", onSystem);
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    mq.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, read, () => "system" as Pref);

  const next = () => {
    const n = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    try {
      localStorage.setItem("theme", n);
    } catch {}
    apply(n);
    window.dispatchEvent(new Event(EVENT));
  };

  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={next}
      className="inline-flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={`${LABEL[pref]}. Switch theme`}
      title={LABEL[pref]}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
