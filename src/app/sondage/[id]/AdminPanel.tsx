"use client";

import { useState, useTransition } from "react";
import { setPollClosed, deletePoll } from "@/app/actions";

export default function AdminPanel({
  pollId,
  adminToken,
  closed,
}: {
  pollId: string;
  adminToken: string;
  closed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleClosed() {
    startTransition(async () => {
      await setPollClosed(pollId, adminToken, !closed);
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
        <div className="flex gap-2">
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
    </div>
  );
}
