"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Availability } from "@/generated/prisma";

export interface SlotInput {
  startsAt: string; // ISO ou valeur d'un <input type="datetime-local">
  endsAt?: string | null;
}

export interface CreatePollInput {
  title: string;
  description?: string;
  location?: string;
  organizerName?: string;
  slots: SlotInput[];
}

export interface CreatePollResult {
  error?: string;
}

/**
 * Convertit une valeur de champ (`<input type="datetime-local">`, sans fuseau)
 * en Date, ou null si vide/invalide.
 *
 * On interprète la saisie comme heure « flottante » ancrée sur UTC : la valeur
 * « 2026-07-27T20:00 » devient 20:00 UTC. Ainsi l'heure stockée puis réaffichée
 * (voir lib/format, également en UTC) correspond exactement à ce qui a été saisi,
 * indépendamment du fuseau du serveur ou des participants.
 */
function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  let normalized = value.trim();
  // Ajoute les secondes puis le suffixe « Z » si absent, pour forcer UTC.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    normalized += ":00Z";
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    normalized += "Z";
  }
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createPoll(
  input: CreatePollInput,
): Promise<CreatePollResult> {
  const title = input.title?.trim();
  if (!title) {
    return { error: "Le titre est obligatoire." };
  }

  const parsedSlots = (input.slots ?? [])
    .map((s, index) => {
      const startsAt = parseDate(s.startsAt);
      if (!startsAt) return null;
      const endsAt = parseDate(s.endsAt);
      // On ignore une fin antérieure ou égale au début.
      const validEnd = endsAt && endsAt > startsAt ? endsAt : null;
      return { startsAt, endsAt: validEnd, position: index };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((s, position) => ({ ...s, position }));

  if (parsedSlots.length === 0) {
    return { error: "Proposez au moins un créneau valide." };
  }

  const poll = await prisma.poll.create({
    data: {
      title,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      organizerName: input.organizerName?.trim() || null,
      slots: { create: parsedSlots },
    },
  });

  redirect(`/sondage/${poll.id}/partage?admin=${poll.adminToken}`);
}

export interface UpdateSlotInput {
  /** Présent = créneau existant (conservé et éventuellement corrigé). */
  id?: string;
  startsAt: string;
  endsAt?: string | null;
}

export interface UpdatePollInput {
  pollId: string;
  adminToken: string;
  title: string;
  description?: string;
  location?: string;
  organizerName?: string;
  slots: UpdateSlotInput[];
}

export async function updatePoll(
  input: UpdatePollInput,
): Promise<{ error?: string }> {
  const poll = await prisma.poll.findUnique({
    where: { id: input.pollId },
    include: { slots: { select: { id: true } } },
  });
  if (!poll || poll.adminToken !== input.adminToken) {
    return { error: "Action non autorisée." };
  }

  const title = input.title?.trim();
  if (!title) return { error: "Le titre est obligatoire." };

  const existingIds = new Set(poll.slots.map((s) => s.id));

  const parsedSlots = (input.slots ?? [])
    .map((s) => {
      const startsAt = parseDate(s.startsAt);
      if (!startsAt) return null;
      const endsAt = parseDate(s.endsAt);
      const validEnd = endsAt && endsAt > startsAt ? endsAt : null;
      // On ne conserve un id que s'il appartient bien à ce sondage.
      const id = s.id && existingIds.has(s.id) ? s.id : undefined;
      return { id, startsAt, endsAt: validEnd };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((s, position) => ({ ...s, position }));

  if (parsedSlots.length === 0) {
    return { error: "Proposez au moins un créneau valide." };
  }

  const keptIds = new Set(
    parsedSlots.map((s) => s.id).filter((id): id is string => Boolean(id)),
  );
  const removedIds = [...existingIds].filter((id) => !keptIds.has(id));

  await prisma.$transaction(async (tx) => {
    await tx.poll.update({
      where: { id: poll.id },
      data: {
        title,
        description: input.description?.trim() || null,
        location: input.location?.trim() || null,
        organizerName: input.organizerName?.trim() || null,
      },
    });

    // Les créneaux retirés emportent leurs votes (onDelete: Cascade).
    if (removedIds.length > 0) {
      await tx.timeSlot.deleteMany({ where: { id: { in: removedIds } } });
    }

    for (const slot of parsedSlots) {
      if (slot.id) {
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: {
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            position: slot.position,
          },
        });
      } else {
        await tx.timeSlot.create({
          data: {
            pollId: poll.id,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            position: slot.position,
          },
        });
      }
    }
  });

  revalidatePath(`/sondage/${poll.id}`);
  redirect(`/sondage/${poll.id}?admin=${input.adminToken}`);
}

export interface SubmitResponseInput {
  pollId: string;
  name: string;
  /** slotId -> disponibilité. Les créneaux absents sont considérés « NO ». */
  votes: Record<string, Availability>;
  /** Fourni pour modifier une réponse existante. */
  participantId?: string;
}

export interface SubmitResponseResult {
  error?: string;
}

export async function submitResponse(
  input: SubmitResponseInput,
): Promise<SubmitResponseResult> {
  const name = input.name?.trim();
  if (!name) return { error: "Indiquez votre nom." };

  const poll = await prisma.poll.findUnique({
    where: { id: input.pollId },
    include: { slots: { select: { id: true } } },
  });
  if (!poll) return { error: "Sondage introuvable." };
  if (poll.closed) return { error: "Ce sondage est clôturé." };

  const validSlotIds = new Set(poll.slots.map((s) => s.id));
  const votesData = Object.entries(input.votes)
    .filter(([slotId]) => validSlotIds.has(slotId))
    .map(([slotId, status]) => ({ slotId, status }));

  await prisma.$transaction(async (tx) => {
    let participantId = input.participantId;

    if (participantId) {
      // Modification : on vérifie qu'il appartient bien à ce sondage.
      const existing = await tx.participant.findFirst({
        where: { id: participantId, pollId: poll.id },
      });
      if (!existing) participantId = undefined;
    }

    if (participantId) {
      await tx.participant.update({
        where: { id: participantId },
        data: { name },
      });
      await tx.vote.deleteMany({ where: { participantId } });
    } else {
      const participant = await tx.participant.create({
        data: { pollId: poll.id, name },
      });
      participantId = participant.id;
    }

    if (votesData.length > 0) {
      await tx.vote.createMany({
        data: votesData.map((v) => ({ ...v, participantId: participantId! })),
      });
    }
  });

  revalidatePath(`/sondage/${input.pollId}`);
  return {};
}

export async function setPollClosed(
  pollId: string,
  adminToken: string,
  closed: boolean,
): Promise<{ error?: string }> {
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll || poll.adminToken !== adminToken) {
    return { error: "Action non autorisée." };
  }
  await prisma.poll.update({ where: { id: pollId }, data: { closed } });
  revalidatePath(`/sondage/${pollId}`);
  return {};
}

export async function deletePoll(
  pollId: string,
  adminToken: string,
): Promise<{ error?: string }> {
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll || poll.adminToken !== adminToken) {
    return { error: "Action non autorisée." };
  }
  await prisma.poll.delete({ where: { id: pollId } });
  redirect("/");
}
