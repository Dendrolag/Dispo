// Génération d'un fichier iCalendar (.ics) pour un créneau retenu.
//
// Cohérence avec le modèle « heure flottante » de Dispo : les créneaux sont
// stockés en UTC mais représentent une heure locale identique pour tous. On les
// émet donc comme DATE-TIME « flottants » iCalendar (sans suffixe « Z » ni
// TZID) : le client calendrier les affiche à l'heure indiquée, quel que soit
// son fuseau — exactement comme dans l'app.

export interface IcsEvent {
  uid: string;
  start: Date;
  /** Fin ; par défaut début + 1h si absente. */
  end?: Date | null;
  summary: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
}

/** Échappe le texte selon la RFC 5545 (\\ , ; et retours ligne). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Composants UTC → « YYYYMMDDTHHMMSS » (flottant, sans Z). */
function floatingStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`
  );
}

/** Horodatage UTC absolu (avec Z) pour DTSTAMP. */
function utcStamp(date: Date): string {
  return `${floatingStamp(date)}Z`;
}

/** Repli des lignes à 75 octets (RFC 5545) : continuation par espace. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    chunks.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length > 0) chunks.push(" " + rest);
  return chunks.join("\r\n");
}

/** Construit un calendrier iCalendar à un seul événement. */
export function buildIcs(event: IcsEvent): string {
  const end =
    event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dispo//Sondage de disponibilités//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${floatingStamp(event.start)}`,
    `DTEND:${floatingStamp(end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${escapeText(event.url)}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
