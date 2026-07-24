import { PrismaClient, Availability } from "../src/generated/prisma";

const prisma = new PrismaClient();

// Heure « flottante » ancrée sur UTC (cohérent avec l'affichage, cf. lib/format).
function at(dayOffset: number, hour: number, minute = 0): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + dayOffset,
      hour,
      minute,
      0,
      0,
    ),
  );
}

async function main() {
  // Sondage de démonstration.
  const poll = await prisma.poll.create({
    data: {
      title: "Dîner d’équipe 🍝",
      description: "On cherche une soirée qui arrange tout le monde.",
      location: "Chez Luigi, Lyon",
      organizerName: "Rémi",
      slots: {
        create: [
          { startsAt: at(3, 19, 30), endsAt: at(3, 22, 0), position: 0 },
          { startsAt: at(4, 19, 30), endsAt: at(4, 22, 0), position: 1 },
          { startsAt: at(4, 20, 0), endsAt: at(4, 22, 30), position: 2 },
          { startsAt: at(7, 19, 0), endsAt: at(7, 21, 30), position: 3 },
        ],
      },
    },
    include: { slots: true },
  });

  const [s0, s1, s2, s3] = poll.slots;

  const responses: { name: string; votes: Record<string, Availability> }[] = [
    {
      name: "Alice",
      votes: {
        [s0.id]: Availability.YES,
        [s1.id]: Availability.NO,
        [s2.id]: Availability.MAYBE,
        [s3.id]: Availability.YES,
      },
    },
    {
      name: "Bruno",
      votes: {
        [s0.id]: Availability.YES,
        [s1.id]: Availability.YES,
        [s2.id]: Availability.YES,
        [s3.id]: Availability.NO,
      },
    },
    {
      name: "Chloé",
      votes: {
        [s0.id]: Availability.MAYBE,
        [s1.id]: Availability.YES,
        [s2.id]: Availability.YES,
        [s3.id]: Availability.YES,
      },
    },
  ];

  for (const r of responses) {
    await prisma.participant.create({
      data: {
        pollId: poll.id,
        name: r.name,
        votes: {
          create: Object.entries(r.votes).map(([slotId, status]) => ({
            slotId,
            status,
          })),
        },
      },
    });
  }

  console.log(`Sondage de démo créé : /sondage/${poll.id}`);
  console.log(`Lien admin : /sondage/${poll.id}?admin=${poll.adminToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
