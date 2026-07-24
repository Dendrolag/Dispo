import { Availability } from "@/generated/prisma";

export { Availability };

/** Résumé du décompte des votes pour un créneau. */
export interface SlotTally {
  slotId: string;
  yes: number;
  maybe: number;
  no: number;
  /** Score utilisé pour classer les créneaux (oui = 1, peut-être = 0,5). */
  score: number;
}

interface VoteLike {
  slotId: string;
  status: Availability;
}

/**
 * Calcule le décompte par créneau à partir de la liste plate des votes.
 * Chaque créneau connu est présent dans le résultat, même sans aucun vote.
 */
export function tallyVotes(
  slotIds: string[],
  votes: VoteLike[],
): Map<string, SlotTally> {
  const tallies = new Map<string, SlotTally>();
  for (const slotId of slotIds) {
    tallies.set(slotId, { slotId, yes: 0, maybe: 0, no: 0, score: 0 });
  }

  for (const vote of votes) {
    const tally = tallies.get(vote.slotId);
    if (!tally) continue;
    if (vote.status === Availability.YES) tally.yes += 1;
    else if (vote.status === Availability.MAYBE) tally.maybe += 1;
    else tally.no += 1;
  }

  for (const tally of tallies.values()) {
    tally.score = tally.yes + tally.maybe * 0.5;
  }

  return tallies;
}

/**
 * Identifie le ou les meilleurs créneaux (score maximal, > 0).
 * Renvoie un ensemble d'ids de créneaux gagnants (souvent un seul, parfois ex æquo).
 */
export function bestSlotIds(tallies: Map<string, SlotTally>): Set<string> {
  let best = 0;
  for (const tally of tallies.values()) {
    if (tally.score > best) best = tally.score;
  }
  const winners = new Set<string>();
  if (best <= 0) return winners;
  for (const tally of tallies.values()) {
    if (tally.score === best) winners.add(tally.slotId);
  }
  return winners;
}
