"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { site, nav } from "@/lib/site";
import { experience } from "@/content/experience";
import { projects } from "@/content/projects";
import { terminalSkills } from "@/content/skills";
import { formatMonthYear } from "@/lib/utils";

type Line = { id: number; kind: "input" | "output" | "error" | "system"; text: string };

const HELP = `Available commands:
  help            show this help
  whoami          who is Ramesh?
  experience      work & achievements
  projects        featured projects
  skills          what I work with
  contact         how to reach me
  socials         github / linkedin
  blog            open the blog
  goto <page>     navigate (home, experience, projects, skills, about, contact, blog, resume)
  theme <mode>    light | dark | system
  date            current date & time
  clear           clear the screen

Tip: use ↑/↓ for history, Tab to autocomplete.`;

const COMMANDS = ["help", "whoami", "experience", "projects", "skills", "contact", "socials", "blog", "goto", "theme", "date", "clear", "ls", "cat", "sudo", "echo", "pwd", "exit"];

export function Terminal() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [lines, setLines] = useState<Line[]>([
    { id: 0, kind: "system", text: `Welcome to ramesh.sh — type "help" to get started.` },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const push = (kind: Line["kind"], text: string) =>
    setLines((prev) => [...prev, { id: idRef.current++, kind, text }]);

  const featured = useMemo(() => projects.filter((p) => p.featured), []);

  const run = (raw: string) => {
    const cmdline = raw.trim();
    if (!cmdline) return;
    push("input", cmdline);
    setHistory((h) => [...h, cmdline]);
    setHistIdx(null);

    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        push("output", HELP);
        break;
      case "whoami":
        push(
          "output",
          `${site.name} — ${site.role} @ ${site.company}.\n${site.tagline}\nIntegrated M.Tech CSE @ VIT Vellore · SIH 2025 Winner · Co-inventor on a published patent.`,
        );
        break;
      case "experience":
        push(
          "output",
          experience
            .map((e) => `• ${e.title}\n  ${e.org} · ${formatMonthYear(e.start)} → ${e.end ? formatMonthYear(e.end) : "Present"}`)
            .join("\n"),
        );
        break;
      case "projects":
        push(
          "output",
          featured.map((p) => `• ${p.title}\n  ${p.tagline}${p.repo ? `\n  ${p.repo}` : ""}`).join("\n") +
            `\n\n${projects.length} projects total — run "goto projects" to see them all.`,
        );
        break;
      case "skills":
        push("output", terminalSkills.map((g) => `${g.group}: ${g.items.join(", ")}`).join("\n"));
        break;
      case "contact":
        push("output", `Email: ${site.email}\nPhone: ${site.phone}\nOr use the form: /contact`);
        break;
      case "socials":
        push("output", `GitHub:   ${site.socials.github}\nLinkedIn: ${site.socials.linkedin}`);
        break;
      case "blog":
        push("system", "Opening /blog …");
        router.push("/blog");
        break;
      case "goto": {
        const target = arg.toLowerCase();
        const map: Record<string, string> = { home: "/", resume: "/resume", about: "/about" };
        const found = map[target] ?? nav.find((n) => n.label.toLowerCase().startsWith(target))?.href;
        if (!target) push("error", "usage: goto <page>");
        else if (found) {
          push("system", `Navigating to ${found} …`);
          router.push(found);
        } else push("error", `unknown page: ${target}`);
        break;
      }
      case "theme": {
        const mode = arg.toLowerCase();
        if (["light", "dark", "system"].includes(mode)) {
          setTheme(mode);
          push("system", `theme set to ${mode}`);
        } else push("error", "usage: theme <light|dark|system>");
        break;
      }
      case "date":
        push("output", new Date().toString());
        break;
      case "clear":
        setLines([]);
        break;
      case "ls":
        push("output", nav.map((n) => n.label.toLowerCase().replace(/\s+/g, "-")).join("  ") + "  resume");
        break;
      case "pwd":
        push("output", "/home/ramesh/portfolio");
        break;
      case "echo":
        push("output", arg);
        break;
      case "cat":
        push("error", arg ? `cat: ${arg}: permission denied (try "goto ${arg}")` : "usage: cat <file>");
        break;
      case "sudo":
        push("error", "ramesh is not in the sudoers file. This incident will be reported.");
        break;
      case "exit":
        push("system", "There is no escape. (Try the sidebar.)");
        break;
      default:
        push("error", `command not found: ${cmd}. Type "help".`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === null) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(null);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx] ?? "");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => c.startsWith(input.toLowerCase()) && c !== input.toLowerCase());
      if (match) setInput(match + (match === "goto" || match === "theme" ? " " : ""));
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      id="terminal"
      className="card overflow-hidden font-mono text-[13px] leading-relaxed"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 border-b bg-surface-2/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-muted">ramesh@portfolio — zsh</span>
        <span className="ml-auto hidden text-[10px] text-muted-2 sm:inline">try: whoami · skills · contact</span>
      </div>
      <div ref={scrollRef} className="terminal-scroll h-72 overflow-y-auto px-4 py-3 sm:h-80">
        {lines.map((l) => (
          <div key={l.id} className="whitespace-pre-wrap break-words">
            {l.kind === "input" ? (
              <span>
                <span className="text-accent-strong">➜</span> <span className="text-muted">~</span> {l.text}
              </span>
            ) : (
              <span className={l.kind === "error" ? "text-red-500 dark:text-red-400" : l.kind === "system" ? "text-muted" : "text-foreground"}>
                {l.text}
              </span>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-accent-strong">➜</span>
          <span className="text-muted">~</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Terminal input"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 bg-transparent caret-accent outline-none"
          />
        </div>
      </div>
    </div>
  );
}
