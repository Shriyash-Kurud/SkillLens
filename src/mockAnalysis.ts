import type { AnalysisResult, AnalysisRequest } from "./analysis";

export const sampleAnalysis: AnalysisResult = {
  score: 78,
  scoreLabel: "GOOD FOUNDATION",
  breakdown: [
    { label: "Section completeness", score: 85, detail: "The resume structure is recognisable and easy to scan." },
    { label: "Skills evidence", score: 70, detail: "Relevant tools and technical skills are present but could be highlighted more clearly." },
    { label: "Achievement specificity", score: 80, detail: "Several bullets suggest impact, though measurable outcomes could be stronger." },
    { label: "Role relevance", score: 90, detail: "The document is broadly aligned with a technical role." },
    { label: "Readability", score: 65, detail: "README: sample-only preview for direct route access." },
  ],
  insights: [
    { title: "Education is easy to find", detail: "The education section is clearly structured and easy to scan.", status: "strength" },
    { title: "A useful skills foundation", detail: "The document includes relevant technical skills, though they may benefit from stronger emphasis.", status: "strength" },
    { title: "Consider measurable outcomes", detail: "Some bullets would be more persuasive with clearer problem, action, and result language.", status: "attention" },
  ],
  recommendations: [
    { title: "Add measurable results", detail: "Specific outcomes help readers understand the scale of your contribution.", nextStep: "Add a number, time saved, or performance gain to a project bullet.", priority: "High" },
    { title: "Bring relevant skills forward", detail: "Use a clear skills section near the top of the document to reinforce your fit.", nextStep: "Move the role-relevant tools closer to the summary or header.", priority: "Medium" },
    { title: "Strengthen project bullets", detail: "Lead with a clear action and explain what changed as a result.", nextStep: "Try the structure: action, context, outcome.", priority: "Medium" },
  ],
  keywords: [
    { keyword: "Python", category: "Programming", detected: true },
    { keyword: "SQL", category: "Data", detected: true },
    { keyword: "Data Visualization", category: "Analytics", detected: false },
    { keyword: "REST APIs", category: "Web", detected: false },
    { keyword: "Unit Testing", category: "Quality", detected: false },
  ],
  ats: [
    { title: "Section headings", detail: "Recognizable headings make the document easier to parse.", status: "Pass" },
    { title: "Contact details", detail: "A clear contact block helps readers identify the candidate quickly.", status: "Consider" },
    { title: "Date consistency", detail: "Keep date formatting consistent across items for readability.", status: "Review" },
    { title: "Resume length", detail: "A short, focused document can still read well if the experience is clear.", status: "Pass" },
  ],
  feedback: [
    { title: "Summary", summary: "Lead with a clear direction.", detail: "A concise opening can help a reader understand your focus and the kind of opportunity you are pursuing." },
    { title: "Skills", summary: "Group skills by theme.", detail: "Separate languages, tools, and methods so the most relevant information is quick to scan." },
    { title: "Education", summary: "Keep the structure consistent.", detail: "Include degree, institution, and dates in a predictable order." },
    { title: "Projects", summary: "Show your contribution.", detail: "Describe what you built, what tools you used, and what the result enabled." },
    { title: "Experience & achievements", summary: "Make impact tangible.", detail: "Use active language and include outcomes or scope where you can support them." },
  ],
  sections: [],
  skills: [],
  metadata: { filename: "sample-resume.pdf", pageCount: 1, targetRole: "" },
};

export interface AnalysisProvider {
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;
}

export const mockAnalysisProvider: AnalysisProvider = {
  async analyze(request) {
    void request;
    return sampleAnalysis;
  },
};

export function keywordsForRole(role: string) {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole.includes("data") || normalizedRole.includes("machine") || normalizedRole.includes("ml")) {
    return ["Python", "SQL", "Data Visualization", "Model Evaluation", "Statistics"];
  }
  if (normalizedRole.includes("front")) {
    return ["Responsive Design", "Accessibility", "TypeScript", "Component Testing", "Web Performance"];
  }
  return ["Python", "SQL", "Problem Solving", "Version Control", "Communication"];
}
