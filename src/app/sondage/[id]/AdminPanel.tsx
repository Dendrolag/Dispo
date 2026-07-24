"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setPollClosed, setFinalSlot, deletePoll } from "@/app/actions";

export interface AdminSlot {
  id: string;
  label: string;
}

export default function AdminPanel({
  pollId,
  adminToken,
  closed,
  slots,
  finalSlotId,
}: {
  pollId: string;
  adminToken: string;
  closed: boolean;
  slots: AdminSlot[];
  finalSlotId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [choice, setChoice] = useState(finalSlotId ?? "");

  function toggleClosed() {
    startTransition(async () => {
      await setPollClosed(pollId, adminToken, !closed);
    });
  }

  function confirmFinal() {
    if (!choice) return;
    startTransition(async () => {
      await setFinalSlot(pollId, adminToken, choice);
    });
  }

  function clearFinal() {
    setChoice("");
    startTransition(async () => {
      await setFinalSlot(pollId, adminToken, null);
    });
  }

  function remove() {
    startTransition(async () => {
      await deletePoll(pollId, adminToken);
    });
  }

  return (
    <div className="rounded-2xl border border-brand/30 bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Espace organisateur</h2>
          <p className="text-sm text-muted">
            Vous seul voyez ces commandes (conservez le lien d’administration).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sondage/${pollId}/modifier?admin=${adminToken}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-brand-soft"
          >
            Modifier
          </Link>
          <button
            type="button"
            onClick={toggleClosed}
            disabled={pending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-brand-soft disabled:opacity-60"
          >
            {closed ? "Rouvrir le sondage" : "Clôturer le sondage"}
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="rounded-lg bg-no px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Confirmer la suppression
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-no/40 px-4 py-2 text-sm font-medium text-no transition hover:bg-no/10"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Créneau retenu</h3>
        <p className="text-sm text-muted">
          Figez le créneau final : le sondage est clôturé et les participants
          peuvent l’ajouter à leur agenda.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            disabled={pending}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
          >
            <option value="">— Choisir un créneau —</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={confirmFinal}
            disabled={pending || !choice || choice === finalSlotId}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Valider ce créneau
          </button>
          {finalSlotId && (
            <button
              type="button"
              onClick={clearFinal}
              disabled={pending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-brand-soft disabled:opacity-60"
            >
              Retirer le choix
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
