@AGENTS.md

# Dispo

Web app pour trouver un créneau commun (alternative gratuite à Doodle).
Voir [README.md](README.md) pour la présentation complète.

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind v4 ·
Prisma 6 · PostgreSQL.

## Repères

- **Base de données** : `DATABASE_URL` dans `.env`. Client Prisma généré dans
  `src/generated/prisma` (git-ignoré, régénéré via `postinstall`). Après toute
  modification de `prisma/schema.prisma`, lancer `npm run db:migrate`.
- **Mutations** : centralisées dans `src/app/actions.ts` (Server Actions). Pas
  d'API REST.
- **Dates** : heure « flottante » ancrée sur UTC — la saisie `datetime-local`
  est interprétée et réaffichée en UTC pour rester identique pour tous. Ne pas
  réintroduire de fuseau local sans réfléchir à la cohérence serveur/client.
- **Accès organisateur** : via `adminToken` passé en query (`?admin=…`), vérifié
  côté serveur dans les actions.

## Vérifications avant commit

```bash
npm run lint
npx tsc --noEmit
npm run build
```

En environnement web, le hook `SessionStart` démarre Postgres et applique les
migrations automatiquement.
