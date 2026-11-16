import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2,
  ChevronDown, CircleAlert, ClipboardCheck, FileCheck2, FileText, Lightbulb,
  Menu, Search, Sparkles, Target, Upload, X,
} from "lucide-react";
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import type { AnalysisResult, Recommendation } from "./analysis";
import { sampleAnalysis } from "./mockAnalysis";
import { formatFileSize, validateResume } from "./fileValidation";
import { analyzeUploadedResume } from "./services/resumeAnalysisService";

const navItems = [
  { label: "HOME", to: "/" },
  { label: "HOW IT WORKS", to: "/how-it-works" },
  { label: "FEATURES", to: "/features" },
  { label: "ABOUT", to: "/about" },
];

const enter = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

function PageMotion({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      animate="show"
      variants={enter}
    >
      {children}
    </motion.div>
  );
}

function Header({ focused = false }: { focused?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className={`site-header ${focused ? "site-header--focused" : ""}`}>
      <Link to="/" className="wordmark" aria-label="SkillLens home">SkillLens<span className="wordmark-dot">.</span></Link>
      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            {item.label}
          </NavLink>
        ))}
        <Link className="mobile-nav-cta" to="/analyze">ANALYZE RESUME <ArrowRight size={14} /></Link>
      </nav>
      <Link className="header-cta" to="/analyze">ANALYZE RESUME <ArrowRight size={14} /></Link>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  );
}

function Footer({ simple = false }: { simple?: boolean }) {
  if (simple) {
    return <footer className="simple-footer"><Link to="/" className="wordmark">SkillLens<span className="wordmark-dot">.</span></Link><span>DEMO MODE · YOUR FILE STAYS IN THIS SESSION</span><span>© {new Date().getFullYear()} SKILLLENS</span></footer>;
  }
  return (
    <footer className="footer">
      <div className="footer-top">
        <div><Link to="/" className="wordmark">SkillLens<span className="wordmark-dot">.</span></Link><p>A clearer way to see what your resume could become.</p></div>
        <div className="footer-links">
          {navItems.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}
          <Link to="/analyze">ANALYZE RESUME <ArrowUpRight size={13} /></Link>
        </div>
      </div>
      <div className="footer-bottom"><span>MADE FOR THE NEXT STEP.</span><span>© {new Date().getFullYear()} SKILLLENS · FRONTEND DEMO</span></div>
    </footer>
  );
}

function SiteLayout({ children, focused = false }: { children: ReactNode; focused?: boolean }) {
  return <><Header focused={focused} /><main>{children}</main><Footer simple={focused} /></>;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="section-label"><span className="label-mark" />{children}</div>;
}

function CTA({ children = "ANALYZE YOUR RESUME", dark = false }: { children?: ReactNode; dark?: boolean }) {
  return <Link to="/analyze" className={`button ${dark ? "button-dark" : ""}`}>{children}<ArrowRight size={15} /></Link>;
}

function Photo({ variant = "hero", alt }: { variant?: string; alt: string }) {
  const images: Record<string, string> = {
    hero: "photo-1498050108023-c5249f4df085",
    desk: "photo-1455390582262-044cdead277a",
    paper: "photo-1456324504439-367cee3b3c32",
    people: "photo-1521737711867-e3b97375f902",
  };
  return (
    <div className={`photo-frame photo-${variant}`}>
      <img src={`https://images.unsplash.com/${images[variant] ?? images.hero}?auto=format&fit=crop&w=1200&q=85`} alt={alt} loading={variant === "hero" ? "eager" : "lazy"} />
      <span className="photo-index">SK / {variant === "hero" ? "01" : variant === "desk" ? "02" : variant === "people" ? "03" : "04"}</span>
    </div>
  );
}

function FeatureGrid() {
  const features = [
    { Icon: Target, title: "A clearer score", text: "A simple starting point for understanding the bigger picture." },
    { Icon: Search, title: "Skills & keywords", text: "See where your skills show up—and where they could stand out." },
    { Icon: ClipboardCheck, title: "ATS readiness", text: "Review common formatting practices for readable resumes." },
    { Icon: Lightbulb, title: "Useful next steps", text: "Turn broad feedback into practical improvements you can make." },
  ];
  return <div className="feature-grid">{features.map(({ Icon, title, text }, index) => (
    <motion.article className="feature-tile" key={title} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <div className="feature-top"><span>0{index + 1}</span><Icon size={22} strokeWidth={1.5} /></div>
      <h3>{title}</h3><p>{text}</p><ArrowUpRight className="tile-arrow" size={16} />
    </motion.article>
  ))}</div>;
}

