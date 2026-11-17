import type { AnalysisResult } from "./analysis";

// Illustrative data for the home-page preview and for opening /results directly. Never shown as a real result.
export const sampleAnalysis: AnalysisResult = {
  score: 78,
  scoreLabel: "GOOD FOUNDATION",
  disclaimer: "Every result on this page is sample content for demonstration purposes.",
  breakdown: [
    { label: "Content and completeness", score: 85, detail: "25% of overall score" },
    { label: "Skills presentation", score: 70, detail: "20% of overall score" },
    { label: "Projects and achievements", score: 80, detail: "20% of overall score" },
    { label: "Education and experience", score: 90, detail: "15% of overall score" },
    { label: "Structure and organization", score: 75, detail: "10% of overall score" },
    { label: "Clarity and readability", score: 65, detail: "10% of overall score" },
  ],
  insights: [
    { title: "Education is easy to find", detail: "The education section is clearly structured and easy to scan.", status: "strength" },
    { title: "A useful skills foundation", detail: "The document includes relevant technical skills, though they may benefit from stronger emphasis.", status: "strength" },
    { title: "Consider measurable outcomes", detail: "Some bullets would be more persuasive with clearer problem, action, and result language.", status: "attention" },
  ],
  recommendations: [
    { title: "Add measurable results", detail: "Specific outcomes help readers understand the scale of your contribution.", nextStep: "Add a number, time saved, or performance gain to a project bullet.", priority: "High" },
    { title: "Bring relevant skills forward", detail: "Use a clear skills section near the top of the document to reinforce your fit.", nextStep: "Move your strongest tools closer to the summary or header.", priority: "Medium" },
    { title: "Strengthen project bullets", detail: "Lead with a clear action and explain what changed as a result.", nextStep: "Try the structure: action, context, outcome.", priority: "Medium" },
  ],
  missing: [
    { title: "Professional summary", detail: "A short opening statement would help readers see your focus quickly.", importance: "Important" },
    { title: "Certifications", detail: "Not required, but worth adding if you have completed relevant courses.", importance: "Optional" },
  ],
  rewrites: [
    { section: "Projects", issue: "Bullets describe tasks rather than outcomes.", improvement: "Use: action + what you built + tools + [result]." },
  ],
  feedback: [
    { title: "Skills presentation", summary: "Group skills by theme.", detail: "Separate languages, tools, and methods so the most relevant information is quick to scan." },
    { title: "Projects and achievements", summary: "Show your contribution.", detail: "Describe what you built, what tools you used, and what the result enabled." },
  ],
  metadata: { filename: "sample-resume.pdf", pageCount: 1 },
};
