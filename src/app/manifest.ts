import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "App Hub",
    short_name: "App Hub",
    description: "A private app launcher for personal web apps and tools.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#031827",
    theme_color: "#031827",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
