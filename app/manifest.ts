import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Recepten",
    short_name: "Recepten",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "public/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "public/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}