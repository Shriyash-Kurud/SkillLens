import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2,
  CircleAlert, FileCheck2, FileText, Lightbulb,
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

const ease = [0.22, 1, 0.36, 1] as const;
// Results page: sections rise in one after another; lists inside tabs stagger their rows.
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } } };
const rise = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease } },
};
const listStagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const listItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

function useCountUp(target: number, duration = 1.4, delay = 0) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) { setValue(target); return; }
    const controls = animate(0, target, { duration, delay, ease, onUpdate: (latest) => setValue(Math.round(latest)) });
    return () => controls.stop();
  }, [target, duration, delay, reduced]);
  return value;
}

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

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="site-header">
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

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div><Link to="/" className="wordmark">SkillLens<span className="wordmark-dot">.</span></Link><p>A clearer way to see what your resume could become.</p></div>
        <div className="footer-links">
          {navItems.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}
          <Link to="/analyze">ANALYZE RESUME <ArrowUpRight size={13} /></Link>
        </div>
      </div>
      <div className="footer-bottom"><span>MADE FOR THE NEXT STEP.</span><span>© {new Date().getFullYear()} SKILLLENS</span></div>
    </footer>
  );
}

// Sections that slide/fade in as they scroll into view. Every public page is covered by these selectors.
type RevealFrom = "up" | "left" | "right" | "scale";
const REVEAL_TARGETS: { selector: string; from: RevealFrom; stagger?: boolean }[] = [
  { selector: ".hero-visual", from: "right" },
  { selector: ".trust-strip", from: "up" },
  { selector: ".intro-section > div:first-child", from: "left" },
  { selector: ".intro-section > div:last-child", from: "right" },
  { selector: ".preview-heading", from: "left" },
  { selector: ".report-preview", from: "right" },
  { selector: ".section-heading-row", from: "up" },
  { selector: ".feature-grid", from: "up" },
  { selector: ".final-cta", from: "scale" },
  { selector: ".subhero", from: "up" },
  { selector: ".step-row", from: "up" },
  { selector: ".callout-note", from: "up" },
  { selector: ".bottom-cta", from: "scale" },
  { selector: ".feature-detail", from: "up" },
  { selector: ".about-hero > div:first-child", from: "left" },
  { selector: ".about-hero .photo-frame", from: "right" },
  { selector: ".about-mission", from: "up" },
  { selector: ".about-columns > article", from: "up", stagger: true },
  { selector: ".about-note", from: "scale" },
];

function useScrollReveal() {
  useLayoutEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    const targets: { element: HTMLElement; classes: string[] }[] = [];
    REVEAL_TARGETS.forEach(({ selector, from, stagger }) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
        const classes = ["reveal", `reveal-${from}`];
        element.classList.add(...classes);
        if (stagger) element.style.setProperty("--reveal-delay", `${index * 0.14}s`);
        targets.push({ element, classes });
        observer.observe(element);
      });
    });
    return () => {
      observer.disconnect();
      targets.forEach(({ element, classes }) => {
        element.classList.remove(...classes, "is-visible");
        element.style.removeProperty("--reveal-delay");
      });
    };
  }, []);
}

// Thin bar at the top of the page that fills as you scroll.
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

function SiteLayout({ children, focused = false, ambient = true }: { children: ReactNode; focused?: boolean; ambient?: boolean }) {
  useScrollReveal();
  return <><ScrollProgress />{focused && ambient && <div className="ambient" aria-hidden="true"><i /><i /><i /></div>}<Header /><main>{children}</main>{!focused && <Footer />}</>;
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
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);
  return (
    <div ref={ref} className={`photo-frame photo-${variant}`}>
      <motion.img style={{ y, scale: 1.2, transition: "none" }} src={`https://images.unsplash.com/${images[variant] ?? images.hero}?auto=format&fit=crop&w=1200&q=85`} alt={alt} loading={variant === "hero" ? "eager" : "lazy"} />
      <span className="photo-index">SK / {variant === "hero" ? "01" : variant === "desk" ? "02" : variant === "people" ? "03" : "04"}</span>
    </div>
  );
}

