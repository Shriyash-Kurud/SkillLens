import type { AnalysisResult, DetectedSkill, DocumentReadabilityCheck, FeedbackSection, Insight, KeywordComparison, Recommendation, ResumeSection, ScoreCategory } from "../analysis";
import { extractResumeFromPdf } from "./pdfExtractionService";

const ROLE_SKILL_MAP: Record<string, string[]> = {
  "machine learning engineer": ["python", "sql", "pytorch", "tensorflow", "sklearn", "mlops", "data analysis", "statistics"],
  "data analyst": ["sql", "python", "pandas", "excel", "power bi", "tableau", "statistics", "data visualization"],
  "software developer": ["python", "java", "javascript", "typescript", "react", "node", "sql", "git", "testing"],
  "frontend developer": ["javascript", "typescript", "react", "css", "html", "ui", "accessibility", "testing"],
  "ai/ml intern": ["python", "machine learning", "pytorch", "numpy", "pandas", "sql", "git"],
};

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getRoleSkills(targetRole: string): string[] {
  const normalized = normalizeRole(targetRole);
  if (!normalized) {
    return [];
  }
  for (const [pattern, skills] of Object.entries(ROLE_SKILL_MAP)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return skills;
    }
  }
  return [];
}

function computeSectionScore(sections: ResumeSection[]): number {
  const prioritized = ["summary", "education", "skills", "experience", "projects"];
  const detected = new Set(sections.map((section) => section.id));
  const matches = prioritized.filter((entry) => detected.has(entry)).length;
  return Math.min(100, Math.round((matches / prioritized.length) * 100));
}

function computeSkillsScore(skills: DetectedSkill[], sectionScore: number): number {
  if (skills.length === 0) {
    return sectionScore > 60 ? 48 : 28;
  }
  const base = 45 + Math.min(45, skills.length * 6);
  return Math.min(100, Math.round(base));
}

function computeAchievementScore(hasAchievementSignals: boolean, sectionScore: number): number {
  if (!hasAchievementSignals) {
    return 40 + Math.max(0, sectionScore - 50) * 0.4;
  }
  return 70 + Math.min(25, sectionScore / 2);
}

function computeRoleRelevanceScore(skills: DetectedSkill[], targetRole: string): number {
  if (!targetRole) {
    return 60;
  }
  const roleSkills = getRoleSkills(targetRole);
  if (roleSkills.length === 0) {
    return 60;
  }
  const normalizedSkills = new Set(skills.map((skill) => normalizeForMatch(skill.name)));
  const matches = roleSkills.filter((skill) => Array.from(normalizedSkills).some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill))).length;
  if (matches === 0) {
    return 45;
  }
  return Math.min(100, Math.round((matches / roleSkills.length) * 100));
}

function computeReadabilityScore(contactInfoFound: boolean, wordCount: number, sections: ResumeSection[]): number {
  let score = 70;
  if (contactInfoFound) score += 10;
  if (wordCount > 200 && wordCount < 1000) score += 8;
  if (sections.length >= 3) score += 8;
  if (wordCount < 80) score -= 20;
  return Math.min(100, Math.max(25, score));
}

function scoreLabelFromValue(value: number): string {
  if (value >= 85) return "STRONG FOUNDATION";
  if (value >= 70) return "GOOD FOUNDATION";
  if (value >= 55) return "PROMISING START";
  return "NEEDS MORE DETAIL";
}

function buildBreakdown(extracted: { sections: ResumeSection[]; skills: DetectedSkill[]; hasAchievementSignals: boolean; contactInfoFound: boolean; wordCount: number; meaningfulContent: boolean }, targetRole: string): ScoreCategory[] {
  const sectionCompleteness = computeSectionScore(extracted.sections);
  const skillsEvidence = computeSkillsScore(extracted.skills, sectionCompleteness);
  const achievementSpecificity = computeAchievementScore(extracted.hasAchievementSignals, sectionCompleteness);
  const roleRelevance = computeRoleRelevanceScore(extracted.skills, targetRole);
  const readability = computeReadabilityScore(extracted.contactInfoFound, extracted.wordCount, extracted.sections);

  return [
    { label: "Section completeness", score: sectionCompleteness, detail: extracted.sections.length > 0 ? "Recognizable resume sections were found in the document." : "Few section headings were detected from the extracted text." },
    { label: "Skills evidence", score: skillsEvidence, detail: extracted.skills.length > 0 ? `${extracted.skills.length} skill signals were identified in the document.` : "No clear technical skills were detected in the extracted text." },
    { label: "Achievement specificity", score: Math.round(achievementSpecificity), detail: extracted.hasAchievementSignals ? "The document appears to contain measurable impact or specific outcomes." : "Consider adding measurable outcomes to project and experience bullets." },
    { label: "Role relevance", score: roleRelevance, detail: targetRole ? `The resume was matched against the target role: ${targetRole}.` : "No target role was provided, so this score reflects general document quality." },
    { label: "Readability", score: Math.round(readability), detail: extracted.meaningfulContent ? "The extracted text has enough substance to support a readable resume summary." : "The document appears unusually short or sparse for a complete resume." },
  ];
}

