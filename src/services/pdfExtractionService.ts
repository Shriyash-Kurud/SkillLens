import * as pdfjsLib from "pdfjs-dist";

import type { DetectedSkill, ExtractedResume, ResumeSection } from "../analysis";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const SECTION_PATTERNS: Record<string, string[]> = {
  contact: ["contact", "personal details", "email", "phone", "linkedin", "github", "address", "location"],
  summary: ["summary", "profile", "objective", "about", "professional summary"],
  education: ["education", "academic background", "educational qualifications", "degree", "school", "college", "university"],
  skills: ["skills", "technical skills", "core competencies", "tools", "programming languages", "technologies"],
  projects: ["projects", "featured projects", "selected projects", "personal projects", "portfolio"],
  experience: ["experience", "work experience", "professional experience", "employment", "career history"],
  internships: ["internships", "internship", "co-op", "cooperative experience"],
  certifications: ["certifications", "licenses", "training", "courses", "credentials"],
  achievements: ["achievements", "awards", "highlights", "notable achievements"],
  publications: ["publications", "research", "papers"],
  coursework: ["relevant coursework", "coursework", "courses"],
};

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeHeadings(value: string): string {
  return value
    .replace(/^[\-•*\d\.\)]\s*/, "")
    .replace(/\s*[:\-–—]\s*$/, "")
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildSectionMap(text: string): ResumeSection[] {
  const lines = text
    .split(/\n+/)
    .map((line) => normalizeHeadings(line))
    .filter((line) => line.length > 1 && line.length < 120);

  const detected: ResumeSection[] = [];

  for (const line of lines) {
    const normalized = line.toLowerCase();
    for (const [id, patterns] of Object.entries(SECTION_PATTERNS)) {
      const match = patterns.find((pattern) => normalized.includes(pattern.toLowerCase()));
      if (match) {
        const heading = toTitleCase(line);
        const existing = detected.find((section) => section.id === id);
        if (!existing) {
          detected.push({ id, heading, evidence: line, confidence: 0.73 });
        }
        break;
      }
    }
  }

  return detected;
}

function findContactInfo(normalizedText: string): boolean {
  const contactSignals = [
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    /\b\+?\d{1,3}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    /linkedin\.com/i,
    /github\.com/i,
    /\b(?:new york|boston|san francisco|bangalore|hyderabad|delhi|pune|mumbai|chennai|texas|california)\b/i,
  ];
  return contactSignals.some((pattern) => pattern.test(normalizedText));
}

function detectAchievementSignals(normalizedText: string): boolean {
  const metricPatterns = [
    /\b\d+%\b/,
    /\$\d[\d,]*(?:\.\d+)?/,
    /\b\d+\s*(?:users|customers|clients|contributors|projects|teams|datasets|models|hours|days|weeks|months|years)\b/i,
    /(increased|reduced|improved|optimized|saved|cut|grew|boosted|automated|deployed|launched)/i,
  ];
  return metricPatterns.some((pattern) => pattern.test(normalizedText));
}