function FeatureGrid() {
  const features = [
    { Icon: Target, title: "A clearer score", text: "A simple starting point for understanding the bigger picture." },
    { Icon: Search, title: "Skills presentation", text: "See how your skills are presented—and where they could stand out." },
    { Icon: FileCheck2, title: "Structure & clarity", text: "See how well your resume is organized and how clearly it reads." },
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
  const value = useCountUp(score, 1.6, 0.25);
  return <div className={`score-ring ${compact ? "score-ring-small" : ""}`} style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties} role="img" aria-label={`Score ${score} out of 100`}>
    <div><strong>{value}</strong><span>/100</span></div>
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
    { no: "01", name: "Upload", Icon: Upload, text: "Choose a PDF resume from your device. It is read in memory to extract its text and is not stored on our server.", photo: "paper" },
    { no: "02", name: "Explore", Icon: Search, text: "An AI model (Google Gemini) reviews the text of your resume for content, skills, projects, experience, structure, and clarity.", photo: "desk" },
    { no: "03", name: "Improve", Icon: BarChart3, text: "Review your strengths, gaps, and practical next steps. Use them as a guide for your own edits—not as a verdict.", photo: "people" },
  ];
  return <SiteLayout><div className="page-shell subpage">
    <section className="subhero"><SectionLabel>02 / A SIMPLE PROCESS</SectionLabel><h1>THREE STEPS.<br />A CLEARER CAREER<br /><em>DIRECTION.</em></h1><p>Understand your resume, identify opportunities to improve, and take the next step with confidence.</p></section>
    <section className="steps-list">{steps.map(({ no, name, Icon, text, photo }) => <article className="step-row" key={no}>
      <div className="step-number">{no}<span>/ 03</span></div><div className="step-copy"><Icon size={21} strokeWidth={1.5} /><h2>{name}</h2><p>{text}</p>{no === "01" && <CTA>ANALYZE A RESUME</CTA>}</div><Photo variant={photo} alt={name === "Upload" ? "Printed pages and papers on a desk" : name === "Explore" ? "A notebook and writing tools on a desk" : "A group collaborating around a table"} />
    </article>)}</section>
    <section className="callout-note"><span className="mono">A NOTE ON PRIVACY</span><p>The text of your resume is sent to Google’s Gemini API for analysis and is not saved by SkillLens. Avoid uploading resumes you are not comfortable sharing with an AI service.</p><FileCheck2 size={26} /></section>
    <section className="bottom-cta"><h2>MAKE YOUR NEXT<br /><em>MOVE WITH CLARITY.</em></h2><CTA /></section>
  </div></SiteLayout>;
}

function FeaturesPage() {
  return <SiteLayout><div className="page-shell subpage">
    <section className="subhero subhero-wide"><SectionLabel>03 / THOUGHTFUL BY DESIGN</SectionLabel><h1>MORE THAN A SCORE.<br /><em>A BETTER RESUME.</em></h1><p>A considered set of tools for looking at your resume from a few useful angles.</p></section>
    <section className="feature-detail-list">
      <article className="feature-detail"><div><SectionLabel>01 / RESUME SCORE</SectionLabel><h2>A STARTING<br />POINT, NOT A<br /><em>FINAL WORD.</em></h2><p>Your resume gets a 0–100 score from a transparent weighted formula covering content, skills, projects, education, structure, and clarity. It reflects general resume quality, not hiring odds.</p></div><div className="feature-score-art"><ScoreRing /><span className="mono">ILLUSTRATIVE<br />SAMPLE SCORE</span></div></article>
      <article className="feature-detail feature-detail-reverse"><div><SectionLabel>02 / SKILLS PRESENTATION</SectionLabel><h2>MAKE YOUR<br />STRENGTHS<br /><em>EASIER TO FIND.</em></h2><p>Get feedback on how your skills are listed and grouped, so your strongest tools and strengths are easy to spot.</p></div><div className="keyword-art"><span>ILLUSTRATIVE EXAMPLE</span>{["Python", "Data analysis", "Communication", "Research"].map((x, i) => <div key={x}><b>0{i + 1}</b>{x}<ArrowUpRight size={14} /></div>)}</div></article>
      <article className="feature-detail"><div><SectionLabel>03 / STRUCTURE & CLARITY</SectionLabel><h2>GOOD FORM.<br /><em>BETTER FLOW.</em></h2><p>The review looks at how well your resume is organized, how clearly it reads, and whether anything important is missing.</p></div><div className="ats-art">{["Section organization", "Clarity of wording", "Completeness", "Professional presentation"].map((x) => <div key={x}><Check size={15} />{x}<span>REVIEWED</span></div>)}</div></article>
      <article className="feature-detail feature-detail-reverse"><div><SectionLabel>04 / ACTIONABLE SUGGESTIONS</SectionLabel><h2>SMALL EDITS.<br /><em>STRONGER STORY.</em></h2><p>Get prioritized suggestions and ideas for rewriting weaker sections, turning a broad responsibility into a clear description of what you did and why it mattered.</p></div><div className="before-after"><span className="mono">ILLUSTRATIVE EXAMPLE</span><div><b>BEFORE</b><p>Worked on a team project.</p></div><ArrowDownRight size={18} /><div><b>AFTER</b><p>Built a task-tracking prototype with a four-person team, clarifying weekly project priorities.</p></div></div></article>
    </section>
    <section className="bottom-cta"><h2>SEE WHAT A<br /><em>CLEARER VIEW CAN DO.</em></h2><CTA /></section>
  </div></SiteLayout>;
}

