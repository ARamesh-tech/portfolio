import { site } from "@/lib/site";
import { absoluteUrl, formatDate } from "@/lib/utils";

type PostSummary = { title: string; slug: string; excerpt: string; publishedAt: Date | null; readingTime: number; tags: string[] };

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function layout({ title, preheader, body, unsubscribeUrl }: { title: string; preheader: string; body: string; unsubscribeUrl?: string }) {
  const footer = unsubscribeUrl
    ? `You're receiving this because you subscribed to ${escapeHtml(site.name)}'s blog. <a href="${unsubscribeUrl}" style="color:#6b7486">Unsubscribe</a>`
    : `Sent from <a href="${site.url}" style="color:#6b7486">${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</a>`;
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141821">
  <span style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e8ee;border-radius:20px;overflow:hidden">
        <tr><td style="padding:24px 32px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#0f8f86">${escapeHtml(site.name)} · Blog</td></tr>
        <tr><td style="padding:12px 32px 8px;font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-.02em">${escapeHtml(title)}</td></tr>
        <tr><td style="padding:0 32px 28px;font-size:15px;line-height:1.65;color:#3b4252">${body}</td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid #e5e8ee;font-size:12px;line-height:1.6;color:#6b7486">${footer}</td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#98a1b3">${escapeHtml(site.name)} · ${escapeHtml(site.location)}</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:18px;background:#141821;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:12px">${escapeHtml(label)}</a>`;
}

function postList(posts: PostSummary[]) {
  if (posts.length === 0) return `<p style="margin:12px 0 0">The first posts are being written — you'll hear from me the moment one is published.</p>`;
  return posts
    .map(
      (p) => `
      <div style="margin-top:16px;padding:14px 16px;border:1px solid #e5e8ee;border-radius:14px">
        <a href="${absoluteUrl(`/blog/${p.slug}`)}" style="font-weight:600;color:#141821;text-decoration:none;font-size:16px">${escapeHtml(p.title)}</a>
        <p style="margin:6px 0 0;font-size:13px;color:#6b7486">${escapeHtml(p.excerpt)}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#98a1b3">${p.publishedAt ? formatDate(p.publishedAt) : ""} · ${p.readingTime} min read</p>
      </div>`,
    )
    .join("");
}

export function welcomeEmail({ name, recentPosts, unsubscribeUrl }: { name?: string | null; recentPosts: PostSummary[]; unsubscribeUrl: string }) {
  const greeting = name ? `Hi ${escapeHtml(name.split(" ")[0]!)},` : "Hi there,";
  const title = `Welcome to the blog`;
  const body = `
    <p style="margin:0">${greeting}</p>
    <p style="margin:12px 0 0">Thanks for subscribing. I write about backend systems, data pipelines, PostgreSQL and the practical side of shipping software — usually a few posts a month, never spam.</p>
    <p style="margin:18px 0 0;font-weight:600;color:#141821">${recentPosts.length ? "Start here" : "What to expect"}</p>
    ${postList(recentPosts)}
    ${button(absoluteUrl("/blog"), "Visit the blog")}
    <p style="margin:22px 0 0;font-size:13px;color:#6b7486">Every email includes a one-click unsubscribe link, and you can also manage it from your account on the site.</p>`;
  const text = [
    greeting,
    "",
    "Thanks for subscribing to my blog. I write about backend systems, data pipelines, PostgreSQL and shipping software.",
    "",
    recentPosts.length ? "Start here:" : "The first posts are on their way.",
    ...recentPosts.map((p) => `- ${p.title} — ${absoluteUrl(`/blog/${p.slug}`)}`),
    "",
    `Blog: ${absoluteUrl("/blog")}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
  return { subject: `Welcome to ${site.shortName}'s blog`, html: layout({ title, preheader: "Thanks for subscribing — here's what to expect.", body, unsubscribeUrl }), text };
}

export function newPostEmail({ post, name, unsubscribeUrl }: { post: PostSummary; name?: string | null; unsubscribeUrl: string }) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const greeting = name ? `Hi ${escapeHtml(name.split(" ")[0]!)},` : "Hi there,";
  const body = `
    <p style="margin:0">${greeting}</p>
    <p style="margin:12px 0 0">I just published a new post:</p>
    <p style="margin:14px 0 0;font-size:20px;font-weight:600;line-height:1.3;color:#141821"><a href="${url}" style="color:#141821;text-decoration:none">${escapeHtml(post.title)}</a></p>
    <p style="margin:10px 0 0">${escapeHtml(post.excerpt)}</p>
    <p style="margin:10px 0 0;font-size:12px;color:#98a1b3">${post.readingTime} min read${post.tags.length ? ` · ${post.tags.map((t) => `#${escapeHtml(t)}`).join(" ")}` : ""}</p>
    ${button(url, "Read the post")}
    <p style="margin:22px 0 0;font-size:13px;color:#6b7486">Have thoughts? Sign in on the site to leave a comment — I read and reply to every one.</p>`;
  const text = [greeting, "", "New post:", post.title, "", post.excerpt, "", `Read: ${url}`, "", `Unsubscribe: ${unsubscribeUrl}`].join("\n");
  return { subject: `New post: ${post.title}`, html: layout({ title: "New on the blog", preheader: post.excerpt, body, unsubscribeUrl }), text };
}

export function contactNotificationEmail({ name, email, subject, message }: { name: string; email: string; subject: string; message: string }) {
  const body = `
    <p style="margin:0"><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p style="margin:6px 0 0"><strong>Subject:</strong> ${escapeHtml(subject || "(none)")}</p>
    <div style="margin-top:16px;padding:14px 16px;background:#f6f7f9;border-radius:14px;white-space:pre-wrap">${escapeHtml(message)}</div>
    ${button(absoluteUrl("/admin/messages"), "Open inbox")}`;
  const text = `From: ${name} <${email}>\nSubject: ${subject || "(none)"}\n\n${message}\n\nInbox: ${absoluteUrl("/admin/messages")}`;
  return { subject: `[Portfolio] ${subject || "New message"} — from ${name}`, html: layout({ title: "New contact message", preheader: message.slice(0, 120), body }), text };
}