const SKILL_LIBRARY: Record<string, { category: string; aliases: string[] }> = {
  python: { category: "Programming", aliases: ["python", "python3", "py"] },
  javascript: { category: "Web", aliases: ["javascript", "js", "ecmascript"] },
  typescript: { category: "Web", aliases: ["typescript", "ts"] },
  react: { category: "Web", aliases: ["react", "react.js", "reactjs"] },
  node: { category: "Web", aliases: ["node", "node.js", "nodejs"] },
  sql: { category: "Data", aliases: ["sql", "postgresql", "postgres", "mysql", "sqlite"] },
  java: { category: "Programming", aliases: ["java"] },
  csharp: { category: "Programming", aliases: ["c#", "c sharp", "csharp"] },
  cplusplus: { category: "Programming", aliases: ["c++", "cplus", "cplusplus"] },
  html: { category: "Web", aliases: ["html", "html5"] },
  css: { category: "Web", aliases: ["css", "css3", "sass", "scss", "tailwind"] },
  pythonml: { category: "Machine Learning", aliases: ["pytorch", "tensorflow", "scikit-learn", "sklearn", "keras", "xgboost", "lightgbm"] },
  data: { category: "Data", aliases: ["pandas", "numpy", "matplotlib", "seaborn", "plotly", "power bi", "tableau"] },
  mlops: { category: "Machine Learning", aliases: ["mlops", "model deployment", "mlflow", "kubeflow"] },
  cloud: { category: "Cloud", aliases: ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd"] },
  api: { category: "Web", aliases: ["rest api", "restful api", "api design", "graphql"] },
  testing: { category: "Quality", aliases: ["unit testing", "pytest", "jest", "testing", "playwright", "cypress"] },
  git: { category: "Tools", aliases: ["git", "github", "gitlab"] },
  excel: { category: "Tools", aliases: ["excel", "vba"] },
};

function inferSkills(text: string): DetectedSkill[] {
  const normalized = text.toLowerCase();
  const unique = new Map<string, DetectedSkill>();

  Object.entries(SKILL_LIBRARY).forEach(([, entry]) => {
    const matchedAlias = entry.aliases.find((alias) => {
      const lowerAlias = alias.toLowerCase();
      if (lowerAlias.includes(" ")) {
        return normalized.includes(lowerAlias);
      }
      const boundary = new RegExp(`\\b${lowerAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return boundary.test(text);
    });

    if (matchedAlias) {
      const aliasKey = matchedAlias.toLowerCase();
      if (!unique.has(aliasKey)) {
        unique.set(aliasKey, {
          name: matchedAlias,
          category: entry.category,
          aliases: entry.aliases,
        });
      }
    }
  });

  return Array.from(unique.values());
}

function buildPageTextLines(content: { items: any[] }): string {
  const lineGroups: Array<{ y: number; text: string; x: number }> = [];

  const textItems = content.items
    .filter((item: any) => typeof item?.str === "string" && item.str.trim().length > 0)
    .map((item: any) => ({
      str: item.str.trim(),
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0,
    }))
    .sort((a, b) => b.y - a.y || a.x - b.x);

  for (const item of textItems) {
    const lastLine = lineGroups[lineGroups.length - 1];
    if (lastLine && Math.abs(lastLine.y - item.y) <= 1.2) {
      lastLine.text = `${lastLine.text} ${item.str}`.replace(/\s+/g, " ").trim();
      lastLine.x = Math.min(lastLine.x, item.x);
      continue;
    }

    lineGroups.push({ y: item.y, text: item.str, x: item.x });
  }

  return lineGroups
    .map((line) => line.text)
    .join("\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractResumeFromPdf(file: File): Promise<ExtractedResume> {
  if (!file) {
    throw new Error("No resume file was selected.");
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = buildPageTextLines(content);
    pages.push(pageText);
  }

  const text = pages.join("\n\n").trim();
  const normalizedText = normalizeWhitespace(text);
  const sections = buildSectionMap(normalizedText);
  const skills = inferSkills(normalizedText);

  if (!text || normalizedText.length < 30) {
    throw new Error("This PDF does not include readable resume text. A scanned document or image-only PDF may need OCR support.");
  }

  if (sections.length === 0 && normalizedText.length < 200) {
    throw new Error("This PDF appears to be too short or lacks recognizable section structure for a resume analysis.");
  }

  return {
    filename: file.name,
    pageCount: pdf.numPages,
    text,
    normalizedText,
    wordCount: normalizedText.split(/\s+/).filter(Boolean).length,
    sections,
    skills,
    contactInfoFound: findContactInfo(normalizedText),
    meaningfulContent: normalizedText.length > 150,
    hasAchievementSignals: detectAchievementSignals(normalizedText),
  };
}