function AboutPage() {
  return <SiteLayout><div className="page-shell subpage">
    <section className="about-hero"><div><SectionLabel>04 / THE IDEA</SectionLabel><h1>BUILT FOR<br />STUDENTS.<br /><em>READY FOR<br />WHAT’S NEXT.</em></h1><p>SkillLens is an idea rooted in a simple belief: improving your resume should feel a little less like guessing.</p></div><Photo variant="people" alt="People working together around a table" /></section>
    <section className="about-mission"><span className="mono">OUR MISSION / 01</span><h2>MAKE THE NEXT<br />STEP FEEL <em>MORE POSSIBLE.</em></h2><p>Students, new graduates, and people early in their careers deserve useful ways to understand how their experience comes across. SkillLens is being shaped to offer a clear, approachable place to start.</p></section>
    <section className="about-columns"><article><SectionLabel>THE CHALLENGE</SectionLabel><h3>IT’S HARD TO EDIT WHAT YOU CAN’T SEE.</h3><p>Resume advice can feel broad or contradictory. A structured view of skills, clarity, and presentation can help make the work of improving feel more manageable.</p></article><article><SectionLabel>THE APPROACH</SectionLabel><h3>USEFUL, HONEST, HUMAN.</h3><p>We believe good feedback should be understandable and practical. Scores reflect general resume quality, not hiring odds, and AI feedback can be imperfect.</p></article></section>
    <section className="about-note"><span className="scribble-star">✳</span><p>Designed around your next step—not an imaginary perfect resume.</p><CTA>TRY IT NOW</CTA></section>
  </div></SiteLayout>;
}