function ScoreRing({ score = 78, compact = false }: { score?: number; compact?: boolean }) {
  return <div className={`score-ring ${compact ? "score-ring-small" : ""}`} style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties} aria-label={`Sample score ${score} out of 100`}>
    <div><strong>{score}</strong><span>/100</span></div>
  </div>;
}

function ReportPreview() {
  return (
    <div className="report-preview">
      <div className="report-top"><span>SAMPLE REPORT</span><span>SK / 001</span></div>
      <div className="report-main">
        <div className="report-score"><ScoreRing compact /><div><span className="mono">OVERALL SCORE</span><strong>Good foundation</strong></div></div>
        <div className="report-bars">{sampleAnalysis.breakdown.slice(0, 4).map((item) => <div className="report-bar-row" key={item.label}><span>{item.label}</span><div className="bar-track"><i style={{ width: `${item.score}%` }} /></div><b>{item.score}</b></div>)}</div>
      </div>
      <div className="report-insight"><CheckCircle2 size={17} /><div><strong>Education section is clear</strong><span>Your experience could use a few more measurable outcomes.</span></div><ArrowUpRight size={15} /></div>
      <div className="report-note">ILLUSTRATIVE SAMPLE · NOT GENERATED FROM A RESUME</div>
    </div>
  );
}

function HomePage() {
  return <SiteLayout><div className="page-shell">
    <section className="hero">
      <div className="hero-copy">
        <PageMotion><SectionLabel>01 / RESUME INTELLIGENCE</SectionLabel>
          <h1>TURN YOUR<br />RESUME INTO<br /><span className="headline-outline">OPPORTUNITIES.</span></h1>
          <p className="hero-description">Get a clearer view of your resume, find room to grow, and take your next step with confidence.</p>
          <div className="hero-actions"><CTA /><Link className="text-link" to="/how-it-works">HOW IT WORKS <ArrowUpRight size={13} /></Link></div>
        </PageMotion>
        <div className="scribble-note"><span className="scribble-star">✳</span><span>Better resumes.<br />Brighter opportunities.</span></div>
      </div>
      <div className="hero-visual"><Photo alt="A thoughtfully arranged workspace with a laptop and notebook" /><div className="image-note">A LITTLE CLARITY<br />GOES A LONG WAY <ArrowDownRight size={18} /></div><span className="hero-stamp">YOUR NEXT<br />CHAPTER →</span></div>
    </section>
    <div className="trust-strip"><span>BUILT FOR THE NEXT GENERATION OF PROFESSIONALS</span><i /><b>STUDENTS</b><i /><b>NEW GRADUATES</b><i /><b>EARLY CAREER</b></div>
    <section className="intro-section section-pad">
      <div><SectionLabel>02 / A BETTER FIRST LOOK</SectionLabel><h2>YOUR RESUME HAS A STORY.<br /><em>MAKE IT CLEAR.</em></h2></div>
      <div className="intro-body"><p>SkillLens gives you a structured way to think about what’s working and what could be stronger—from your skills and experience to the way your story comes together.</p><Link className="text-link" to="/features">EXPLORE THE FEATURES <ArrowUpRight size={14} /></Link></div>
    </section>
    <section className="preview-section">
      <div className="preview-heading"><SectionLabel>03 / A LOOK INSIDE</SectionLabel><h2>INSIGHT, MADE<br />ACTIONABLE.</h2><p>A sample of the kind of feedback this experience is designed to help you explore.</p></div>
      <ReportPreview />
    </section>
    <section className="features-section section-pad"><div className="section-heading-row"><div><SectionLabel>04 / WHAT YOU CAN EXPLORE</SectionLabel><h2>A STRONGER<br /><em>STARTING POINT.</em></h2></div><Link to="/features" className="text-link">ALL FEATURES <ArrowUpRight size={14} /></Link></div><FeatureGrid /></section>
    <section className="final-cta"><SectionLabel>READY WHEN YOU ARE / 05</SectionLabel><h2>YOUR NEXT OPPORTUNITY<br />STARTS <em>HERE.</em></h2><CTA dark>ANALYZE YOUR RESUME</CTA><span className="cta-star">✳</span></section>
  </div></SiteLayout>;
}

