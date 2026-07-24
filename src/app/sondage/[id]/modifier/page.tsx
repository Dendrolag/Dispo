import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toDateTimeLocalValue } from "@/lib/format";
import EditPollForm, { type EditPollData } from "./EditPollForm";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ admin?: string }>;
}

export const metadata = { title: "Modifier le sondage" };

export default async function EditPollPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { admin } = await searchParams;

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: { slots: { orderBy: { position: "asc" } } },
  });
  if (!poll) notFound();

  // Accès réservé à l'organisateur.
  if (!admin || admin !== poll.adminToken) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-bold">Accès réservé</h1>
        <p className="mt-2 text-muted">
          La modification d’un sondage nécessite le lien d’administration.
        </p>
        <Link
          href={`/sondage/${poll.id}`}
          className="mt-6 inline-block rounded-xl border border-border px-6 py-3 font-medium transition hover:bg-brand-soft"
        >
          Retour au sondage
        </Link>
      </div>
    );
  }

  const data: EditPollData = {
    pollId: poll.id,
    adminToken: poll.adminToken,
    title: poll.title,
    description: poll.description ?? "",
    location: poll.location ?? "",
    organizerName: poll.organizerName ?? "",
    slots: poll.slots.map((s) => ({
      id: s.id,
      start: toDateTimeLocalValue(s.startsAt),
      end: s.endsAt ? toDateTimeLocalValue(s.endsAt) : "",
    })),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Modifier le sondage</h1>
      <p className="mt-2 text-muted">
        Corrigez les informations et les créneaux. Les réponses déjà reçues sur
        les créneaux conservés sont préservées.
      </p>
      <EditPollForm data={data} />
    </div>
  );
}