function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
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
    "ANALYZING WITH AI",
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
    setError("");
    setLoading(true);

    // The real wait time is unknown, so the bar creeps toward 90% until the server answers.
    const timer = setInterval(() => setProgress((value) => Math.min(90, value + (value < 30 ? 5 : value < 60 ? 2 : 1))), 700);

    try {
      const result = await analyzeUploadedResume(file);
      setProgress(100);
      navigate("/results", { state: { analysisResult: result, filename: file.name } });
    } catch (reason) {
      setLoading(false);
      setProgress(0);
      setError(reason instanceof Error ? reason.message : "Unable to analyze this resume. Please try again.");
    } finally {
      clearInterval(timer);
    }
  }

  const activeMessage = messages[Math.min(messages.length - 1, Math.floor(progress / 25))];

  return <SiteLayout focused ambient={!loading}><div className="page-shell analyze-page">
    {!loading ? <>
      <div className="analyze-heading"><SectionLabel>RESUME ANALYSIS / AI-POWERED</SectionLabel><h1>LET’S LOOK AT<br /><em>YOUR RESUME.</em></h1><p>Upload your resume to get an AI review of its content, structure, and clarity.</p></div>
      <div className="upload-layout">
        <div className="upload-column">
          <div className={`drop-zone ${dragging ? "drag-active" : ""} ${error ? "has-error" : ""}`} role="button" tabIndex={0} aria-label="Choose a PDF resume or drop one here" onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={handleChange} />
            <span className="upload-icon"><Upload size={23} strokeWidth={1.5} /></span><strong>DROP YOUR RESUME HERE</strong><span>or click to browse your files</span><small>PDF ONLY · MAX 10 MB</small>
          </div>
          {error && <p className="form-error" role="alert"><CircleAlert size={16} />{error}</p>}
          {file && <div className="selected-file"><FileText size={22} /><div><strong>{file.name}</strong><span>PDF DOCUMENT · {formatFileSize(file.size)}</span></div><button type="button" aria-label="Remove selected file" onClick={() => { setFile(null); setError(""); }}><X size={18} /></button></div>}
          <button type="button" className="button button-dark analyze-submit" disabled={!file} onClick={beginAnalysis}>ANALYZE RESUME <ArrowRight size={15} /></button>
          <p className="privacy-note"><span>i</span>The text of your resume is sent to Google’s Gemini API to generate the analysis. Your PDF is processed in memory and is not stored by SkillLens.</p>
        </div>
        <aside className="upload-aside"><Photo variant="paper" alt="Papers and a notebook arranged on a desk" /><div className="aside-copy"><span className="mono">A SMALL FIRST STEP</span><p>Good feedback starts with a clear picture of where you are.</p></div></aside>
      </div>
    </> : <section className="analysis-loading" aria-live="polite">
      <SectionLabel>AI ANALYSIS / IN PROGRESS</SectionLabel><div className="loading-number">{String(progress).padStart(2, "0")}<span>%</span></div><h1>GIVING YOUR<br /><em>STORY A LOOK.</em></h1><p>{activeMessage}</p><div className="loading-track"><motion.i animate={{ width: `${progress}%` }} transition={{ duration: reduced ? 0 : 0.16 }} /></div><span className="mono">THIS CAN TAKE A MINUTE OR TWO</span>
    </section>}
  </div></SiteLayout>;
}

