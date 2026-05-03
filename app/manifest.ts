import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Abs4u",
    short_name: "Abs4u",
    description: "Premium local-first fitness planning, logging, and community MVP.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c0f",
    theme_color: "#111214",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
