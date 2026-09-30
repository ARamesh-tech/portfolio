export type Skill = {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 5 = expert
  note?: string;
};

export type SkillGroup = {
  id: string;
  title: string;
  blurb: string;
  skills: Skill[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: "languages",
    title: "Languages",
    blurb: "The languages I think in.",
    skills: [
      { name: "Python", level: 5 },
      { name: "SQL", level: 5 },
      { name: "TypeScript / JavaScript", level: 4 },
      { name: "Java", level: 3 },
      { name: "C / C++", level: 3, note: "embedded work" },
      { name: "Bash", level: 3 },
    ],
  },
  {
    id: "backend",
    title: "Backend",
    blurb: "APIs, services and the glue between them.",
    skills: [
      { name: "Node.js & Express", level: 4 },
      { name: "Next.js (App Router)", level: 4 },
      { name: "FastAPI / Flask", level: 4 },
      { name: "Django", level: 3 },
      { name: "REST & FHIR API design", level: 4 },
      { name: "Auth (OAuth 2.0, JWT)", level: 4 },
      { name: "WebSockets / WebRTC", level: 3 },
    ],
  },
  {
    id: "data",
    title: "Data Engineering",
    blurb: "Moving, shaping and trusting data.",
    skills: [
      { name: "PostgreSQL", level: 5 },
      { name: "Data modelling", level: 4 },
      { name: "ETL / ELT pipelines", level: 4 },
      { name: "Pandas & NumPy", level: 4 },
      { name: "MongoDB", level: 3 },
      { name: "Apache Airflow", level: 2, note: "actively learning" },
      { name: "Spark & Kafka", level: 2, note: "actively learning" },
    ],
  },
  {
    id: "ml",
    title: "AI / Machine Learning",
    blurb: "Applied ML that ships.",
    skills: [
      { name: "scikit-learn", level: 4 },
      { name: "Ensemble models (XGBoost)", level: 4 },
      { name: "NLP basics", level: 3 },
      { name: "TensorFlow / Keras", level: 3 },
      { name: "GenAI & LLM APIs", level: 3 },
      { name: "Computer vision", level: 3 },
    ],
  },
  {
    id: "embedded",
    title: "Embedded & IoT",
    blurb: "Where software meets hardware.",
    skills: [
      { name: "Embedded Linux", level: 4 },
      { name: "LVGL", level: 4 },
      { name: "ESP32 / Arduino", level: 4 },
      { name: "Signal processing", level: 3 },
    ],
  },
  {
    id: "tools",
    title: "Cloud & Tooling",
    blurb: "Shipping and keeping it running.",
    skills: [
      { name: "Git & GitHub", level: 5 },
      { name: "Linux", level: 4 },
      { name: "Docker", level: 4 },
      { name: "Vercel", level: 4 },
      { name: "AWS (S3, Lambda, RDS)", level: 3 },
      { name: "CI/CD (GitHub Actions)", level: 3 },
      { name: "Solidity / Web3", level: 3 },
    ],
  },
];

export const learningNow = [
  "Apache Airflow orchestration patterns",
  "Streaming with Kafka",
  "dbt for analytics engineering",
  "Distributed systems fundamentals",
];

export const terminalSkills = skillGroups.map((g) => ({
  group: g.title,
  items: g.skills.map((s) => s.name),
}));