function ResultsTabs({ result }: { result: AnalysisResult }) {
  const tabs = ["Detailed feedback", "Key insights", "Missing elements", "Sections to rewrite", "Suggestions"];
  const [tab, setTab] = useState(tabs[0]);
  const feedbackReply = useMemo(() => buildFeedbackReply(result.feedback), [result.feedback]);
  const suggestionsReply = useMemo(() => buildSuggestionsReply(result.recommendations), [result.recommendations]);
  const index = tabs.indexOf(tab);

  return <motion.section className="results-tabs-section" variants={rise}>
    <div className="tabs-list" role="tablist" aria-label="Analysis report sections">
      {tabs.map((item, i) => <button key={item} role="tab" id={`tab-${i}`} aria-selected={tab === item} aria-controls={`panel-${i}`} tabIndex={tab === item ? 0 : -1} onClick={() => setTab(item)}>
        {item}{tab === item && <motion.span layoutId="tab-accent" className="tab-accent" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
      </button>)}
    </div>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={tab} id={`panel-${index}`} role="tabpanel" aria-labelledby={`tab-${index}`} className="tab-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.26, ease }}>
        {tab === "Detailed feedback" && <ChatReply question="How does my resume look in each area?" paragraphs={feedbackReply} />}
        {tab === "Key insights" && <motion.div className="insight-list" variants={listStagger} initial="hidden" animate="show">{result.insights.map((insight, i) => <motion.article className="insight-row" key={`${insight.title}-${i}`} variants={listItem} whileHover={{ y: -2 }}><span className={`status-icon ${insight.status}`}>{insight.status === "strength" ? <Check size={15} /> : <CircleAlert size={15} />}</span><div><strong>{insight.title}</strong><p>{insight.detail}</p></div><span className="mono">{insight.status === "strength" ? "STRENGTH" : "OPPORTUNITY"}</span></motion.article>)}</motion.div>}
        {tab === "Missing elements" && <motion.div className="ats-list is-missing" variants={listStagger} initial="hidden" animate="show">{result.missing.map((item, i) => <motion.article key={`${item.title}-${i}`} variants={listItem} whileHover={{ y: -2 }}><CircleAlert size={17} /><div><strong>{item.title}</strong><p>{item.detail}</p></div><span>{item.importance.toUpperCase()}</span></motion.article>)}<motion.p className="panel-disclaimer" variants={listItem}>{result.missing.length === 0 ? "No important gaps were identified. " : ""}Items marked optional may not apply to you, for example work experience for a student.</motion.p></motion.div>}
        {tab === "Sections to rewrite" && <motion.div className="ats-list is-missing" variants={listStagger} initial="hidden" animate="show">{result.rewrites.map((item, i) => <motion.article key={`${item.section}-${i}`} variants={listItem} whileHover={{ y: -2 }}><Lightbulb size={17} /><div><strong>{item.section}</strong><p>{item.issue}</p><p><b>Try:</b> {item.improvement}</p></div></motion.article>)}<motion.p className="panel-disclaimer" variants={listItem}>{result.rewrites.length === 0 ? "No sections were flagged for rewriting. " : ""}Placeholders in square brackets are for you to fill with your own real details.</motion.p></motion.div>}
        {tab === "Suggestions" && <ChatReply question="How can I improve my resume?" paragraphs={suggestionsReply} />}
      </motion.div>
    </AnimatePresence>
  </motion.section>;
}

type ReplySegment = { text: string; bold?: boolean };

function endSentence(value: string) {
  const text = value.trim();
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

// Turns the suggestions into a few chat-style paragraphs, highest priority first.
function buildSuggestionsReply(recommendations: Recommendation[]): ReplySegment[][] {
  const rank = { High: 0, Medium: 1, Low: 2 };
  const sorted = [...recommendations].sort((a, b) => rank[a.priority] - rank[b.priority]);
  const openers = ["First,", "Next,", "After that,", "Also,", "Then,"];
  const paragraphs: ReplySegment[][] = [[{ text: "Based on your resume, here is what I would work on, starting with the changes that matter most." }]];
  sorted.forEach((item, i) => {
    const opener = sorted.length > 1 && i === sorted.length - 1 ? "Finally," : openers[i] ?? "Also,";
    paragraphs.push([
      { text: `${opener} ` },
      { text: item.title.trim().replace(/[.!?]+$/, ""), bold: true },
      { text: ` (${item.priority.toLowerCase()} priority). ${endSentence(item.detail)} Next step: ${endSentence(item.nextStep)}` },
    ]);
  });
  paragraphs.push([{ text: "Treat these as guidance rather than a verdict, and only add details that are true for you." }]);
  return paragraphs;
}

function buildFeedbackReply(feedback: AnalysisResult["feedback"]): ReplySegment[][] {
  const paragraphs: ReplySegment[][] = [[{ text: "Here is how your resume looks in each area." }]];
  feedback.forEach((item) => {
    paragraphs.push([
      { text: item.title.trim().replace(/[.!?:]+$/, ""), bold: true },
      { text: `: ${endSentence(item.summary)} ${endSentence(item.detail)}` },
    ]);
  });
  paragraphs.push([{ text: "Open the other tabs for your strengths, missing pieces, and rewrite ideas." }]);
  return paragraphs;
}

function ChatReply({ question, paragraphs }: { question: string; paragraphs: ReplySegment[][] }) {
  const reduced = useReducedMotion();
  const skipTyping = !!reduced;
  const totalWords = useMemo(() => paragraphs.flat().reduce((sum, part) => sum + (part.text.match(/\S+/g)?.length ?? 0), 0), [paragraphs]);
  const [ready, setReady] = useState(skipTyping);
  const [count, setCount] = useState(skipTyping ? totalWords : 0);
  const done = count >= totalWords;

  // Short "thinking" pause, then reveal the reply a few characters at a time.
  useEffect(() => {
    if (skipTyping) return;
    const timer = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(timer);
  }, [skipTyping]);

  useEffect(() => {
    if (!ready || done) return;
    const timer = setInterval(() => setCount((value) => Math.min(totalWords, value + 1)), 70);
    return () => clearInterval(timer);
  }, [ready, done, totalWords]);

  let remaining = count;
  const visible = paragraphs
    .map((parts) => parts.map((part) => {
      const tokens = part.text.match(/\s+|\S+/g) ?? [];
      const shown = tokens.map((token) => {
        if (/^\s+$/.test(token)) return remaining > 0 ? token : "";
        if (remaining <= 0) return "";
        remaining -= 1;
        return token;
      }).join("");
      return { ...part, text: shown };
    }))
    .filter((parts) => parts.some((part) => part.text.length > 0));

  return <div className="chat">
    <motion.div className="chat-row chat-row-user" initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease }}>
      <div className="chat-bubble chat-bubble-user">{question}</div>
    </motion.div>
    <motion.div className="chat-row" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25, ease }}>
      <span className="chat-avatar"><Sparkles size={15} /></span>
      <div className="chat-bubble chat-bubble-ai">
        <span className="chat-name">SKILLLENS AI</span>
        <div className="sr-only">{paragraphs.map((parts, i) => <p key={i}>{parts.map((part) => part.text).join("")}</p>)}</div>
        {!ready ? <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span> : <div aria-hidden="true">
          {visible.map((parts, i) => <p key={i}>
            {parts.map((part, j) => part.bold ? <strong key={j}>{part.text}</strong> : <span key={j}>{part.text}</span>)}
            {!done && i === visible.length - 1 && <span className="chat-cursor" />}
          </p>)}
        </div>}
        {ready && !done && <button type="button" className="chat-skip" onClick={() => setCount(totalWords)}>SHOW FULL REPLY</button>}
      </div>
    </motion.div>
  </div>;
}

