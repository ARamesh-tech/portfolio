import type { MetadataRoute } from "next";
import { getPostSlugsForSitemap } from "@/db/queries";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, "");
  const posts = await getPostSlugsForSitemap();
  const staticRoutes = ["", "/experience", "/projects", "/skills", "/about", "/contact", "/blog", "/resume"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: (p === "/blog" ? "daily" : "monthly") as "daily" | "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...staticRoutes,
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