function HowItWorksPage() {
  const steps = [
    { no: "01", name: "Upload", Icon: Upload, text: "Choose a PDF resume from your device. In this demo, your file remains in your browser session and is never sent anywhere.", photo: "paper" },
    { no: "02", name: "Explore", Icon: Search, text: "The future analysis service can consider your resume content, experience, skills, structure, and a role you have in mind. This frontend shows a stable sample report instead.", photo: "desk" },
    { no: "03", name: "Improve", Icon: BarChart3, text: "Review sample strengths, opportunities, and practical next steps. Use them as a guide for your own edits—not as a verdict.", photo: "people" },
  ];
  return <SiteLayout><div className="page-shell subpage">
    <section className="subhero"><SectionLabel>02 / A SIMPLE PROCESS</SectionLabel><h1>THREE STEPS.<br />A CLEARER CAREER<br /><em>DIRECTION.</em></h1><p>Understand your resume, identify opportunities to improve, and take the next step with confidence.</p></section>
    <section className="steps-list">{steps.map(({ no, name, Icon, text, photo }) => <article className="step-row" key={no}>
      <div className="step-number">{no}<span>/ 03</span></div><div className="step-copy"><Icon size={21} strokeWidth={1.5} /><h2>{name}</h2><p>{text}</p>{no === "01" && <CTA>TRY THE DEMO</CTA>}</div><Photo variant={photo} alt={name === "Upload" ? "Printed pages and papers on a desk" : name === "Explore" ? "A notebook and writing tools on a desk" : "A group collaborating around a table"} />
    </article>)}</section>
    <section className="callout-note"><span className="mono">A NOTE ON THIS DEMO</span><p>The screens here use illustrative sample data. They are a preview of the experience, not a live AI analysis.</p><FileCheck2 size={26} /></section>
    <section className="bottom-cta"><h2>MAKE YOUR NEXT<br /><em>MOVE WITH CLARITY.</em></h2><CTA /></section>
  </div></SiteLayout>;
}

function FeaturesPage() {
  return <SiteLayout><div className="page-shell subpage">
    <section className="subhero subhero-wide"><SectionLabel>03 / THOUGHTFUL BY DESIGN</SectionLabel><h1>MORE THAN A SCORE.<br /><em>A BETTER RESUME.</em></h1><p>A considered set of tools for looking at your resume from a few useful angles.</p></section>
    <section className="feature-detail-list">
      <article className="feature-detail"><div><SectionLabel>01 / RESUME SCORE</SectionLabel><h2>A STARTING<br />POINT, NOT A<br /><em>FINAL WORD.</em></h2><p>A sample score can help you explore different parts of a resume. A real scoring approach would be defined by a future analysis service.</p></div><div className="feature-score-art"><ScoreRing /><span className="mono">ILLUSTRATIVE<br />SAMPLE SCORE</span></div></article>
      <article className="feature-detail feature-detail-reverse"><div><SectionLabel>02 / SKILLS & KEYWORDS</SectionLabel><h2>MAKE YOUR<br />STRENGTHS<br /><em>EASIER TO FIND.</em></h2><p>See how skills might be grouped and consider which role-related terms are worth discussing in your resume.</p></div><div className="keyword-art"><span>TOOLS & TECHNOLOGY</span>{["Python", "Data analysis", "Communication", "Research"].map((x, i) => <div key={x}><b>0{i + 1}</b>{x}<ArrowUpRight size={14} /></div>)}</div></article>
      <article className="feature-detail"><div><SectionLabel>03 / ATS READINESS</SectionLabel><h2>GOOD FORM.<br /><em>BETTER FLOW.</em></h2><p>Explore common readability and formatting considerations. No check can guarantee compatibility with every applicant tracking system.</p></div><div className="ats-art">{["Standard section headings", "Consistent dates", "Readable structure", "Clear contact details"].map((x) => <div key={x}><Check size={15} />{x}<span>REVIEW</span></div>)}</div></article>
      <article className="feature-detail feature-detail-reverse"><div><SectionLabel>04 / ACTIONABLE SUGGESTIONS</SectionLabel><h2>SMALL EDITS.<br /><em>STRONGER STORY.</em></h2><p>Practice turning a broad responsibility into a specific, clear description of what you did and why it mattered.</p></div><div className="before-after"><span className="mono">ILLUSTRATIVE EXAMPLE</span><div><b>BEFORE</b><p>Worked on a team project.</p></div><ArrowDownRight size={18} /><div><b>AFTER</b><p>Built a task-tracking prototype with a four-person team, clarifying weekly project priorities.</p></div></div></article>
      <article className="feature-detail"><div><SectionLabel>05 / TARGET ROLE AWARENESS</SectionLabel><h2>KEEP THE<br />NEXT ROLE IN<br /><em>THE PICTURE.</em></h2><p>Optionally name a role to frame the sample report. The keyword examples remain illustrative, not findings about your uploaded file.</p></div><div className="role-card"><span className="mono">ROLE IN MIND</span><div>Software Developer <ArrowDownRight size={17} /></div><span>EXAMPLE CONTEXT ONLY</span></div></article>
    </section>
    <section className="bottom-cta"><h2>SEE WHAT A<br /><em>CLEARER VIEW CAN DO.</em></h2><CTA /></section>
  </div></SiteLayout>;
}

