export const site = {
  name: "A Ramesh Kumaran",
  shortName: "Ramesh",
  initials: "RK",
  role: "Backend & Data Engineer",
  company: "Simpplr",
  tagline:
    "I design resilient backends and data pipelines that turn raw events into decisions.",
  location: "Kanyakumari · Tamil Nadu – 629702, India",
  email: "rameshkumarana@gmail.com",
  phone: "+91 7904966795",
  phoneHref: "tel:+917904966795",
  photo: "/images/ramesh.jpg",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Portfolio of A Ramesh Kumaran — Backend & Data Engineer at Simpplr, SIH 2025 winner, and Integrated M.Tech CSE student at VIT Vellore. Projects, experience, skills, and a blog on backend systems and data engineering.",
  keywords: [
    "Ramesh Kumaran",
    "A Ramesh Kumaran",
    "Backend Engineer",
    "Data Engineer",
    "Simpplr",
    "VIT Vellore",
    "Portfolio",
    "Python",
    "Node.js",
    "PostgreSQL",
    "Data Pipelines",
  ],
  socials: {
    github: "https://github.com/ARamesh-tech",
    linkedin: "https://www.linkedin.com/in/a-ramesh-kumaran-4866b0274",
  },
  githubUser: "ARamesh-tech",
} as const;

export const nav = [
  { href: "/", label: "Home", icon: "home", shortcut: "1" },
  { href: "/experience", label: "Experience", icon: "briefcase", shortcut: "2" },
  { href: "/projects", label: "Projects", icon: "folder", shortcut: "3" },
  { href: "/skills", label: "Skills", icon: "cpu", shortcut: "4" },
  { href: "/about", label: "About me", icon: "user", shortcut: "5" },
  { href: "/contact", label: "Contact", icon: "mail", shortcut: "6" },
  { href: "/blog", label: "Blog", icon: "pen", shortcut: "7" },
] as const;

export type NavIcon = (typeof nav)[number]["icon"];