function buildInsights(extracted: { sections: ResumeSection[]; skills: DetectedSkill[]; hasAchievementSignals: boolean; contactInfoFound: boolean }, targetRole: string): Insight[] {
  const insights: Insight[] = [];

  if (extracted.contactInfoFound) {
    insights.push({ title: "Contact details are present", detail: "The document includes clear contact information or a location signal.", status: "strength" });
  }

  if (extracted.sections.some((section) => section.id === "education")) {
    insights.push({ title: "Education section detected", detail: "A recognizable education section was found in the document.", status: "strength" });
  }

  if (extracted.skills.length > 0) {
    insights.push({ title: "Relevant technical skills detected", detail: `Detected skills include ${extracted.skills.slice(0, 3).map((skill) => skill.name).join(", ")}.`, status: "strength" });
  }

  if (!extracted.hasAchievementSignals) {
    insights.push({ title: "Add measurable outcomes", detail: "Consider adding concrete numbers or impact to selected bullets to make results more specific.", status: "attention" });
  }

  if (targetRole) {
    const roleSkills = getRoleSkills(targetRole);
    const roleMatches = extracted.skills.filter((skill) => roleSkills.some((roleSkill) => roleSkill.includes(skill.name.toLowerCase()) || skill.name.toLowerCase().includes(roleSkill))).length;
    if (roleMatches === 0) {
      insights.push({ title: "Role alignment could be stronger", detail: `Several skills connected to ${targetRole} may be worth surfacing more clearly.`, status: "attention" });
    }
  }

  return insights.slice(0, 3);
}

function buildRecommendations(extracted: { sections: ResumeSection[]; skills: DetectedSkill[]; hasAchievementSignals: boolean }, targetRole: string): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (!extracted.hasAchievementSignals) {
    recommendations.push({
      title: "Add measurable impact",
      detail: "Several resume bullets feel descriptive, but not yet outcome-driven. Use numbers, improvements, or scope to show the effect of your work.",
      nextStep: "Add one quantified result to each major project or internship bullet.",
      priority: "High",
    });
  }

  if (extracted.skills.length > 0) {
    recommendations.push({
      title: "Make core tools easier to find",
      detail: "A clear skill list helps readers understand your technical fit quickly.",
      nextStep: "Group the most relevant tools near the top of the resume or in a dedicated skills section.",
      priority: "Medium",
    });
  }

  if (!extracted.sections.some((section) => section.id === "projects") && !extracted.sections.some((section) => section.id === "experience")) {
    recommendations.push({
      title: "Capture applied work",
      detail: "Students often strengthen their resume by adding a few projects or internships with short, concrete explanations.",
      nextStep: "Turn coursework or class projects into clear bullets with tools, actions, and outcomes.",
      priority: "Medium",
    });
  }

  if (targetRole) {
    const roleSkills = getRoleSkills(targetRole);
    const matchedSkillNames = extracted.skills.map((skill) => skill.name.toLowerCase());
    const missing = roleSkills.filter((skill) => !matchedSkillNames.some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill))).slice(0, 3);
    if (missing.length > 0) {
      recommendations.push({
        title: "Align with the target role",
        detail: `The document could be stronger for ${targetRole} with a more explicit presentation of the role-related skills.`,
        nextStep: `Review whether terms such as ${missing.join(", ")} should appear in your resume summary or skills list.`,
        priority: "Medium",
      });
    }
  }

  return recommendations.slice(0, 3);
}

function buildKeywords(extracted: { skills: DetectedSkill[] }, targetRole: string): KeywordComparison[] {
  const skillNames = extracted.skills.map((skill) => skill.name.toLowerCase());
  const roleSkills = getRoleSkills(targetRole);

  if (!targetRole || roleSkills.length === 0) {
    return extracted.skills.slice(0, 5).map((skill) => ({ keyword: skill.name, category: skill.category, detected: true }));
  }

  return roleSkills.map((keyword) => ({
    keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1),
    category: "Target role",
    detected: skillNames.some((resumeSkill) => resumeSkill.includes(keyword) || keyword.includes(resumeSkill)),
  })).slice(0, 5);
}

