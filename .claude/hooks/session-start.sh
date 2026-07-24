#!/usr/bin/env bash
# Prépare l'environnement de dev pour Dispo au démarrage d'une session
# Claude Code (notamment sur le web) : lance un Postgres local, s'assure que la
# base et les migrations sont à jour, et génère le client Prisma.
#
# Idempotent et non bloquant : on sort toujours en 0 pour ne jamais empêcher
# le démarrage de la session.
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_DIR" || exit 0

PGBIN="/usr/lib/postgresql/16/bin"
PGDATA="/var/lib/postgresql/dispo-pgdata"
PGPORT=5433
DBNAME="dispo"
DBURL="postgresql://postgres@localhost:${PGPORT}/${DBNAME}?schema=public"

log() { echo "[dispo:session-start] $*"; }

# Postgres n'est disponible que dans cet environnement conteneurisé.
if [ ! -x "$PGBIN/pg_ctl" ]; then
  log "Postgres non installé — étape ignorée."
  exit 0
fi

# Démarre le cluster si besoin (en tant qu'utilisateur postgres, pas root).
if ! su postgres -c "$PGBIN/pg_ctl -D $PGDATA status" >/dev/null 2>&1; then
  if [ ! -d "$PGDATA/base" ]; then
    log "Initialisation du cluster Postgres…"
    mkdir -p "$PGDATA"; chown postgres:postgres "$PGDATA"; chmod 700 "$PGDATA"
    su postgres -c "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust" >/dev/null 2>&1
  fi
  log "Démarrage de Postgres sur le port ${PGPORT}…"
  su postgres -c "$PGBIN/pg_ctl -D $PGDATA -o '-p $PGPORT -k /tmp' -l $PGDATA/server.log start" >/dev/null 2>&1
  sleep 2
fi

# Crée la base si elle n'existe pas.
if ! su postgres -c "$PGBIN/psql -h /tmp -p $PGPORT -U postgres -lqt" 2>/dev/null | cut -d'|' -f1 | grep -qw "$DBNAME"; then
  log "Création de la base ${DBNAME}…"
  su postgres -c "$PGBIN/createdb -h /tmp -p $PGPORT -U postgres $DBNAME" >/dev/null 2>&1
fi

# Fichier .env local si absent (les deux variables pointent vers la base locale).
if [ ! -f "$REPO_DIR/.env" ]; then
  {
    echo "DATABASE_URL=\"$DBURL\""
    echo "DATABASE_URL_UNPOOLED=\"$DBURL\""
  } > "$REPO_DIR/.env"
  log "Fichier .env créé."
fi

# Applique les migrations et génère le client Prisma.
if [ -d "$REPO_DIR/node_modules" ]; then
  log "Application des migrations Prisma…"
  DATABASE_URL="$DBURL" DATABASE_URL_UNPOOLED="$DBURL" npx prisma migrate deploy >/dev/null 2>&1
  DATABASE_URL="$DBURL" DATABASE_URL_UNPOOLED="$DBURL" npx prisma generate >/dev/null 2>&1
  log "Base prête : $DBURL"
else
  log "node_modules absent — lancez 'npm install' puis relancez la session."
fi

exit 0
