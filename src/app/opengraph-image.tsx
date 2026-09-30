import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  let photo: string | null = null;
  try {
    const buf = await readFile(join(process.cwd(), "public", "images", "ramesh.jpg"));
    photo = `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    photo = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: 72,
          gap: 56,
          background: "linear-gradient(135deg, #0a0d13 0%, #10141c 60%, #0f2a2a 100%)",
          color: "#e8eaef",
          fontFamily: "sans-serif",
        }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={300} height={300} style={{ width: 300, height: 300, borderRadius: 40, objectFit: "cover", objectPosition: "top", border: "4px solid rgba(45,212,191,0.5)" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: "#5eead4" }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#2dd4bf" }} />
            {site.role} · {site.company}
          </div>
          <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: -2, lineHeight: 1 }}>{site.name}</div>
          <div style={{ fontSize: 28, color: "#98a1b3", lineHeight: 1.35, maxWidth: 680 }}>{site.tagline}</div>
          <div style={{ marginTop: 12, fontSize: 22, color: "#6b7486" }}>{site.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
