import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tallyVotes, bestSlotIds } from "@/lib/availability";
import { formatDayLong, formatSlotRange } from "@/lib/format";
import ResultsGrid, {
  type GridParticipant,
  type GridSlot,
} from "./ResultsGrid";
import VoteForm, { type VoteSlot } from "./VoteForm";
import AdminPanel, { type AdminSlot } from "./AdminPanel";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ admin?: string; participant?: string }>;
}

// `cache` dédoublonne l'appel au sein d'une même requête : generateMetadata et
// le rendu de la page partagent ainsi une seule lecture en base.
const getPoll = cache(async (id: string) => {
  return prisma.poll.findUnique({
    where: { id },
    include: {
      slots: { orderBy: { position: "asc" } },
      participants: {
        orderBy: { createdAt: "asc" },
        include: { votes: true },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const poll = await getPoll(id);
  return { title: poll ? poll.title : "Sondage introuvable" };
}

export default async function PollPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { admin, participant } = await searchParams;
  const poll = await getPoll(id);
  if (!poll) notFound();

  const isAdmin = Boolean(admin) && admin === poll.adminToken;

  // Réponse en cours de modification (lien « Modifier » de la grille).
  const editing = participant
    ? poll.participants.find((p) => p.id === participant) ?? null
    : null;

  // Conserve le contexte organisateur dans les liens de la grille.
  const adminQuery = isAdmin ? `admin=${poll.adminToken}&` : "";

  const slotIds = poll.slots.map((s) => s.id);
  const allVotes = poll.participants.flatMap((p) =>
    p.votes.map((v) => ({ slotId: v.slotId, status: v.status })),
  );
  const tallies = tallyVotes(slotIds, allVotes);
  const bestIds = bestSlotIds(tallies);

  const gridSlots: GridSlot[] = poll.slots.map((s) => ({
    id: s.id,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
  }));
  const gridParticipants: GridParticipant[] = poll.participants.map((p) => ({
    id: p.id,
    name: p.name,
    votes: Object.fromEntries(p.votes.map((v) => [v.slotId, v.status])),
    // Pas de lien de modification si le sondage est clôturé.
    editHref: poll.closed
      ? null
      : `/sondage/${poll.id}?${adminQuery}participant=${p.id}#repondre`,
    editing: editing?.id === p.id,
  }));

  const voteSlots: VoteSlot[] = poll.slots.map((s) => ({
    id: s.id,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt ? s.endsAt.toISOString() : null,
  }));

  const winners = poll.slots.filter((s) => bestIds.has(s.id));

  const finalSlot = poll.finalSlotId
    ? poll.slots.find((s) => s.id === poll.finalSlotId) ?? null
    : null;

  const adminSlots: AdminSlot[] = poll.slots.map((s) => ({
    id: s.id,
    label: `${formatDayLong(s.startsAt)} · ${
      s.endsAt ? formatSlotRange(s.startsAt, s.endsAt) : formatSlotRange(s.startsAt, null)
    }`,
  }));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{poll.title}</h1>
          {poll.closed && (
            <span className="rounded-full bg-no/10 px-3 py-1 text-sm font-medium text-no">
              Clôturé
            </span>
          )}
        </div>
        {poll.description && (
          <p className="mt-2 whitespace-pre-line text-muted">
            {poll.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
          {poll.organizerName && <span>👤 Organisé par {poll.organizerName}</span>}
          {poll.location && <span>📍 {poll.location}</span>}
        </div>
      </header>

      {isAdmin && (
        <AdminPanel
          pollId={poll.id}
          adminToken={poll.adminToken}
          closed={poll.closed}
          slots={adminSlots}
          finalSlotId={poll.finalSlotId}
        />
      )}

      {finalSlot && (
        <div className="rounded-2xl border border-yes/40 bg-yes/10 p-5">
          <p className="text-sm font-medium text-yes">✅ Créneau retenu</p>
          <p className="mt-1 text-lg font-semibold">
            {formatDayLong(finalSlot.startsAt)}
            <span className="ml-2 font-normal text-muted">
              {finalSlot.endsAt
                ? formatSlotRange(finalSlot.startsAt, finalSlot.endsAt)
                : formatSlotRange(finalSlot.startsAt, null)}
            </span>
          </p>
          <a
            href={`/sondage/${poll.id}/calendrier.ics`}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            📅 Ajouter à mon agenda
          </a>
        </div>
      )}

      {!finalSlot && winners.length > 0 && (
        <div className="rounded-2xl border border-brand/30 bg-brand-soft p-5">
          <p className="text-sm font-medium text-brand">
            {winners.length > 1
              ? "Créneaux les plus favorables (ex æquo)"
              : "Meilleur créneau pour l’instant"}
          </p>
          <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
            {winners.map((s) => {
              const t = tallies.get(s.id);
              return (
                <li key={s.id} className="font-semibold">
                  {formatDayLong(s.startsAt)}
                  <span className="ml-2 font-normal text-muted">
                    {t?.yes ?? 0} dispo
                    {t && t.maybe > 0 ? ` · ${t.maybe} si besoin` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Disponibilités</h2>
        <ResultsGrid
          slots={gridSlots}
          participants={gridParticipants}
          tallies={tallies}
          bestIds={bestIds}
        />
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
          <span>
            <span className="text-yes">✓</span> Disponible
          </span>
          <span>
            <span className="text-maybe">~</span> Si besoin
          </span>
          <span>
            <span className="text-no/70">✕</span> Non disponible
          </span>
        </div>
      </section>

      <div id="repondre" className="scroll-mt-4">
        {poll.closed ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-muted">
            Ce sondage est clôturé, il n’est plus possible d’y répondre.
          </p>
        ) : (
          <>
            <VoteForm
              // Repart d'un formulaire vierge quand on change de participant.
              key={editing?.id ?? "new"}
              pollId={poll.id}
              slots={voteSlots}
              participantId={editing?.id}
              initialName={editing?.name ?? ""}
              initialVotes={
                editing
                  ? Object.fromEntries(
                      editing.votes.map((v) => [v.slotId, v.status]),
                    )
                  : undefined
              }
            />
            {editing && (
              <p className="mt-3 text-sm text-muted">
                Vous modifiez la réponse de{" "}
                <span className="font-medium">{editing.name}</span>.{" "}
                <Link
                  href={`/sondage/${poll.id}${
                    isAdmin ? `?admin=${poll.adminToken}` : ""
                  }#repondre`}
                  className="text-brand underline"
                >
                  Répondre en tant que quelqu’un d’autre
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
