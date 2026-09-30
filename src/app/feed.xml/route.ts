import { getPublishedPosts } from "@/db/queries";
import { site } from "@/lib/site";

export const revalidate = 3600;

function escape(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export async function GET() {
  const posts = await getPublishedPosts({ limit: 50 });
  const base = site.url.replace(/\/$/, "");
  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escape(p.title)}</title>
      <link>${base}/blog/${p.slug}</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
      <description>${escape(p.excerpt)}</description>
      ${p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : ""}
      ${p.tags.map((t) => `<category>${escape(t)}</category>`).join("")}
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(site.name)} — Blog</title>
    <link>${base}/blog</link>
    <description>${escape(site.description)}</description>
    <language>en</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate" },
  });
}
