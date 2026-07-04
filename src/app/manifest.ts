import type { MetadataRoute } from "next";

/**
 * PWA manifest (Feature 11) — Next App Router file convention (auto-links
 * <link rel="manifest">). Icons are generated at request time by the
 * ImageResponse routes under /icons/* — no binary assets in the repo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Career OS — Navigate your career with intent",
    short_name: "Career OS",
    description:
      "The candidate-centered career intelligence platform. See where you stand, where you can go, and what to do next.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d14",
    theme_color: "#0b0d14",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
