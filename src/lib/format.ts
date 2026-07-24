// Formatage de dates/heures en français, cohérent entre serveur et client.
//
// Les créneaux sont manipulés en heure « flottante » : l'heure saisie dans le
// formulaire (ex. 20:00) est stockée puis réaffichée telle quelle à tous les
// participants, quel que soit leur fuseau. On ancre donc l'affichage sur UTC
// (voir parseFloatingDate côté actions, qui interprète la saisie comme UTC).
const TZ = "UTC";

const dayFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TZ,
});

const dayLongFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

/** « lun. 28 juil. » */
export function formatDay(date: Date): string {
  return dayFmt.format(date);
}

/** « lundi 28 juillet 2026 » */
export function formatDayLong(date: Date): string {
  return dayLongFmt.format(date);
}

/** « 14:30 » */
export function formatTime(date: Date): string {
  return timeFmt.format(date);
}

/** Plage horaire d'un créneau, ex. « 14:30 – 15:30 » ou « 14:30 ». */
export function formatSlotRange(startsAt: Date, endsAt: Date | null): string {
  if (!endsAt) return formatTime(startsAt);
  return `${formatTime(startsAt)} – ${formatTime(endsAt)}`;
}

/**
 * Valeur pour un `<input type="datetime-local">` (« YYYY-MM-DDTHH:mm »),
 * construite à partir des composants UTC (heure « flottante ») pour rester
 * cohérente avec parseDate côté actions.
 */
export function toDateTimeLocalValue(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${p(date.getUTCMonth() + 1)}-${p(date.getUTCDate())}` +
    `T${p(date.getUTCHours())}:${p(date.getUTCMinutes())}`
  );
}

/** Clé de regroupement par jour (année-mois-jour en heure de Paris). */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(date);
}