function AboutPage() {
  return <SiteLayout><div className="page-shell subpage">
    <section className="about-hero"><div><SectionLabel>04 / THE IDEA</SectionLabel><h1>BUILT FOR<br />STUDENTS.<br /><em>READY FOR<br />WHAT’S NEXT.</em></h1><p>SkillLens is an idea rooted in a simple belief: improving your resume should feel a little less like guessing.</p></div><Photo variant="people" alt="People working together around a table" /></section>
    <section className="about-mission"><span className="mono">OUR MISSION / 01</span><h2>MAKE THE NEXT<br />STEP FEEL <em>MORE POSSIBLE.</em></h2><p>Students, new graduates, and people early in their careers deserve useful ways to understand how their experience comes across. SkillLens is being shaped to offer a clear, approachable place to start.</p></section>
    <section className="about-columns"><article><SectionLabel>THE CHALLENGE</SectionLabel><h3>IT’S HARD TO EDIT WHAT YOU CAN’T SEE.</h3><p>Resume advice can feel broad or contradictory. A structured view of skills, clarity, and presentation can help make the work of improving feel more manageable.</p></article><article><SectionLabel>THE APPROACH</SectionLabel><h3>USEFUL, HONEST, HUMAN.</h3><p>We believe good feedback should be understandable and practical. This demo makes its limits clear: every score and observation shown here is sample content.</p></article></section>
    <section className="about-note"><span className="scribble-star">✳</span><p>Designed around your next step—not an imaginary perfect resume.</p><CTA>EXPLORE THE DEMO</CTA></section>
  </div></SiteLayout>;
}

function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const messages = [
    "VALIDATING PDF",
    "EXTRACTING TEXT",
    "ANALYZING CONTENT",
    "PREPARING FINDINGS",
  ];

  function acceptFile(next: File | undefined) {
    if (!next) return;
    const issue = validateResume(next);
    setError(issue ?? "");
    setFile(issue ? null : next);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  }

  async function beginAnalysis() {
    if (!file || loading) return;

    setProgress(0);
    setLoading(true);

    try {
      setProgress(15);
      const result = await analyzeUploadedResume(file, targetRole.trim());
      setProgress(100);
      navigate("/results", {
        state: {
          analysisResult: result,
          filename: file.name,
          targetRole: targetRole.trim(),
        },
      });
    } catch (reason) {
      setLoading(false);
      setProgress(0);
      setError(reason instanceof Error ? reason.message : "Unable to prepare an analysis for this resume.");
    }
  }

  const activeMessage = messages[Math.min(messages.length - 1, Math.floor(progress / 25))];

  return <SiteLayout focused><div className="page-shell analyze-page">
    {!loading ? <>
      <div className="analyze-heading"><SectionLabel>RESUME ANALYSIS / LOCAL RULES</SectionLabel><h1>LET’S LOOK AT<br /><em>YOUR RESUME.</em></h1><p>Upload your resume to explore a rule-based analysis based on the actual document text.</p></div>
      <div className="upload-layout">
        <div className="upload-column">
          <div className={`drop-zone ${dragging ? "drag-active" : ""} ${error ? "has-error" : ""}`} role="button" tabIndex={0} aria-label="Choose a PDF resume or drop one here" onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={handleChange} />
            <span className="upload-icon"><Upload size={23} strokeWidth={1.5} /></span><strong>DROP YOUR RESUME HERE</strong><span>or click to browse your files</span><small>PDF ONLY · MAX 5 MB</small>
          </div>
          {error && <p className="form-error" role="alert"><CircleAlert size={16} />{error}</p>}
          {file && <div className="selected-file"><FileText size={22} /><div><strong>{file.name}</strong><span>PDF DOCUMENT · {formatFileSize(file.size)}</span></div><button type="button" aria-label="Remove selected file" onClick={() => { setFile(null); setError(""); }}><X size={18} /></button></div>}
          <div className="target-field"><label htmlFor="target-role">WHAT ROLE ARE YOU TARGETING? <span>OPTIONAL</span></label><input id="target-role" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="e.g. Software Developer" list="role-suggestions" /><datalist id="role-suggestions"><option value="Machine Learning Engineer" /><option value="Data Analyst" /><option value="Software Developer" /><option value="Frontend Developer" /><option value="AI/ML Intern" /></datalist></div>
          <button type="button" className="button button-dark analyze-submit" disabled={!file} onClick={beginAnalysis}>ANALYZE RESUME <ArrowRight size={15} /></button>
          <p className="privacy-note"><span>i</span>This browser-only analysis runs locally and does not send the PDF or extracted text to an external service.</p>
        </div>
        <aside className="upload-aside"><Photo variant="paper" alt="Papers and a notebook arranged on a desk" /><div className="aside-copy"><span className="mono">A SMALL FIRST STEP</span><p>Good feedback starts with a clear picture of where you are.</p></div></aside>
      </div>
    </> : <section className="analysis-loading" aria-live="polite">
      <SectionLabel>LOCAL ANALYSIS / IN PROGRESS</SectionLabel><div className="loading-number">{String(progress).padStart(2, "0")}<span>%</span></div><h1>GIVING YOUR<br /><em>STORY A LOOK.</em></h1><p>{activeMessage}</p><div className="loading-track"><motion.i animate={{ width: `${progress}%` }} transition={{ duration: reduced ? 0 : 0.16 }} /></div><span className="mono">RULE-BASED RESUME REVIEW · NO AI MODEL INVOLVED</span>
    </section>}
  </div></SiteLayout>;
}

