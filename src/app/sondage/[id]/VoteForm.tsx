"use client";

import { useState, useTransition } from "react";
import { submitResponse } from "@/app/actions";
import { Availability } from "@/lib/availability";
import { formatDay, formatSlotRange } from "@/lib/format";

export interface VoteSlot {
  id: string;
  startsAt: string; // ISO
  endsAt: string | null;
}

const CHOICES: { value: Availability; label: string; className: string }[] = [
  { value: Availability.YES, label: "Oui", className: "data-[on=true]:bg-yes" },
  {
    value: Availability.MAYBE,
    label: "Si besoin",
    className: "data-[on=true]:bg-maybe",
  },
  { value: Availability.NO, label: "Non", className: "data-[on=true]:bg-no" },
];

export default function VoteForm({
  pollId,
  slots,
  initialName = "",
  initialVotes,
  participantId,
}: {
  pollId: string;
  slots: VoteSlot[];
  initialName?: string;
  initialVotes?: Record<string, Availability>;
  participantId?: string;
}) {
  // Après un premier envoi, on retient l'id créé : renvoyer met alors à jour la
  // réponse au lieu de créer un doublon (double clic, correction immédiate…).
  const [currentId, setCurrentId] = useState(participantId);
  const [name, setName] = useState(initialName);
  const [votes, setVotes] = useState<Record<string, Availability>>(
    initialVotes ?? {},
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function setVote(slotId: string, value: Availability) {
    setVotes((v) => ({ ...v, [slotId]: value }));
    setSaved(false);
  }

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await submitResponse({
        pollId,
        name,
        votes,
        participantId: currentId,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.participantId) setCurrentId(result.participantId);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">
        {currentId ? "Modifier votre réponse" : "Répondre au sondage"}
      </h2>

      <label className="mt-4 block">
        <span className="text-sm font-medium">Votre nom</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Prénom ou pseudo"
          className="mt-1 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-brand"
        />
      </label>

      <ul className="mt-5 flex flex-col gap-2">
        {slots.map((slot) => {
          const start = new Date(slot.startsAt);
          const end = slot.endsAt ? new Date(slot.endsAt) : null;
          const current = votes[slot.id];
          return (
            <li
              key={slot.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-medium">{formatDay(start)}</span>{" "}
                <span className="text-muted">{formatSlotRange(start, end)}</span>
              </div>
              <div
                role="group"
                aria-label={`Disponibilité pour ${formatDay(start)} ${formatSlotRange(start, end)}`}
                className="flex overflow-hidden rounded-lg border border-border"
              >
                {CHOICES.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    aria-pressed={current === choice.value}
                    data-on={current === choice.value}
                    onClick={() => setVote(slot.id, choice.value)}
                    className={`px-3 py-1.5 text-sm transition data-[on=true]:font-medium data-[on=true]:text-white ${choice.className}`}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-no/40 bg-no/10 px-4 py-3 text-sm text-no"
        >
          {error}
        </p>
      )}

      {saved && !error && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-yes/40 bg-yes/10 px-4 py-3 text-sm text-yes"
        >
          Réponse enregistrée ✓
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="mt-5 rounded-xl bg-brand px-6 py-3 font-medium text-brand-fg shadow-sm transition hover:bg-brand-hover disabled:opacity-60"
      >
        {pending
          ? "Enregistrement…"
          : currentId
            ? "Mettre à jour ma réponse"
            : "Envoyer ma réponse"}
      </button>
      <p className="mt-2 text-xs text-muted">
        Les créneaux laissés sans réponse comptent comme « Non ».
      </p>
    </div>
  );
}