function BreakdownRow({ item, index }: { item: AnalysisResult["breakdown"][number]; index: number }) {
  const delay = 0.55 + index * 0.09;
  const value = useCountUp(item.score, 1.1, delay);
  return <motion.div className="breakdown-row" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: delay - 0.1, ease }}>
    <span>{item.label}</span>
    <div className="bar-track"><motion.i initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 1.1, delay, ease }} /></div>
    <b>{value}</b>
  </motion.div>;
}

function ResultsPage() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const routeState = (location.state ?? null) as { analysisResult?: AnalysisResult; filename?: string } | null;
  const result = routeState?.analysisResult ?? sampleAnalysis;
  const isSample = !routeState?.analysisResult;
  const fileName = routeState?.filename ?? result.metadata.filename;

  return <SiteLayout focused><motion.div className="page-shell results-page" variants={stagger} initial={reduced ? false : "hidden"} animate="show">
    <motion.div className="demo-banner" variants={rise}><Sparkles size={14} />{isSample ? "SAMPLE REPORT — NOT AN AI-GENERATED ANALYSIS" : "AI-GENERATED ANALYSIS — GENERAL RESUME QUALITY, NOT A HIRING PREDICTION"}</motion.div>
    <motion.section className="results-header" variants={rise}><div><SectionLabel>02 / RESULTS</SectionLabel><h1>YOUR RESUME<br /><em>ANALYSIS.</em></h1><p>{isSample ? "A sample preview of the report layout and scoring format." : "An AI-generated review of the resume you uploaded."}</p><div className="result-meta">{fileName && <span><FileText size={14} />{fileName}</span>}{isSample && <span>DEMO REPORT · EXAMPLE DATA</span>}</div></div><Link to="/analyze" className="button button-outline">NEW ANALYSIS <ArrowRight size={14} /></Link></motion.section>
    <motion.section className="score-overview" variants={rise}>
      <div className="overall-score"><ScoreRing score={result.score} /><span className="mono">SCORE / 100</span><motion.strong initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.2, ease }}>{result.scoreLabel}</motion.strong></div>
      <div className="breakdown-panel"><div className="panel-title"><span>SCORE BREAKDOWN</span><span className="mono">{isSample ? "SAMPLE METRICS" : "WEIGHTED SCORE"}</span></div>{result.breakdown.map((item, i) => <BreakdownRow key={item.label} item={item} index={i} />)}</div>
    </motion.section>
    <ResultsTabs result={result} />
    <motion.section className="results-bottom" variants={rise}><p>{result.disclaimer}</p><div><Link to="/analyze" className="button button-dark">ANALYZE ANOTHER RESUME <ArrowRight size={15} /></Link><Link to="/" className="text-link">BACK TO HOME <ArrowUpRight size={14} /></Link></div></motion.section>
  </motion.div></SiteLayout>;
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
