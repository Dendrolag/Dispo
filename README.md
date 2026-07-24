# Dispo 📅

Trouvez un créneau commun, sans prise de tête — l'alternative gratuite à Doodle.

Créez un sondage de disponibilités, partagez un lien (aucun compte requis), et
laissez Dispo faire ressortir le meilleur moment pour tout le monde.

## Fonctionnalités

- **Créer un sondage** : titre, description, lieu, organisateur, et une liste de
  créneaux (date + heure de début, fin optionnelle).
- **Lien partageable** : un lien public pour les participants + un lien
  d'administration privé pour l'organisateur.
- **Voter** : chaque participant indique sa disponibilité par créneau
  (Oui / Si besoin / Non), et peut envoyer sa réponse sans créer de compte.
- **Résultats en direct** : grille façon Doodle, décompte par créneau, et mise
  en évidence automatique du/des meilleur(s) créneau(x).
- **Gestion** : l'organisateur peut clôturer, rouvrir ou supprimer le sondage
  via son lien d'administration.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Prisma 6](https://www.prisma.io/) + PostgreSQL
- Mutations via **Server Actions** (pas d'API REST séparée)

## Modèle de données

`Poll` → plusieurs `TimeSlot` (créneaux) et `Participant`.
Chaque participant a un `Vote` par créneau (`YES` / `MAYBE` / `NO`).
Voir [`prisma/schema.prisma`](prisma/schema.prisma).

## Démarrage

### 1. Dépendances

```bash
npm install
```

### 2. Base de données

Dispo utilise PostgreSQL. Renseignez `DATABASE_URL` dans un fichier `.env`
(voir [`.env.example`](.env.example)) :

```bash
DATABASE_URL="postgresql://user:password@host:5432/dispo?schema=public"
```

- **Local** : un Postgres local, ou celui fourni par votre environnement.
- **Production** : la connection string d'un service managé
  ([Supabase](https://supabase.com/) ou [Neon](https://neon.tech/)).

Appliquez le schéma :

```bash
npm run db:migrate      # crée/applique les migrations en dev
npm run db:seed         # (optionnel) données de démonstration
```

### 3. Lancer

```bash
npm run dev             # http://localhost:3000
```

## Scripts

| Script               | Rôle                                     |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Serveur de développement                 |
| `npm run build`      | Build de production                      |
| `npm run start`      | Sert le build de production              |
| `npm run lint`       | ESLint                                   |
| `npm run db:migrate` | Migrations Prisma (dev)                  |
| `npm run db:studio`  | Prisma Studio (exploration de la base)   |
| `npm run db:seed`    | Insère un sondage de démonstration       |

## Note sur les fuseaux horaires

Les créneaux sont traités en heure **« flottante »** : l'heure saisie dans le
formulaire est stockée puis réaffichée telle quelle à tous les participants,
quel que soit leur fuseau (ancrage sur UTC). C'est le comportement le plus
intuitif pour un groupe partageant le même contexte. Voir
[`src/lib/format.ts`](src/lib/format.ts) et `parseDate` dans
[`src/app/actions.ts`](src/app/actions.ts).

## Déploiement (Vercel + Neon)

Le projet est prêt pour un déploiement serverless. Le schéma Prisma lit
`DATABASE_URL` (connexion **poolée**, utilisée par l'app) et
`DATABASE_URL_UNPOOLED` (connexion **directe**, utilisée par les migrations) —
ce sont exactement les variables créées par l'intégration **Neon** de Vercel,
donc aucune variable à saisir à la main.

1. **Importer le repo** sur [Vercel](https://vercel.com/new) (framework
   Next.js détecté automatiquement).
2. **Créer la base** : onglet **Storage** → **Create Database** → **Neon**
   (région EU recommandée). L'intégration injecte `DATABASE_URL` et
   `DATABASE_URL_UNPOOLED` automatiquement.
3. **Déployer**. Vercel exécute le script `vercel-build`
   (`prisma migrate deploy && next build`) : les migrations sont appliquées
   automatiquement, puis l'app est buildée. Le client Prisma est régénéré via
   `postinstall`.

Aucune autre configuration n'est nécessaire. En cas de rotation des
identifiants côté Neon, les variables Vercel se mettent à jour toutes seules.

## Structure

```
src/
  app/
    page.tsx                    # Accueil
    creer/page.tsx              # Formulaire de création (client)
    actions.ts                  # Server Actions (créer, voter, clôturer…)
    sondage/[id]/
      page.tsx                  # Page du sondage (résultats + vote)
      ResultsGrid.tsx           # Grille de disponibilités
      VoteForm.tsx              # Formulaire de réponse (client)
      AdminPanel.tsx            # Commandes organisateur (client)
      partage/page.tsx          # Page post-création (liens à partager)
  components/CopyField.tsx      # Champ « copier le lien »
  lib/
    prisma.ts                   # Client Prisma (singleton)
    availability.ts             # Décompte des votes, meilleur créneau
    format.ts                   # Formatage des dates en français
prisma/
  schema.prisma                 # Modèle de données
  seed.ts                       # Données de démo
```

## Environnement Claude Code (web)

Un hook `SessionStart` ([`.claude/hooks/session-start.sh`](.claude/hooks/session-start.sh))
démarre automatiquement un Postgres local et applique les migrations au début
de chaque session, afin que `npm run dev` et les tests fonctionnent sans
configuration manuelle.