function ResultsTabs({ result, role }: { result: AnalysisResult; role: string }) {
  const [tab, setTab] = useState("Key insights");
  const tabs = ["Key insights", "Suggestions", "Missing keywords", "ATS check", "Detailed feedback"];
  const missingKeywords = result.keywords.filter((keyword) => !keyword.detected);
  const detectedKeywords = result.keywords.filter((keyword) => keyword.detected);

  return <section className="results-tabs-section">
    <div className="tabs-list" role="tablist" aria-label="Analysis report sections">
      {tabs.map((item, index) => <button key={item} role="tab" id={`tab-${index}`} aria-selected={tab === item} aria-controls={`panel-${index}`} tabIndex={tab === item ? 0 : -1} onClick={() => setTab(item)}>{item}</button>)}
    </div>
    {tabs.map((item, index) => <div key={item} id={`panel-${index}`} role="tabpanel" aria-labelledby={`tab-${index}`} hidden={tab !== item} className="tab-panel">
      {tab === "Key insights" && <div className="insight-list">{result.insights.map((insight) => <article className="insight-row" key={insight.title}><span className={`status-icon ${insight.status}`}>{insight.status === "strength" ? <Check size={15} /> : <CircleAlert size={15} />}</span><div><strong>{insight.title}</strong><p>{insight.detail}</p></div><span className="mono">{insight.status === "strength" ? "STRENGTH" : "OPPORTUNITY"}</span></article>)}</div>}
      {tab === "Suggestions" && <div className="suggestion-list">{result.recommendations.map((recommendation) => <SuggestionCard key={recommendation.title} recommendation={recommendation} />)}</div>}
      {tab === "Missing keywords" && <div className="keyword-panel"><div className="panel-intro"><span className="mono">ROLE-RELATED CHECKS</span><p>{role ? `These are the terms relevant to ${role} that were not detected in the uploaded document, based on the current rule set.` : "No target role was specified, so the missing-keyword panel is shown only as a general view of the matching rules."}</p></div><div className="keyword-tags">{(missingKeywords.length > 0 ? missingKeywords : detectedKeywords.slice(0, 5)).map((keyword, i) => <span key={`${keyword.keyword}-${i}`}><b>0{i + 1}</b>{keyword.keyword}<ArrowUpRight size={13} /></span>)}</div></div>}
      {tab === "ATS check" && <div className="ats-list">{result.ats.map((item) => <article key={item.title}><CheckCircle2 size={17} /><div><strong>{item.title}</strong><p>{item.detail}</p></div><span>{item.status}</span></article>)}<p className="panel-disclaimer">These are preliminary readability checks derived from extracted text and document metadata, not a claim of ATS compatibility.</p></div>}
      {tab === "Detailed feedback" && <div className="feedback-list">{result.feedback.map((item, i) => <details key={item.title} open={i === 0}><summary><span className="feedback-index">0{i + 1}</span><span><strong>{item.title}</strong><small>{item.summary}</small></span><ChevronDown size={17} /></summary><p>{item.detail}</p></details>)}</div>}
    </div>)}
  </section>;
}

