export type ProjectCategory =
  | "Backend & Data"
  | "AI / ML"
  | "Embedded & IoT"
  | "Web"
  | "Blockchain";

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  tech: string[];
  repo?: string;
  live?: string;
  year: number;
  featured?: boolean;
  highlight?: string;
};

const gh = (name: string) => `https://github.com/ARamesh-tech/${name}`;

export const projects: Project[] = [
  {
    slug: "namaste-icd11-tm2",
    title: "NAMASTE → ICD-11 TM2 Terminology Service",
    tagline: "SIH 2025 winning healthcare interoperability platform",
    description:
      "A FHIR-aligned terminology microservice that maps India's NAMASTE codes for Ayurveda, Siddha and Unani to WHO ICD-11 Traditional Medicine (TM2). Hospitals can search, auto-translate and dual-code diagnoses inside their EMR — built for the Ministry of Ayush problem statement and awarded joint winner at the Grand Finale.",
    category: "Backend & Data",
    tech: ["Python", "REST", "FHIR", "PostgreSQL", "React", "Docker"],
    repo: gh("NAMASTE_TO_ICD11_TM2_SIH2025"),
    year: 2025,
    featured: true,
    highlight: "Winner · SIH 2025",
  },
  {
    slug: "xguard-adaptive-firewall",
    title: "XGuard — Adaptive Firewall",
    tagline: "Traffic-aware firewall that rewrites its own rules",
    description:
      "A firewall that observes live traffic, scores flows with a lightweight model, and adapts its rule set over time instead of relying on static allow/deny lists. Includes a dashboard for inspecting decisions and overriding them.",
    category: "Backend & Data",
    tech: ["Python", "Scapy", "Flask", "Machine Learning", "JavaScript"],
    repo: gh("XGaurd-Adaptive-Firewall"),
    year: 2026,
    featured: true,
  },
  {
    slug: "nids",
    title: "Network Intrusion Detection System",
    tagline: "ML-driven detection of malicious network flows",
    description:
      "Trains and evaluates classifiers on network-flow features to detect intrusions in near real time, with a pipeline for feature extraction, model comparison and alerting.",
    category: "AI / ML",
    tech: ["Python", "scikit-learn", "Pandas", "Networking"],
    repo: gh("Network-Intrusion-Detection-System-NIDS-"),
    year: 2026,
    featured: true,
  },
  {
    slug: "crop-yield-ensemble",
    title: "Crop Yield Prediction — Ensemble Model",
    tagline: "Stacked models for agricultural forecasting",
    description:
      "An ensemble of gradient boosting and tree-based regressors predicting crop yield from soil, weather and historical data, with careful feature engineering and cross-validated evaluation.",
    category: "AI / ML",
    tech: ["Python", "XGBoost", "scikit-learn", "Jupyter"],
    repo: gh("Crop_Yield_Prediction_Ensemble_Model"),
    year: 2025,
  },
  {
    slug: "email-spam-classification",
    title: "Email Spam Classification",
    tagline: "NLP pipeline from raw mail to spam verdict",
    description:
      "Text preprocessing, TF-IDF vectorisation and a comparison of Naive Bayes, SVM and logistic regression for spam detection, packaged as a reproducible notebook.",
    category: "AI / ML",
    tech: ["Python", "NLP", "scikit-learn"],
    repo: gh("Email-Spam-Classification"),
    year: 2026,
  },
  {
    slug: "imagechain",
    title: "ImageChain",
    tagline: "Tamper-evident image provenance on a blockchain",
    description:
      "Hashes images and anchors them on-chain so anyone can verify whether a picture has been altered since it was registered. A small Python service handles hashing, and a web UI drives verification.",
    category: "Blockchain",
    tech: ["Python", "Solidity", "Web3", "Flask"],
    repo: gh("ImageChain"),
    year: 2025,
    featured: true,
  },
  {
    slug: "certificate-verification-blockchain",
    title: "Certificate Verification on Blockchain",
    tagline: "Issue and verify academic certificates trustlessly",
    description:
      "Institutions issue certificates as on-chain records; employers verify authenticity in seconds without contacting the issuer. Paired with a certificate management system for issuers.",
    category: "Blockchain",
    tech: ["Solidity", "JavaScript", "Ethereum", "Node.js"],
    repo: gh("CertificateVerification_Blockchain"),
    year: 2025,
  },
  {
    slug: "lvgl-design",
    title: "LVGL Embedded UI",
    tagline: "Production-style device interfaces in C",
    description:
      "Embedded user interfaces built with LVGL during my internship at XIBOTIX — screens, widgets, and event handling tuned for constrained hardware running Embedded Linux.",
    category: "Embedded & IoT",
    tech: ["C", "LVGL", "Embedded Linux"],
    repo: gh("LVGL_Design"),
    year: 2025,
    featured: true,
  },
  {
    slug: "dual-access-lock",
    title: "DualAccess Lock",
    tagline: "Wi-Fi + offline keypad dual-security smart lock",
    description:
      "An ESP32-based lock that accepts remote unlock over Wi-Fi and falls back to an offline keypad PIN, so the door stays usable when the network doesn't.",
    category: "Embedded & IoT",
    tech: ["C++", "ESP32", "Arduino", "IoT"],
    repo: gh("DualAccess_Lock_Wi-Fi_-_offline_keypad-based_dual_security"),
    year: 2025,
  },
  {
    slug: "adaptive-lamp-light",
    title: "Adaptive Lamp Light",
    tagline: "Lighting that reacts to ambient conditions",
    description:
      "Adjusts lamp brightness and warmth based on ambient light and presence, with a Python controller and simple scheduling.",
    category: "Embedded & IoT",
    tech: ["Python", "Sensors", "Automation"],
    repo: gh("Adaptive-Lamp-Light"),
    year: 2026,
  },
  {
    slug: "greentalk",
    title: "GreenTalk — AR Smart Gardening Assistant",
    tagline: "AR-powered plant care with utility control",
    description:
      "Point your camera at a plant to get care guidance in AR, and control watering and lighting utilities from the same app.",
    category: "AI / ML",
    tech: ["Python", "Computer Vision", "AR"],
    repo: gh("GreenTalk-AR-Powered-Smart-Gardening-Assistant-Utility-Control"),
    year: 2025,
  },
  {
    slug: "video-audio-call-app",
    title: "Video & Audio Call App",
    tagline: "Peer-to-peer calls with WebRTC",
    description:
      "Real-time video and audio calling with WebRTC signalling over WebSockets, room management, and a minimal UI.",
    category: "Web",
    tech: ["JavaScript", "WebRTC", "Node.js", "Socket.IO"],
    repo: gh("video_audio_call_app"),
    year: 2026,
  },
  {
    slug: "nifty50-live",
    title: "NSE NIFTY 50 Live Tracker",
    tagline: "Streaming market data dashboard",
    description:
      "Polls and visualises live NIFTY 50 constituents with movers, heat-map style colouring and lightweight charts.",
    category: "Web",
    tech: ["JavaScript", "Charts", "REST"],
    repo: gh("NSE_NIFTY50_LIVE_TRACKING"),
    year: 2025,
  },
  {
    slug: "django-challenges",
    title: "Django Challenges App",
    tagline: "Deployed Django app on Vercel",
    description:
      "A challenges tracker built with Django and deployed serverlessly on Vercel — an exercise in fitting a classic framework into a modern platform.",
    category: "Web",
    tech: ["Python", "Django", "Vercel"],
    repo: gh("DjangoChallengesApp"),
    live: "https://django-challenges-app-sage.vercel.app",
    year: 2025,
  },
  {
    slug: "taskblitz",
    title: "TaskBlitz",
    tagline: "Fast, focused task manager",
    description: "A keyboard-friendly task manager with local persistence, deployed on Vercel.",
    category: "Web",
    tech: ["HTML", "CSS", "JavaScript"],
    repo: gh("TaskBlitz"),
    live: "https://task-blitz-lovat.vercel.app",
    year: 2025,
  },
  {
    slug: "rto-vehicle-management",
    title: "RTO Vehicle Management",
    tagline: "Desktop system for vehicle registrations",
    description:
      "A Java application modelling RTO workflows — registrations, ownership transfers and lookups — backed by a relational schema.",
    category: "Backend & Data",
    tech: ["Java", "SQL", "OOP"],
    repo: gh("RTOVehicleManagement"),
    year: 2024,
  },
];

export const projectCategories: ProjectCategory[] = [
  "Backend & Data",
  "AI / ML",
  "Embedded & IoT",
  "Web",
  "Blockchain",
];

export const featuredProjects = projects.filter((p) => p.featured);
