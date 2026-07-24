import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildIcs } from "@/lib/ics";

/**
 * Renvoie le créneau retenu d'un sondage au format iCalendar (.ics), pour
 * l'ajouter à Google/Apple/Outlook. Disponible uniquement lorsqu'un créneau a
 * été retenu par l'organisateur.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: { finalSlot: true },
  });

  if (!poll || !poll.finalSlot) {
    return new Response("Aucun créneau retenu pour ce sondage.", {
      status: 404,
    });
  }

  const pollUrl = new URL(`/sondage/${poll.id}`, request.nextUrl.origin).toString();
  const descriptionParts = [poll.description?.trim(), pollUrl].filter(Boolean);

  const ics = buildIcs({
    uid: `${poll.id}-${poll.finalSlot.id}@dispo`,
    start: poll.finalSlot.startsAt,
    end: poll.finalSlot.endsAt,
    summary: poll.title,
    description: descriptionParts.join("\n\n") || null,
    location: poll.location,
    url: pollUrl,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dispo.ics"',
      "Cache-Control": "no-store",
    },
  });
}
