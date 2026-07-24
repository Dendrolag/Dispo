import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CopyField from "@/components/CopyField";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ admin?: string }>;
}

export const metadata = { title: "Sondage créé" };

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function SharePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { admin } = await searchParams;
  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) notFound();

  const origin = await baseUrl();
  const publicUrl = `${origin}/sondage/${poll.id}`;
  // On ne présente un lien d'administration que si le jeton est bien le bon :
  // sinon la page afficherait comme « privé » un lien sans aucun pouvoir.
  const adminUrl =
    admin && admin === poll.adminToken
      ? `${origin}/sondage/${poll.id}?admin=${poll.adminToken}`
      : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-3xl">
          🎉
        </div>
        <h1 className="text-3xl font-bold">Votre sondage est prêt !</h1>
        <p className="mt-2 text-muted">
          Partagez ce lien avec les participants. Aucun compte ne leur sera
          demandé.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
        <CopyField label="Lien à partager" value={publicUrl} />

        {adminUrl && (
          <div className="rounded-xl border border-brand/30 bg-brand-soft/50 p-4">
            <CopyField label="Votre lien d’administration (privé)" value={adminUrl} />
            <p className="mt-2 text-xs text-muted">
              ⚠️ Gardez ce lien pour vous : il permet de clôturer ou supprimer le
              sondage. Mettez-le en favori, il ne sera plus affiché.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href={adminUrl ?? publicUrl}
            className="rounded-xl bg-brand px-6 py-3 font-medium text-brand-fg transition hover:bg-brand-hover"
          >
            Voir le sondage
          </Link>
          <Link
            href="/creer"
            className="rounded-xl border border-border px-6 py-3 font-medium transition hover:bg-brand-soft"
          >
            Créer un autre sondage
          </Link>
        </div>
      </div>
    </div>
  );
}
