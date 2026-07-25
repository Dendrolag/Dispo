import type { Metadata } from "next";
import Link from "next/link";
import DispoLogo from "@/components/DispoLogo";
import "./globals.css";

// Base des URL absolues (image de partage social). Vercel expose le domaine de
// production ; en local on retombe sur l'adresse de développement.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dispo — trouvez un créneau commun",
    template: "%s · Dispo",
  },
  description:
    "Créez un sondage de disponibilités et trouvez le meilleur créneau en un clic. Gratuit, sans compte.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <header className="border-b border-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            {/* Le lockup laisse place au symbole seul sous 480 px (charte). */}
            <Link href="/" aria-label="Dispo — accueil" className="inline-flex">
              <span className="hidden min-[480px]:inline-flex">
                <DispoLogo size={26} title="Dispo" />
              </span>
              <span className="inline-flex min-[480px]:hidden">
                <DispoLogo variant="symbol" size={32} title="Dispo" />
              </span>
            </Link>
            <Link
              href="/creer"
              className="rounded-lg bg-brand-strong px-3 py-1.5 text-sm font-medium text-brand-fg transition hover:bg-brand-hover"
            >
              Créer un sondage
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-border py-6 text-center text-sm text-subtle">
          Dispo — trouvez un créneau commun, sans compte et sans frais.
        </footer>
      </body>
    </html>
  );
}
