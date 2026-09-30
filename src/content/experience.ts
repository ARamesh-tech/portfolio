export type ExperienceItem = {
  id: string;
  kind: "work" | "education" | "achievement" | "patent";
  title: string;
  org: string;
  orgUrl?: string;
  location?: string;
  start: string; // ISO date
  end: string | null; // null = present
  summary: string;
  highlights: string[];
  tech?: string[];
  current?: boolean;
};

export const experience: ExperienceItem[] = [
  {
    id: "simpplr",
    kind: "work",
    title: "Backend cum Data Engineer",
    org: "Simpplr",
    orgUrl: "https://www.simpplr.com",
    location: "India",
    start: "2026-07-20",
    end: null,
    current: true,
    summary:
      "Building the backend services and data pipelines behind Simpplr's AI-powered employee experience platform.",
    highlights: [
      "Design and ship backend services and REST APIs that power product features used by enterprise customers.",
      "Build and operate data pipelines (ingestion, transformation, quality checks) that turn product events into analytics-ready datasets.",
      "Own data models and SQL that keep reporting accurate, performant, and trustworthy.",
      "Collaborate with product, data science, and platform teams to move ideas from spec to production.",
    ],
    tech: ["Python", "SQL", "PostgreSQL", "Node.js", "Data Pipelines", "Cloud"],
  },
  {
    id: "sih-2025",
    kind: "achievement",
    title: "Winner — Smart India Hackathon 2025 (Software Edition)",
    org: "Ministry of Ayush · Team CodeVaidyas_VIT",
    orgUrl: "https://www.sih.gov.in",
    location: "Grand Finale, India",
    start: "2025-12-01",
    end: "2025-12-15",
    summary:
      "Joint winners of the national Grand Finale for a healthcare interoperability problem statement from the Ministry of Ayush.",
    highlights: [
      "Built a terminology microservice that maps NAMASTE (Ayurveda, Siddha, Unani) codes to WHO ICD-11 TM2 for EMR systems.",
      "Exposed FHIR-aligned REST APIs so hospital software could search, translate, and record dual-coded diagnoses.",
      "Delivered a working, demo-ready product under hackathon constraints as a six-member team.",
    ],
    tech: ["REST APIs", "FHIR", "ICD-11", "Python", "PostgreSQL", "React"],
  },
  {
    id: "patent",
    kind: "patent",
    title: "Patent (Published) — Coordinated Indoor Position Determination",
    org: "Indian Patent Office · Application 202541115892",
    location: "VIT Vellore",
    start: "2025-11-24",
    end: "2025-11-24",
    summary:
      "\u201cA System and Method for Coordinated Indoor Position Determination Using Multi-Stage Signal Processing\u201d — co-inventor.",
    highlights: [
      "Co-invented a multi-stage signal-processing approach for accurate indoor positioning where GPS is unavailable.",
      "Filed with faculty from VIT's School of Computer Science and Engineering (SCOPE) and SENSE.",
    ],
    tech: ["Signal Processing", "Embedded Systems", "Algorithms"],
  },
  {
    id: "xibotix",
    kind: "work",
    title: "Embedded Systems Engineer Intern",
    org: "XIBOTIX Private Limited",
    orgUrl: "https://www.linkedin.com/company/xibotix",
    location: "India",
    start: "2025-06-02",
    end: "2025-07-02",
    summary:
      "Summer internship focused on Embedded Linux and building production-grade device user interfaces.",
    highlights: [
      "Designed and implemented embedded UIs with LVGL, from layout to event handling on constrained hardware.",
      "Worked hands-on with Embedded Linux: cross-compilation, device bring-up, and debugging on target boards.",
      "Collaborated with a mentor-led team to ship UI components used on real devices.",
    ],
    tech: ["C", "Embedded Linux", "LVGL", "Device Drivers"],
  },
  {
    id: "vit",
    kind: "education",
    title: "Integrated M.Tech — Computer Science & Engineering",
    org: "Vellore Institute of Technology (VIT), Vellore",
    orgUrl: "https://vit.ac.in",
    location: "Vellore, Tamil Nadu",
    start: "2022-08-01",
    end: "2027-05-31",
    summary:
      "Five-year integrated programme spanning systems, data, machine learning, and software engineering.",
    highlights: [
      "Coursework across data structures, DBMS, operating systems, networks, machine learning, and distributed systems.",
      "Active in hackathons and research — SIH 2025 winner and co-inventor on a published patent.",
    ],
    tech: ["CSE", "Research", "Hackathons"],
  },
];
