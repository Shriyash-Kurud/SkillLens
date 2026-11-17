export type ScoreCategory = {
  label: string;
  score: number;
  detail: string;
};

export type Insight = {
  title: string;
  detail: string;
  status: "strength" | "attention";
};

export type Recommendation = {
  title: string;
  detail: string;
  nextStep: string;
  priority: "High" | "Medium" | "Low";
};

export type MissingElement = {
  title: string;
  detail: string;
  importance: "Important" | "Optional";
};

export type SectionRewrite = {
  section: string;
  issue: string;
  improvement: string;
};

export type FeedbackSection = {
  title: string;
  summary: string;
  detail: string;
};

export type AnalysisResult = {
  score: number;
  scoreLabel: string;
  disclaimer: string;
  breakdown: ScoreCategory[];
  insights: Insight[];
  recommendations: Recommendation[];
  missing: MissingElement[];
  rewrites: SectionRewrite[];
  feedback: FeedbackSection[];
  metadata: {
    filename: string;
    pageCount: number;
  };
};
