import type { AnalysisResult } from "../analysis";

// Shape of the JSON returned by POST /api/analyze (see backend/app.py).
type ApiResponse = {
  overall_score: number;
  score_label: string;
  overall_summary: string;
  disclaimer: string;
  category_scores: { label: string; score: number; weight: number }[];
  strengths: { title: string; detail: string }[];
  weaknesses: { title: string; detail: string }[];
  missing_elements: { element: string; detail: string; importance: "Important" | "Optional" }[];
  suggestions: { title: string; detail: string; next_step: string; priority: "High" | "Medium" | "Low" }[];
  category_feedback: { category: string; summary: string; detail: string }[];
  sections_to_rewrite: { section: string; issue: string; improvement: string }[];
  metadata: { page_count: number };
};

const REQUEST_TIMEOUT_MS = 150_000;

function toAnalysisResult(data: ApiResponse, filename: string): AnalysisResult {
  return {
    score: data.overall_score,
    scoreLabel: data.score_label,
    disclaimer: data.disclaimer,
    breakdown: data.category_scores.map((item) => ({ label: item.label, score: item.score, detail: `${item.weight}% of overall score` })),
    insights: [
      ...data.strengths.map((item) => ({ ...item, status: "strength" as const })),
      ...data.weaknesses.map((item) => ({ ...item, status: "attention" as const })),
    ],
    recommendations: data.suggestions.map((item) => ({ title: item.title, detail: item.detail, nextStep: item.next_step, priority: item.priority })),
    missing: data.missing_elements.map((item) => ({ title: item.element, detail: item.detail, importance: item.importance })),
    rewrites: data.sections_to_rewrite,
    feedback: data.category_feedback.map((item) => ({ title: item.category, summary: item.summary, detail: item.detail })),
    metadata: { filename, pageCount: data.metadata.page_count },
  };
}

export async function analyzeUploadedResume(file: File): Promise<AnalysisResult> {
  const body = new FormData();
  body.append("resume", file);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch("/api/analyze", { method: "POST", body, signal: controller.signal });
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") {
      throw new Error("The analysis took too long. Please try again.");
    }
    throw new Error("Could not reach the analysis server. Make sure the backend is running and try again.");
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Backend errors are { "error": "..." }; anything else means the backend is not answering properly.
    throw new Error(data?.error ?? "The analysis server is not responding. Make sure the backend is running.");
  }
  return toAnalysisResult(data as ApiResponse, file.name);
}
