import { ImageResponse } from "next/og";

/**
 * Brand icon drawn with satori-safe primitives (flexbox, borders,
 * border-radius, rotate) — a compass ring + needle on the app's dark
 * ground with the luminous accent. One drawing serves every PWA icon
 * size and the apple-touch-icon, so there are no binary assets to keep
 * in sync.
 *
 * `maskable` pads the glyph into the safe zone (inner ~80%) per the
 * maskable-icon spec so launchers can crop to any shape.
 */
export function renderBrandIcon(size: number, maskable = false): ImageResponse {
  // Maskable icons keep all detail inside the central safe zone.
  const glyph = maskable ? size * 0.52 : size * 0.72;
  const ring = Math.max(3, Math.round(size * 0.045));
  const needle = glyph * 0.34;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0d14",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <div
          style={{
            width: glyph,
            height: glyph,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: `${ring}px solid #4d7aff`,
          }}
        >
          <div
            style={{
              width: needle,
              height: needle,
              backgroundColor: "#4cbb55",
              transform: "rotate(45deg)",
              borderRadius: needle * 0.12,
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