function buildATSChecks(extracted: { sections: ResumeSection[]; contactInfoFound: boolean; wordCount: number; meaningfulContent: boolean }): DocumentReadabilityCheck[] {
  const checks: DocumentReadabilityCheck[] = [];

  checks.push({
    title: "Section headings",
    detail: extracted.sections.length > 0 ? "Recognizable headings were found in the extracted text." : "No clear section headings were detected from the text.",
    status: extracted.sections.length > 0 ? "Pass" : "Consider",
  });

  checks.push({
    title: "Contact details",
    detail: extracted.contactInfoFound ? "A likely contact detail or location signal was found." : "Contact details were not clearly detected in the extracted text.",
    status: extracted.contactInfoFound ? "Pass" : "Review",
  });

  checks.push({
    title: "Document length",
    detail: extracted.wordCount > 80 ? "The document appears long enough to include meaningful details." : "The document is short; consider adding more context if it is a draft.",
    status: extracted.wordCount > 80 ? "Pass" : "Consider",
  });

  checks.push({
    title: "Readability",
    detail: extracted.meaningfulContent ? "The extracted text appears to provide enough context for a review." : "The text appears unusually sparse or uneven for a complete resume.",
    status: extracted.meaningfulContent ? "Pass" : "Review",
  });

  return checks;
}

function buildFeedback(extracted: { sections: ResumeSection[]; skills: DetectedSkill[]; hasAchievementSignals: boolean; meaningfulContent: boolean }, targetRole: string): FeedbackSection[] {
  const sections: FeedbackSection[] = [
    {
      title: "Summary",
      summary: "Lead with a clear direction.",
      detail: targetRole ? `For a ${targetRole} target, briefly highlight the technical value you offer and the kind of work you want to do.` : "Use a short opening that helps readers understand your focus and your goals.",
    },
  ];

  if (extracted.skills.length > 0) {
    sections.push({
      title: "Skills",
      summary: "Surface the strongest tools early.",
      detail: `Relevant tools detected in the resume include ${extracted.skills.slice(0, 3).map((skill) => skill.name).join(", ")}. Keep those near the top of the document when they fit your target role.`,
    });
  } else {
    sections.push({
      title: "Skills",
      summary: "Add explicit technical depth.",
      detail: "The extracted text did not surface many clear skills. Consider listing the most relevant tools and technologies in a dedicated section.",
    });
  }

  if (extracted.sections.some((section) => section.id === "education")) {
    sections.push({
      title: "Education",
      summary: "Keep the structure consistent.",
      detail: "Education details are clearer when degree, institution, dates, and relevant coursework are easy to scan.",
    });
  }

  sections.push({
    title: "Projects",
    summary: "Show your contribution and result.",
    detail: extracted.hasAchievementSignals ? "The document appears to include measurable or result-oriented bullets. Keep using action verbs and concrete outcomes." : "Consider turning project bullets into short action-result statements with specific outcomes or scope.",
  });

  if (!extracted.meaningfulContent) {
    sections.push({
      title: "Document completeness",
      summary: "Add more substance.",
      detail: "The extracted text is short and may need a few more details or a stronger structure before it is a complete resume.",
    });
  }

  return sections.slice(0, 5);
}

export async function analyzeUploadedResume(file: File, targetRole: string): Promise<AnalysisResult> {
  const extracted = await extractResumeFromPdf(file);
  const breakdown = buildBreakdown(extracted, targetRole);
  const overallScore = Math.round(breakdown.reduce((total, item) => total + item.score, 0) / breakdown.length);

  const result: AnalysisResult = {
    score: overallScore,
    scoreLabel: scoreLabelFromValue(overallScore),
    breakdown,
    insights: buildInsights(extracted, targetRole),
    recommendations: buildRecommendations(extracted, targetRole),
    keywords: buildKeywords(extracted, targetRole),
    ats: buildATSChecks(extracted),
    feedback: buildFeedback(extracted, targetRole),
    sections: extracted.sections,
    skills: extracted.skills,
    metadata: {
      filename: extracted.filename,
      pageCount: extracted.pageCount,
      targetRole,
    },
  };

  return result;
}
