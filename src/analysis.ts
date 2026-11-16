export type ResumeMetadata = {
  name: string;
  size: number;
  type: string;
};

export type AnalysisRequest = {
  resume: ResumeMetadata;
  targetRole: string;
};

export type ResumeSection = {
  id: string;
  heading: string;
  evidence: string;
  confidence: number;
};

export type DetectedSkill = {
  name: string;
  category: string;
  aliases: string[];
};

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

export type KeywordComparison = {
  keyword: string;
  category: string;
  detected: boolean;
};

export type DocumentReadabilityCheck = {
  title: string;
  detail: string;
  status: "Pass" | "Consider" | "Review";
};

export type FeedbackSection = {
  title: string;
  summary: string;
  detail: string;
};

export type ExtractedResume = {
  filename: string;
  pageCount: number;
  text: string;
  normalizedText: string;
  wordCount: number;
  sections: ResumeSection[];
  skills: DetectedSkill[];
  contactInfoFound: boolean;
  meaningfulContent: boolean;
  hasAchievementSignals: boolean;
};

export type AnalysisFinding = {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  nextStep: string;
};

export type AnalysisResult = {
  score: number;
  scoreLabel: string;
  breakdown: ScoreCategory[];
  insights: Insight[];
  recommendations: Recommendation[];
  keywords: KeywordComparison[];
  ats: DocumentReadabilityCheck[];
  feedback: FeedbackSection[];
  sections: ResumeSection[];
  skills: DetectedSkill[];
  metadata: {
    filename: string;
    pageCount: number;
    targetRole: string;
  };
};
