import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/db/queries";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getPostBySlug(slug);
  const title = row?.post.title ?? "Blog";
  const date = row?.post.publishedAt ? formatDate(row.post.publishedAt, { year: "numeric", month: "long", day: "numeric" }) : "";
  const tags = row?.post.tags.slice(0, 3) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0a0d13 0%, #10141c 60%, #0f2a2a 100%)",
          color: "#e8eaef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#98a1b3" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#2dd4bf" }} />
          {site.name} · Blog
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: title.length > 60 ? 54 : 66, lineHeight: 1.08, fontWeight: 600, letterSpacing: -1.5, maxWidth: 1000 }}>{title}</div>
          <div style={{ display: "flex", gap: 12 }}>
            {tags.map((t) => (
              <div
                key={t}
                style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(45,212,191,0.4)", background: "rgba(45,212,191,0.12)", color: "#5eead4", fontSize: 20 }}
              >
                {`#${t}`}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: "#98a1b3" }}>
          <span>{date}</span>
          <span>{site.url.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
