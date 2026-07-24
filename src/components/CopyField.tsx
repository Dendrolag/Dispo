"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyField({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Évite un setState après démontage si l'on quitte la page juste après la copie.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Le presse-papiers peut être indisponible (http non sécurisé) : on ignore.
    }
  }

  return (
    <div>
      {label && <span className="text-sm font-medium">{label}</span>}
      <div className="mt-1 flex gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand-hover"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
    </div>
  );
}
