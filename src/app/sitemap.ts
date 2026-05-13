import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.siteUrl.replace(/\/$/, "");

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${base}/analyze`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // /results é excluído do sitemap — conteúdo personalizado por sessão
  ];
}
