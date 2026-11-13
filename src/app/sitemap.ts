import type { MetadataRoute } from "next";
import { data } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = ["/", "/download/", "/impressum/", ...data.talks.filter((x) => x.type !== "break").map((x) => `/beitrag/${x.slug}/`)];
  const lastModified = new Date("2026-11-13");
  return paths.flatMap((path) =>
    (["de", "en"] as const).map((lang) => ({
      url: `${base}/${lang}${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path.startsWith("/beitrag/") ? 0.7 : 0.3,
      alternates: { languages: { de: `${base}/de${path}`, en: `${base}/en${path}` } },
    }))
  );
}
