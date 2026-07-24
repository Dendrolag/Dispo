import Link from "next/link";

const steps = [
  {
    emoji: "📝",
    title: "Proposez des créneaux",
    text: "Donnez un titre à votre événement et ajoutez les dates et horaires possibles.",
  },
  {
    emoji: "🔗",
    title: "Partagez le lien",
    text: "Dispo génère un lien unique. Envoyez-le à qui vous voulez, aucun compte requis.",
  },
  {
    emoji: "✅",
    title: "Trouvez le meilleur moment",
    text: "Chacun coche ses disponibilités, et le créneau idéal se met en évidence tout seul.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      <section className="mx-auto max-w-2xl text-center">
        <p className="label-mono mb-4 text-brand">
          L&apos;alternative gratuite à Doodle
        </p>
        <h1 className="text-4xl font-bold sm:text-5xl">
          Trouvez un créneau commun,
          <br />
          sans prise de tête.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
          Créez un sondage de disponibilités, partagez le lien, et laissez Dispo
          faire ressortir le meilleur moment pour tout le monde.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/creer"
            className="rounded-xl bg-brand px-6 py-3 font-medium text-brand-fg shadow-sm transition hover:bg-brand-hover"
          >
            Créer un sondage gratuitement
          </Link>
          <span className="text-sm text-muted">
            Gratuit · Sans compte · Sans pub
          </span>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-xl">
                {step.emoji}
              </span>
              <span className="label-mono text-subtle">Étape {i + 1}</span>
            </div>
            <h2 className="mb-1 text-lg font-semibold">{step.title}</h2>
            <p className="text-sm text-muted">{step.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