function SuggestionCard({ recommendation }: { recommendation: Recommendation }) {
  return <article className="suggestion-card"><div className="suggestion-card-top"><span className={`priority priority-${recommendation.priority.toLowerCase()}`}>{recommendation.priority} PRIORITY</span><ArrowUpRight size={16} /></div><h3>{recommendation.title}</h3><p>{recommendation.detail}</p><div><b>NEXT STEP</b><span>{recommendation.nextStep}</span></div></article>;
}

function ResultsPage() {
  const location = useLocation();
  const routeState = (location.state ?? null) as { analysisResult?: AnalysisResult; filename?: string; targetRole?: string } | null;
  const result = routeState?.analysisResult ?? sampleAnalysis;
  const isSample = !routeState?.analysisResult;
  const role = routeState?.targetRole ?? result.metadata.targetRole ?? "";
  const fileName = routeState?.filename ?? result.metadata.filename;

  return <SiteLayout focused><div className="page-shell results-page">
    <div className="demo-banner"><Sparkles size={14} />{isSample ? "SAMPLE REPORT — NOT AN AI-GENERATED ANALYSIS" : "LOCAL RULE-BASED ANALYSIS — NO EXTERNAL SERVICE"}</div>
    <section className="results-header"><div><SectionLabel>02 / RESULTS</SectionLabel><h1>YOUR RESUME<br /><em>ANALYSIS.</em></h1><p>{isSample ? "A sample preview of the report layout and scoring format." : "A preliminary analysis based on the PDF content you uploaded."}</p><div className="result-meta">{fileName && <span><FileText size={14} />{fileName}</span>}{role && <span><Target size={14} />{role}</span>}{isSample && <span>DEMO REPORT · EXAMPLE DATA</span>}</div></div><Link to="/analyze" className="button button-outline">NEW ANALYSIS <ArrowRight size={14} /></Link></section>
    <section className="score-overview">
      <div className="overall-score"><ScoreRing score={result.score} /><span className="mono">SCORE / 100</span><strong>{result.scoreLabel}</strong><p>{isSample ? "This is a sample preview and not a score from your uploaded resume." : "Preliminary rule-based score based on detectable resume content and document structure."}</p></div>
      <div className="breakdown-panel"><div className="panel-title"><span>SCORE BREAKDOWN</span><span className="mono">{isSample ? "SAMPLE METRICS" : "LOCAL RULES"}</span></div>{result.breakdown.map((item, i) => <div className="breakdown-row" key={item.label}><span>{item.label}</span><div className="bar-track"><motion.i initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 0.8, delay: i * 0.08 }} /></div><b>{item.score}</b></div>)}</div>
    </section>
    <ResultsTabs result={result} role={role} />
    <section className="results-bottom"><p>{isSample ? "Every result on this page is sample content for demonstration purposes." : "This report is derived from the uploaded document and was generated locally in the browser."}</p><div><Link to="/analyze" className="button button-dark">ANALYZE ANOTHER RESUME <ArrowRight size={15} /></Link><Link to="/" className="text-link">BACK TO HOME <ArrowUpRight size={14} /></Link></div></section>
  </div></SiteLayout>;
}

function NotFoundPage() {
  return <SiteLayout><div className="not-found"><SectionLabel>404 / PAGE NOT FOUND</SectionLabel><h1>THIS PAGE<br /><em>ISN’T HERE.</em></h1><Link to="/" className="button button-dark">BACK TO HOME <ArrowRight size={15} /></Link></div></SiteLayout>;
}

export default function App() {
  return <AnimatePresence mode="wait"><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/how-it-works" element={<HowItWorksPage />} />
    <Route path="/features" element={<FeaturesPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/analyze" element={<AnalyzePage />} />
    <Route path="/results" element={<ResultsPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AnimatePresence>;
}
