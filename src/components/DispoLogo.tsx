/**
 * Logo Dispo — symbole « grille de créneaux » + logotype en texte vif.
 *
 * Le symbole est une trame de 3 × 2 cases ; la case du milieu de la rangée du
 * bas est verte : le créneau qui fait l'unanimité. Toute la géométrie dérive
 * d'une seule variable, la taille du mot (`size`, en px) :
 *
 *   case = 0.30 × size · gouttière = 0.10 × size · rayon = 0.21 × case
 *   écart symbole ↔ mot = 0.35 × size
 *   hauteur du symbole = 0.70 × size (= hauteur de capitale d'Helvetica 700)
 *
 * Le logotype reste du texte (jamais une image) : il doit demeurer net et
 * sélectionnable. Aucune police n'est chargée, la pile système suffit.
 */

type Variant = "horizontal" | "stacked" | "symbol" | "tile";
type Tone = "auto" | "light" | "dark" | "mono";

/**
 * Le ton « auto » s'appuie sur des variables CSS (cf. globals.css) : le logo
 * suit alors le thème clair/sombre du site sans JavaScript. Les autres tons
 * forcent des couleurs fixes, pour les contextes hors thème.
 */
const TONES: Record<Exclude<Tone, "auto">, {
  word: string;
  cell: string;
  accent: string;
  tileBg: string;
  tileCell: string;
  tileAccent: string;
}> = {
  light: {
    word: "#1a1b15",
    cell: "#d3dad2",
    accent: "#2e9e52",
    tileBg: "#2e9e52",
    tileCell: "rgba(255,255,255,0.38)",
    tileAccent: "#ffffff",
  },
  dark: {
    word: "#f6f5f2",
    cell: "rgba(255,255,255,0.28)",
    accent: "#6fd086",
    tileBg: "#6fd086",
    tileCell: "rgba(21,23,17,0.35)",
    tileAccent: "#151711",
  },
  mono: {
    word: "#1a1b15",
    cell: "#c0c6bf",
    accent: "#1a1b15",
    tileBg: "#1a1b15",
    tileCell: "rgba(255,255,255,0.35)",
    tileAccent: "#ffffff",
  },
};

const AUTO = {
  word: "var(--logo-word)",
  cell: "var(--logo-cell)",
  accent: "var(--logo-accent)",
  tileBg: "var(--logo-tile-bg)",
  tileCell: "var(--logo-tile-cell)",
  tileAccent: "var(--logo-tile-accent)",
};

function Grid({
  cell,
  gap,
  radius,
  cellColor,
  accentColor,
}: {
  cell: number;
  gap: number;
  radius: number;
  cellColor: string;
  accentColor: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(3, ${cell}px)`,
        gridTemplateRows: `repeat(2, ${cell}px)`,
        gap: `${gap}px`,
        flex: "none",
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            // La 5ᵉ case (rangée 2, colonne 2) est la case retenue.
            background: i === 4 ? accentColor : cellColor,
            borderRadius: `${radius}px`,
          }}
        />
      ))}
    </span>
  );
}

export default function DispoLogo({
  variant = "horizontal",
  tone = "auto",
  size = 24,
  title = "Dispo",
}: {
  variant?: Variant;
  tone?: Tone;
  size?: number;
  title?: string;
}) {
  const t = tone === "auto" ? AUTO : TONES[tone];

  if (variant === "tile") {
    // Tuile : rayon = 23 % du côté, symbole = 62 % de la largeur.
    // 3 cases + 2 gouttières (= case/3) occupent 11/3 de case.
    const cell = (size * 0.62 * 3) / 11;
    return (
      <span
        role="img"
        aria-label={title}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.23,
          background: t.tileBg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <Grid
          cell={cell}
          gap={cell / 3}
          radius={Math.max(1, cell * 0.21)}
          cellColor={t.tileCell}
          accentColor={t.tileAccent}
        />
      </span>
    );
  }

  const cell = size * 0.3;
  const grid = (
    <Grid
      cell={cell}
      gap={size * 0.1}
      radius={Math.max(1, cell * 0.21)}
      cellColor={t.cell}
      accentColor={t.accent}
    />
  );

  if (variant === "symbol") {
    return (
      <span role="img" aria-label={title} style={{ display: "inline-flex" }}>
        {grid}
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: variant === "stacked" ? "column" : "row",
        alignItems: "center",
        gap: size * 0.35,
      }}
    >
      {grid}
      <span
        style={{
          font: `700 ${size}px/1 var(--font-sans)`,
          letterSpacing: "-0.035em",
          color: t.word,
        }}
      >
        {title}
      </span>
    </span>
  );
}
