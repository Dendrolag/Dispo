"use client";

import { useState, useTransition } from "react";
import { createPoll, type SlotInput } from "@/app/actions";
import { shiftDateTimeLocal, withTime } from "@/lib/format";

interface SlotRow {
  key: string;
  start: string;
  end: string;
}

let rowCounter = 0;
function newRow(start = "", end = ""): SlotRow {
  rowCounter += 1;
  return { key: `row-${rowCounter}`, start, end };
}

export default function CreatePollPage() {
  const [rows, setRows] = useState<SlotRow[]>(() => [newRow(), newRow()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateRow(key: string, patch: Partial<SlotRow>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // Saisir un début pré-remplit la fin à +1h si elle est encore vide.
  function setStart(key: string, value: string) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const end = r.end || (value ? shiftDateTimeLocal(value, { hours: 1 }) : "");
        return { ...r, start: value, end };
      }),
    );
  }

  function addRow() {
    setRows((rs) => {
      // Passe au jour suivant à 08:00, avec une fin par défaut à +1h.
      const last = rs[rs.length - 1];
      const start = last?.start
        ? shiftDateTimeLocal(withTime(last.start, "08:00"), { days: 1 })
        : "";
      const end = start ? shiftDateTimeLocal(start, { hours: 1 }) : "";
      return [...rs, newRow(start, end)];
    });
  }

  function removeRow(key: string) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const slots: SlotInput[] = rows
      .filter((r) => r.start)
      .map((r) => ({ startsAt: r.start, endsAt: r.end || null }));

    startTransition(async () => {
      const result = await createPoll({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        location: String(formData.get("location") ?? ""),
        organizerName: String(formData.get("organizerName") ?? ""),
        slots,
      });
      // En cas de succès l'action redirige ; on n'atteint ce point qu'en cas d'erreur.
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Créer un sondage</h1>
      <p className="mt-2 text-muted">
        Renseignez votre événement et les créneaux à proposer. Vous obtiendrez un
        lien à partager.
      </p>

      <form action={handleSubmit} className="mt-8 flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <label className="block">
            <span className="text-sm font-medium">Titre *</span>
            <input
              name="title"
              required
              placeholder="Ex. Réunion d'équipe, dîner entre amis…"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-brand"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium">Description</span>
            <textarea
              name="description"
              rows={2}
              placeholder="Optionnel — précisez l'objet, l'ordre du jour…"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-brand"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Lieu</span>
              <input
                name="location"
                placeholder="Optionnel"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Votre nom</span>
              <input
                name="organizerName"
                placeholder="Optionnel"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-brand"
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Créneaux proposés</h2>
            <span className="text-sm text-muted">La fin est optionnelle</span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {rows.map((row, i) => (
              <div
                key={row.key}
                className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3"
              >
                <span className="text-sm font-medium text-muted">
                  #{i + 1}
                </span>
                <label className="flex-1">
                  <span className="text-xs text-muted">Début</span>
                  <input
                    type="datetime-local"
                    value={row.start}
                    onChange={(e) => setStart(row.key, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
                  />
                </label>
                <label className="flex-1">
                  <span className="text-xs text-muted">Fin (optionnel)</span>
                  <input
                    type="datetime-local"
                    value={row.end}
                    onChange={(e) => updateRow(row.key, { end: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length === 1}
                  aria-label="Supprimer ce créneau"
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-no disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-4 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand-soft"
          >
            + Ajouter un créneau
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-no/40 bg-no/10 px-4 py-3 text-sm text-no">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand px-6 py-3 font-medium text-brand-fg shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Création…" : "Créer le sondage"}
        </button>
      </form>
    </div>
  );
}
