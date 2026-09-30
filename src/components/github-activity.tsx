import { Star, GitFork, BookMarked } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { site } from "@/lib/site";
import { timeAgo } from "@/lib/utils";

type Repo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  fork: boolean;
};

type Profile = { public_repos: number; followers: number; html_url: string };

async function fetchGitHub() {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-site" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${site.githubUser}`, { headers, next: { revalidate: 3600 } }),
      fetch(`https://api.github.com/users/${site.githubUser}/repos?per_page=100&sort=pushed`, {
        headers,
        next: { revalidate: 3600 },
      }),
    ]);
    if (!profileRes.ok || !reposRes.ok) return null;
    const profile = (await profileRes.json()) as Profile;
    const repos = ((await reposRes.json()) as Repo[]).filter((r) => !r.fork);
    const languages = new Map<string, number>();
    for (const r of repos) if (r.language) languages.set(r.language, (languages.get(r.language) ?? 0) + 1);
    const topLanguages = [...languages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    return { profile, recent: repos.slice(0, 4), topLanguages, stars, total: repos.length };
  } catch {
    return null;
  }
}

export async function GitHubActivity() {
  const data = await fetchGitHub();
  if (!data) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GithubIcon className="size-4" /> GitHub
        </div>
        <p className="mt-2 text-sm text-muted">
          Live activity is unavailable right now.{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={site.socials.github} target="_blank" rel="noreferrer">
            Visit @{site.githubUser}
          </a>
        </p>
      </div>
    );
  }
  const maxLang = data.topLanguages[0]?.[1] ?? 1;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GithubIcon className="size-4" /> GitHub · live
        </div>
        <a href={data.profile.html_url} target="_blank" rel="noreferrer" className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline">
          @{site.githubUser}
        </a>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        <Stat icon={<BookMarked className="size-3.5" />} label="Repos" value={data.total} />
        <Stat icon={<Star className="size-3.5" />} label="Stars" value={data.stars} />
        <Stat icon={<GitFork className="size-3.5" />} label="Followers" value={data.profile.followers} />
      </dl>
      <div className="mt-5">
        <p className="text-[11px] font-medium tracking-wide text-muted-2 uppercase">Top languages</p>
        <ul className="mt-2 space-y-1.5">
          {data.topLanguages.map(([lang, n]) => (
            <li key={lang} className="flex items-center gap-2 text-xs">
              <span className="w-28 truncate text-muted">{lang}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${(n / maxLang) * 100}%` }} />
              </span>
              <span className="w-6 text-right font-mono text-muted-2">{n}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5">
        <p className="text-[11px] font-medium tracking-wide text-muted-2 uppercase">Recently pushed</p>
        <ul className="mt-2 divide-y">
          {data.recent.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-3 py-2 text-xs">
              <a href={r.html_url} target="_blank" rel="noreferrer" className="truncate font-medium hover:text-accent-strong">
                {r.name}
              </a>
              <span className="shrink-0 text-muted-2">{timeAgo(r.pushed_at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-surface-2/50 p-2.5">
      <dt className="flex items-center gap-1 text-[11px] text-muted">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function GitHubActivitySkeleton() {
  return <div className="card h-96 animate-pulse bg-surface-2/40" aria-hidden />;
}
