import Link from "next/link";
import { Availability, type SlotTally } from "@/lib/availability";
import { formatDay, formatSlotRange, formatTime, dayKey } from "@/lib/format";

export interface GridSlot {
  id: string;
  startsAt: Date;
  endsAt: Date | null;
}

export interface GridParticipant {
  id: string;
  name: string;
  votes: Record<string, Availability>;
  /** Lien de modification de cette réponse ; null si le sondage est clôturé. */
  editHref?: string | null;
  /** Vrai si cette réponse est celle en cours de modification. */
  editing?: boolean;
}

const MARK: Record<Availability, { symbol: string; label: string; className: string }> = {
  [Availability.YES]: {
    symbol: "✓",
    label: "Disponible",
    className: "bg-yes/15 text-yes-strong",
  },
  [Availability.MAYBE]: {
    symbol: "~",
    label: "Si besoin",
    className: "bg-maybe/15 text-maybe",
  },
  [Availability.NO]: {
    symbol: "✕",
    label: "Non disponible",
    className: "bg-no/10 text-no/70",
  },
};

export default function ResultsGrid({
  slots,
  participants,
  tallies,
  bestIds,
}: {
  slots: GridSlot[];
  participants: GridParticipant[];
  tallies: Map<string, SlotTally>;
  bestIds: Set<string>;
}) {
  // Regroupe les créneaux par jour pour l'en-tête (colspan).
  const dayGroups: { key: string; label: string; count: number }[] = [];
  for (const slot of slots) {
    const key = dayKey(slot.startsAt);
    const last = dayGroups[dayGroups.length - 1];
    if (last && last.key === key) last.count += 1;
    else dayGroups.push({ key, label: formatDay(slot.startsAt), count: 1 });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface p-3 text-left font-semibold">
              {participants.length} participant
              {participants.length > 1 ? "s" : ""}
            </th>
            {dayGroups.map((g) => (
              <th
                key={g.key}
                scope="colgroup"
                colSpan={g.count}
                className="border-l border-border p-2 text-center font-semibold"
              >
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            <th className="sticky left-0 z-10 bg-surface p-2" />
            {slots.map((slot) => {
              const best = bestIds.has(slot.id);
              return (
                <th
                  key={slot.id}
                  scope="col"
                  className={`border-l border-border p-2 text-center font-normal text-muted ${
                    best ? "bg-brand-soft" : ""
                  }`}
                >
                  <div className="whitespace-nowrap">
                    {slot.endsAt
                      ? formatSlotRange(slot.startsAt, slot.endsAt)
                      : formatTime(slot.startsAt)}
                  </div>
                  {best && (
                    <div className="mt-0.5 text-xs font-semibold text-brand-strong">
                      ★ Idéal
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {participants.length === 0 && (
            <tr>
              <td
                colSpan={slots.length + 1}
                className="p-6 text-center text-muted"
              >
                Aucune réponse pour l&apos;instant. Soyez le premier !
              </td>
            </tr>
          )}
          {participants.map((p) => (
            <tr
              key={p.id}
              className={`border-t border-border ${
                p.editing ? "bg-brand-soft/40" : ""
              }`}
            >
              <th
                scope="row"
                className="sticky left-0 z-10 bg-surface p-3 text-left font-medium"
              >
                <span className="flex items-center gap-2">
                  <span>{p.name}</span>
                  {p.editHref && (
                    <Link
                      href={p.editHref}
                      aria-label={`Modifier la réponse de ${p.name}`}
                      className="shrink-0 text-xs font-normal text-brand-strong underline decoration-dotted"
                    >
                      Modifier
                    </Link>
                  )}
                </span>
              </th>
              {slots.map((slot) => {
                const status = p.votes[slot.id] ?? Availability.NO;
                const mark = MARK[status];
                const best = bestIds.has(slot.id);
                return (
                  <td
                    key={slot.id}
                    className={`border-l border-border p-2 text-center ${
                      best ? "bg-brand-soft/40" : ""
                    }`}
                  >
                    <span
                      className={`inline-grid h-7 w-7 place-items-center rounded-full font-semibold ${mark.className}`}
                      aria-hidden="true"
                    >
                      {mark.symbol}
                    </span>
                    <span className="sr-only">{mark.label}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-border">
            <td className="sticky left-0 z-10 bg-surface p-3 font-semibold">
              Disponibles
            </td>
            {slots.map((slot) => {
              const t = tallies.get(slot.id);
              const best = bestIds.has(slot.id);
              return (
                <td
                  key={slot.id}
                  className={`border-l border-border p-2 text-center ${
                    best ? "bg-brand-soft font-semibold text-brand-strong" : ""
                  }`}
                >
                  <div className="text-base font-semibold">{t?.yes ?? 0}</div>
                  {t && t.maybe > 0 && (
                    <div className="text-xs text-maybe">+{t.maybe} si besoin</div>
                  )}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
