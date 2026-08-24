/**
 * Medora style reminder — cobalt-and-aqua clinical search, clean white data surfaces,
 * and the supplied magnifier-and-M identity as the signature motif.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import logoMark from "../assets/logo.jpeg";
import nameMark from "../assets/name.jpeg";
import "../medora.css";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Github,
  HeartPulse,
  Info,
  LifeBuoy,
  Loader2,
  Pill,
  Search,
  ShieldAlert,
  Siren,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiLinker } from "../api-linker.js";

type MedoMedicine = {
  name: string;
  category: string;
  purpose: string;
  dosage: string;
  warnings: string[];
  interactions: string[];
};

type MedoResponse = {
  condition: string;
  summary: string;
  severity: "mild" | "moderate" | "severe" | "urgent";
  selfCare: string[];
  medicines: MedoMedicine[];
  whenToSeekHelp: string[];
  redFlags: string[];
  disclaimer: string;
  agent: {
    name: string;
    createdBy: string;
    createdOn: string;
    speciality: string;
  };
};

type SearchType = "symptom" | "illness" | "medicine";

type SearchResult = {
  title: string;
  normalized?: string;
  eyebrow: string;
  description: string;
  type: SearchType;
  source: string;
  reviewDate: string;
  activeIngredient?: string;
};

const typeOptions: Array<{ value: SearchType; label: string; icon: typeof HeartPulse }> = [
  { value: "symptom", label: "Symptom", icon: HeartPulse },
  { value: "illness", label: "Illness", icon: Stethoscope },
  { value: "medicine", label: "Medicine", icon: Pill },
];

const examples: Array<{ label: string; query: string; type: SearchType }> = [
  { label: "Fever", query: "fever", type: "symptom" },
  { label: "Headache", query: "headache", type: "symptom" },
  { label: "Common cold", query: "common cold", type: "illness" },
  { label: "Ibuprofen", query: "ibuprofen", type: "medicine" },
];

const emergencyTerms = [
  "chest pain",
  "difficulty breathing",
  "cant breathe",
  "can’t breathe",
  "severe bleeding",
  "unconscious",
  "poison",
  "overdose",
];

const resultLibrary: Record<string, SearchResult> = {
  fever: {
    title: "Fever",
    eyebrow: "Symptom overview",
    description:
      "Fever can occur with many conditions. This guide helps you identify when a pharmacist, clinician, or urgent service may be the right next step.",
    type: "symptom",
    source: "MedlinePlus health topics",
    reviewDate: "Reviewed 14 Aug 2026",
  },
  headache: {
    title: "Headache",
    eyebrow: "Symptom overview",
    description:
      "Headache is a common symptom with many possible causes. Medora does not diagnose the cause; it helps you notice safety questions and appropriate follow-up.",
    type: "symptom",
    source: "MedlinePlus health topics",
    reviewDate: "Reviewed 14 Aug 2026",
  },
  "common cold": {
    title: "Common cold",
    eyebrow: "Illness information",
    description:
      "Read a plain-language overview, useful questions for a pharmacist, and warning signs that may need clinical care. This content does not confirm a diagnosis.",
    type: "illness",
    source: "NHS & MedlinePlus sources",
    reviewDate: "Reviewed 12 Aug 2026",
  },
  ibuprofen: {
    title: "Ibuprofen",
    eyebrow: "Medicine information",
    description:
      "A nonsteroidal anti-inflammatory medicine. Read the active ingredient, warnings, interaction prompts, and label guidance before deciding whether to speak with a pharmacist.",
    type: "medicine",
    source: "FDA medicine information",
    reviewDate: "Reviewed 20 Aug 2026",
    activeIngredient: "Ibuprofen",
  },
  advil: {
    title: "Ibuprofen",
    normalized: "Advil is a brand name. Showing ibuprofen information.",
    eyebrow: "Medicine information",
    description:
      "A nonsteroidal anti-inflammatory medicine. Review active ingredient and safety information with a pharmacist or the product label.",
    type: "medicine",
    source: "FDA medicine information",
    reviewDate: "Reviewed 20 Aug 2026",
    activeIngredient: "Ibuprofen",
  },
  paracetamol: {
    title: "Acetaminophen (paracetamol)",
    eyebrow: "Medicine information",
    description:
      "A medicine commonly used for pain or fever information. Active ingredients should be checked carefully so that combination products are not duplicated.",
    type: "medicine",
    source: "FDA medicine information",
    reviewDate: "Reviewed 19 Aug 2026",
    activeIngredient: "Acetaminophen / paracetamol",
  },
  acetaminophen: {
    title: "Acetaminophen (paracetamol)",
    eyebrow: "Medicine information",
    description:
      "A medicine commonly used for pain or fever information. Active ingredients should be checked carefully so that combination products are not duplicated.",
    type: "medicine",
    source: "FDA medicine information",
    reviewDate: "Reviewed 19 Aug 2026",
    activeIngredient: "Acetaminophen / paracetamol",
  },
};

const stepItems = [
  {
    icon: Search,
    number: "01",
    title: "Search what you know",
    text: "Start with a symptom, an illness name, or a medicine. Everyday language is welcome.",
  },
  {
    icon: ShieldAlert,
    number: "02",
    title: "Check the safety context",
    text: "We ask only the questions that can change what a safe next step looks like.",
  },
  {
    icon: ArrowRight,
    number: "03",
    title: "Choose the next step",
    text: "Read sourced information, speak with a pharmacist, or get urgent support when needed.",
  },
];

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function Home() {
  const [searchType, setSearchType] = useState<SearchType>("symptom");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [ageBand, setAgeBand] = useState<string | null>(null);
  const [viewer, setViewer] = useState<"me" | "someone">("me");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [medo, setMedo] = useState<MedoResponse | null>(null);
  const [medoLoading, setMedoLoading] = useState(false);
  const [medoError, setMedoError] = useState<string | null>(null);
  const [medoRenderKey, setMedoRenderKey] = useState(0);
  const searchSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setWelcomeOpen(true);
  }, []);

  const normalizedQuery = useMemo(() => normalizeQuery(submittedQuery), [submittedQuery]);
  const isEmergency = emergencyTerms.some((term) => normalizedQuery.includes(term));
  const result = resultLibrary[normalizedQuery];
  const placeholder =
    searchType === "symptom"
      ? "Try “fever” or “headache”"
      : searchType === "illness"
        ? "Try “common cold”"
        : "Try “ibuprofen” or “paracetamol”";

  function scrollToSearch() {
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submitSearch(nextQuery?: string, nextType?: SearchType) {
    const value = (nextQuery ?? query).trim();
    if (!value) {
      toast.error("Enter a symptom, illness, or medicine to begin.");
      return;
    }
    const kind = (nextType ?? searchType) as SearchType;
    setSubmittedQuery(value);
    setSearchType(kind);
    setHasSearched(true);
    setMedo(null);
    setMedoError(null);
    setMedoRenderKey((k) => k + 1);

    await fetchMedo(value, kind, viewer, ageBand);

    window.setTimeout(() => {
      document.getElementById("search-result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  }

  async function fetchMedo(
    value: string,
    kind: SearchType,
    viewerValue: "me" | "someone",
    age: string | null,
  ) {
    setMedoLoading(true);
    try {
      const data = await apiLinker.consultMedo({
        symptoms: value,
        searchType: kind,
        viewer: viewerValue,
        ageBand: age || "Not specified",
      });
      setMedo(data.response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error reaching Medo.";
      setMedoError(msg);
      toast.error(msg);
    } finally {
      setMedoLoading(false);
    }
  }

  function renderMedoPanel() {
    if (medoLoading) {
      return (
        <div className="medo-panel medo-loading" key={`medo-load-${medoRenderKey}`} aria-live="polite">
          <Loader2 size={18} className="medo-spin" aria-hidden="true" />
          <p>Medo is reviewing the symptoms<span className="medo-dots" /></p>
        </div>
      );
    }
    if (medoError) {
      return (
        <div className="medo-panel medo-error" key={`medo-err-${medoRenderKey}`} role="alert">
          <ShieldAlert size={18} aria-hidden="true" />
          <div>
            <p className="medo-title">Medo is unavailable</p>
            <p>{medoError}</p>
          </div>
        </div>
      );
    }
    if (!medo) return null;

    return (
      <div className="medo-panel" key={`medo-${medoRenderKey}`} aria-live="polite">
        <div className="medo-panel-head">
          <div className="medo-badge">
            <Stethoscope size={16} aria-hidden="true" />
            <span>Medo · {medo.agent.speciality}</span>
          </div>
          <span className={`medo-severity medo-severity-${medo.severity}`}>{medo.severity.toUpperCase()}</span>
        </div>
        <h4 className="medo-condition">{medo.condition}</h4>
        <p className="medo-summary">{medo.summary}</p>

        {medo.selfCare.length > 0 && (
          <section className="medo-block">
            <h5>Self care</h5>
            <ul>{medo.selfCare.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        )}

        {medo.medicines.length > 0 && (
          <section className="medo-block">
            <h5><Pill size={15} aria-hidden="true" /> Suggested medicines</h5>
            <div className="medo-medicine-grid">
              {medo.medicines.map((m) => (
                <article className="medo-medicine-card" key={`${m.name}-${m.category}-${medoRenderKey}`}>
                  <header>
                    <span className="medo-medicine-name">{m.name}</span>
                    <span className="medo-medicine-category">{m.category}</span>
                  </header>
                  <p><b>Purpose:</b> {m.purpose}</p>
                  <p><b>Typical adult dose:</b> {m.dosage}</p>
                  {m.warnings.length > 0 && (
                    <p className="medo-medicine-text"><b>Warnings:</b> <span className="medo-chip-list">{m.warnings.map((w) => <span key={w} className="medo-chip">{w}</span>)}</span></p>
                  )}
                  {m.interactions.length > 0 && (
                    <p className="medo-medicine-text"><b>Interactions:</b> <span className="medo-chip-list">{m.interactions.map((i) => <span key={i} className="medo-chip">{i}</span>)}</span></p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {medo.whenToSeekHelp.length > 0 && (
          <section className="medo-block">
            <h5>When to seek help</h5>
            <ul>{medo.whenToSeekHelp.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        )}

        {medo.redFlags.length > 0 && (
          <section className="medo-block medo-redflags">
            <h5><Siren size={15} aria-hidden="true" /> Red flags</h5>
            <ul>{medo.redFlags.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        )}

        <footer className="medo-footer">
          <span>Created by {medo.agent.createdBy} · {medo.agent.createdOn}</span>
          <p>{medo.disclaimer}</p>
        </footer>
      </div>
    );
  }

  function chooseExample(item: (typeof examples)[number]) {
    setSearchType(item.type);
    setQuery(item.query);
    submitSearch(item.query, item.type);
  }

  function showUnavailableFeature(name: string) {
    toast.message(`${name} is an unavailable action in this release.`, {
      description: "The live product would connect you with configured local services.",
    });
  }

  return (
    <div className="caresearch-shell">
      <div className="ledger-rail" aria-hidden="true">
        <span>MEDORA / HEALTH SEARCH REFERENCE</span>
        <i />
        <span>V1.0 / US RELEASE</span>
      </div>

      <header className="site-header">
        <a className="brand-lockup medora-brand" href="#top" aria-label="Medora home">
          <img src={nameMark} alt="" />
          <span className="sr-only"></span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#medicine-info">Medicine information</a>
          <a href="#sources">Our sources</a>
        </nav>
        <div className="header-actions">
          <button className="language-button" type="button" onClick={() => showUnavailableFeature("Language selection")}>
            EN <ChevronDown size={14} aria-hidden="true" />
          </button>
          <button className="header-help" type="button" onClick={() => showUnavailableFeature("Help centre")}>
            <CircleHelp size={17} aria-hidden="true" /> <span>Help</span>
          </button>
          <button className="mobile-menu-button" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={22} /> : <span className="menu-lines" />}
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#medicine-info" onClick={() => setMenuOpen(false)}>Medicine information</a>
            <a href="#sources" onClick={() => setMenuOpen(false)}>Our sources</a>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Health information, carefully sourced</p>
            <h1 id="hero-title">Start with what<br /><em>you’re noticing.</em></h1>
            <p className="hero-intro">
              Search a symptom, an illness, or a medicine. We’ll help you find credible information and choose a safe next step.
            </p>
            <div className="hero-ledger-stamp" aria-label="Medora content details">
              <span>US RELEASE</span>
              <span>CLINICAL REVIEW REQUIRED</span>
              <span>REFERENCE V1.0</span>
            </div>
            <button className="primary-button" type="button" onClick={scrollToSearch}>
              Search health information <ArrowRight size={18} aria-hidden="true" />
            </button>
            <p className="hero-note"><Info size={15} aria-hidden="true" /> Medora does not diagnose or prescribe.</p>
          </div>
          <div className="hero-art medora-hero-art" aria-label="Medora clinical search reference illustration">
            <span className="medora-lens-ring ring-one" aria-hidden="true" />
            <span className="medora-lens-ring ring-two" aria-hidden="true" />
            <div className="hero-clinical-card">
              <div className="clinical-card-topline"><span>MEDORA SEARCH INDEX</span><span>V1.0</span></div>
              <img src={logoMark} alt="Medora magnifier and M mark" />
              <div className="clinical-card-meta"><b>Search. Find. Feel Better.</b><span>Symptom · Illness · Medicine</span></div>
            </div>
            <div className="orbit-note orbit-note-one">Reviewed content</div>
            <div className="orbit-note orbit-note-two">Clinical search</div>
          </div>
        </section>

        <section className="emergency-banner" aria-label="Emergency notice">
          <div className="emergency-banner-icon"><Siren size={20} aria-hidden="true" /></div>
          <p><strong>Is this an emergency?</strong> If you have severe symptoms, sudden worsening, or feel unsafe, contact local emergency services now.</p>
          <button type="button" onClick={() => showUnavailableFeature("Local emergency services")}>Emergency help <ArrowUpRight size={16} aria-hidden="true" /></button>
        </section>

        <section ref={searchSectionRef} className="search-section" id="search" aria-labelledby="search-title">
          <div className="section-intro-grid">
            <div>
              <p className="eyebrow"><span /> FIND INFORMATION</p>
              <h2 id="search-title">One search.<br />A more considered <em>next step.</em></h2>
            </div>
            <p>
              Tell us what you know. We will show only educational information, with safety questions when they matter.
            </p>
          </div>

          <div className="search-workspace">
            <div className="search-card">
              <div className="search-card-topline">
                <p>WHAT ARE YOU LOOKING UP?</p>
                <span>US RELEASE · V1.0</span>
              </div>
              <div className="type-tabs" role="tablist" aria-label="Choose search type">
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      className={searchType === option.value ? "type-tab active" : "type-tab"}
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={searchType === option.value}
                      onClick={() => setSearchType(option.value)}
                    >
                      <Icon size={18} aria-hidden="true" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <form className="search-form" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
                <Search size={22} aria-hidden="true" />
                <input
                  aria-label={`Search by ${searchType}`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={placeholder}
                />
                <button type="submit" aria-label="Search"><ArrowRight size={21} /></button>
              </form>
              <div className="example-row">
                <span>TRY AN EXAMPLE</span>
                {examples.map((item) => (
                  <button type="button" key={item.label} onClick={() => chooseExample(item)}>{item.label}</button>
                ))}
              </div>
              <p className="disclaimer"><ShieldAlert size={15} aria-hidden="true" /> Results are for general information. They do not confirm a condition or replace a healthcare professional.</p>
            </div>
            <aside className="search-support-card">
              <div className="support-icon"><ClipboardCheck size={21} aria-hidden="true" /></div>
              <p className="eyebrow"><span /> OUR APPROACH</p>
              <h3>Safety before suggestions.</h3>
              <p>We show source details, active ingredients, and questions that may affect your next step.</p>
              <div className="support-ledger-stamp"><span>SCOPE</span><b>Educational information</b><span>JURISDICTION</span><b>US release</b></div>
              <a href="#how-it-works">See how results work <ArrowRight size={15} aria-hidden="true" /></a>
            </aside>
          </div>

          {hasSearched && (
            <div id="search-result" className="result-area" aria-live="polite">
              {isEmergency ? (
                <div className="urgent-result">
                  <div className="urgent-result-copy">
                    <p className="eyebrow"><span /> STOP AND GET HELP</p>
                    <h3>This may need urgent care.</h3>
                    <p>Your search included a term that can be serious. Medora cannot assess urgency from a search alone. Please contact local emergency services now, or an urgent-care service if that is the safer local option.</p>
                    <div className="urgent-actions">
                      <button className="signal-button" type="button" onClick={() => showUnavailableFeature("Emergency assistance")}>Find urgent help <ArrowUpRight size={17} /></button>
                      <button className="text-button" type="button" onClick={() => { setQuery(""); setSubmittedQuery(""); setHasSearched(false); }}>Start a new search</button>
                    </div>
                  </div>
                  <div className="urgent-visual" aria-hidden="true">
                    <img src={logoMark} alt="" />
                  </div>
                </div>
              ) : result ? (
                <div className="normal-result">
                  <div className="result-summary">
                    <div className="result-status"><Check size={14} aria-hidden="true" /> EDUCATIONAL RESULT</div>
                    <p className="eyebrow"><span /> {result.eyebrow}</p>
                    <h3>{result.title}</h3>
                    {result.normalized && <p className="normalization-note"><Sparkles size={15} aria-hidden="true" /> {result.normalized}</p>}
                    <p>{result.description}</p>
                    <div className="source-stamp">
                      <BookOpen size={16} aria-hidden="true" />
                      <span><b>{result.source}</b>{result.reviewDate} · US release</span>
                      <ExternalLink size={15} aria-hidden="true" />
                    </div>
                  </div>
                  <div className="result-guidance">
                    <div className="guidance-heading"><p>SAFETY CONTEXT</p><span>STEP 1 OF 1</span></div>
                    <h4>A few details can change what is safe to show.</h4>
                    <div className="context-group">
                      <p>Who is this information for?</p>
                      <div className="choice-row">
                        <button className={viewer === "me" ? "choice-chip selected" : "choice-chip"} type="button" onClick={() => setViewer("me")}>Me</button>
                        <button className={viewer === "someone" ? "choice-chip selected" : "choice-chip"} type="button" onClick={() => setViewer("someone")}>Someone else</button>
                      </div>
                    </div>
                    <div className="context-group">
                      <p>Age range</p>
                      <div className="choice-row age-row">
                        {['Under 12', '12–17', '18–64', '65+'].map((age) => (
                          <button className={ageBand === age ? "choice-chip selected" : "choice-chip"} type="button" key={age} onClick={() => setAgeBand(age)}>{age}</button>
                        ))}
                      </div>
                    </div>
                    {result.activeIngredient && (
                      <div className="ingredient-strip">
                        <Pill size={18} aria-hidden="true" />
                        <span><b>Active ingredient</b>{result.activeIngredient}</span>
                      </div>
                    )}
                    <button className="secondary-button" type="button" onClick={() => {
                      if (submittedQuery) fetchMedo(submittedQuery, searchType, viewer, ageBand);
                    }}>Update information<ArrowRight size={16} /></button>
                    <p className="guidance-fineprint">If you are unsure about age, pregnancy, allergies, conditions, or other medicines, speak with a pharmacist before using a medicine.</p>
                  </div>
                  {renderMedoPanel()}
                </div>
              ) : (
                <div className="fallback-result">
                  <div className="fallback-icon"><LifeBuoy size={22} aria-hidden="true" /></div>
                  <div>
                    <p className="eyebrow"><span /> WE COULDN’T CONFIRM A MATCH</p>
                    <h3>Let’s keep this careful.</h3>
                    <p>We do not have reviewed information for “{submittedQuery}” in this release. Medo, our AI doctor, can still offer educational guidance below.</p>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => showUnavailableFeature("Pharmacist support")}>Talk to a pharmacist <ArrowRight size={16} /></button>
                  {renderMedoPanel()}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="how-section" id="how-it-works" aria-labelledby="how-title">
          <div className="how-heading">
            <div>
              <p className="eyebrow"><span /> HOW MEDORA WORKS</p>
              <h2 id="how-title">Built to slow down<br />the <em>wrong assumptions.</em></h2>
            </div>
            <div className="copy-with-ledger">
              <p>Medora puts a clear action before a long list of information. When your answer could change the safety context, we ask. When it cannot, we do not.</p>
              <div className="section-ledger-stamp"><span>ROUTING STANDARD</span><b>Safety first</b><span>ACCOUNT</span><b>Not required</b></div>
            </div>
          </div>
          <div className="steps-grid">
            {stepItems.map((item) => {
              const Icon = item.icon;
              return (
                <article className="step-card" key={item.number}>
                  <div className="step-top"><span>{item.number}</span><Icon size={21} aria-hidden="true" /></div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="medicine-section" id="medicine-info" aria-labelledby="medicine-title">
          <div className="medicine-illustration">
            <div className="image-card">
              <img src={logoMark} alt="Medora magnifier and M mark" />
            </div>
            <div className="active-ingredient-note"><Pill size={18} /><span><b>Always check</b>active ingredient</span></div>
          </div>
          <div className="medicine-copy">
            <p className="eyebrow"><span /> MEDICINE INFORMATION</p>
            <h2 id="medicine-title">The label is part of the <em>answer.</em></h2>
            <p>Medicine pages bring together the information that is easy to miss in a quick web search: the active ingredient, interaction prompts, key warnings, and when to ask a pharmacist.</p>
            <div className="section-ledger-stamp medicine-ledger"><span>CONTENT STATUS</span><b>Reference only</b><span>LABEL CHECK</span><b>Always required</b></div>
            <div className="medicine-points">
              <div><span>01</span><p><b>Active ingredients, clearly named.</b> Brand names never hide what is in the product.</p></div>
              <div><span>02</span><p><b>Safety information, before options.</b> Review common cautions before considering a product.</p></div>
              <div><span>03</span><p><b>Sources you can inspect.</b> Every educational page identifies its source and review date.</p></div>
            </div>
            <button className="text-link-button" type="button" onClick={() => chooseExample(examples[3])}>Explore a medicine example <ArrowRight size={17} /></button>
          </div>
        </section>

        <section className="sources-section" id="sources" aria-labelledby="sources-title">
          <div className="sources-heading">
            <p className="eyebrow"><span /> SOURCE TRANSPARENCY</p>
            <h2 id="sources-title">You should be able to see where information comes from.</h2>
          </div>
          <div className="source-list">
            <article><span>01</span><div><h3>Reviewed clinical content</h3><p>All educational material is intended for review by qualified clinicians and pharmacists before publication.</p></div><FileText size={20} aria-hidden="true" /></article>
            <article><span>02</span><div><h3>Jurisdiction-aware guidance</h3><p>This interface is configured for the US release. Medicines, emergency numbers, and care pathways must be configured country by country.</p></div><FileText size={20} aria-hidden="true" /></article>
            <article><span>03</span><div><h3>Visible review dates</h3><p>Every clinical page carries its source, location, reviewer, and review date rather than hiding it in a footer.</p></div><FileText size={20} aria-hidden="true" /></article>
          </div>
        </section>

        <section className="closing-panel" aria-labelledby="closing-title">
          <div>
            <p className="eyebrow"><span /> WHEN YOU’RE NOT SURE</p>
            <h2 id="closing-title">A pharmacist is a good next conversation.</h2>
          </div>
          <div className="copy-with-ledger">
            <p>They can help you read a label, check a potential interaction, and decide whether a symptom needs medical attention.</p>
            <div className="section-ledger-stamp"><span>NEAREST STEP</span><b>Speak with a pharmacist</b><span>NOT A PRESCRIPTION SERVICE</span></div>
          </div>
          <button className="primary-button" type="button" onClick={() => showUnavailableFeature("Pharmacist guidance")}>Find a pharmacist <ArrowUpRight size={18} /></button>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <a className="brand-lockup medora-brand footer-brand" href="#top" aria-label="Medora home">
            <img src={nameMark} alt="Medora — Search. Find. Feel Better." />
            <span className="sr-only">Medora</span>
          </a>
          <p>Health information to help you choose a more considered next step.</p>
        </div>
        <div className="footer-links">
          <a href="#how-it-works">How it works</a>
          <a href="#medicine-info">Medicine information</a>
          <a href="#sources">Our sources</a>
          <button type="button" onClick={() => setFeedbackOpen(true)}>Report a concern</button>
        </div>
        <p className="footer-disclaimer">Medora provides educational information. It does not diagnose, prescribe, or replace emergency services, a doctor, nurse, or pharmacist.</p>
      </footer>

      {feedbackOpen && (
        <div className="feedback-backdrop" role="presentation" onMouseDown={() => setFeedbackOpen(false)}>
          <section className="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="dialog-close" type="button" aria-label="Close report a concern dialog" onClick={() => setFeedbackOpen(false)}><X size={20} /></button>
            <p className="eyebrow"><span /> REPORT A CONCERN</p>
            <h2 id="feedback-title">Help keep the information careful.</h2>
            <p>In the live product, this form would securely route the page version and your concern to a clinical review team. Please do not include urgent symptoms here.</p>
            <textarea aria-label="Describe your concern" placeholder="Describe the page or information that concerns you…" />
            <button className="primary-button" type="button" onClick={() => { setFeedbackOpen(false); toast.success("Concern noted for review."); }}>Send report <ArrowRight size={17} /></button>
          </section>
        </div>
      )}

      {welcomeOpen && (
        <div className="dev-credit-backdrop" role="presentation" onMouseDown={() => setWelcomeOpen(false)}>
          <section
            className="dev-credit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dev-credit-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dev-credit-topline">
              <span className="dev-credit-dot" aria-hidden="true" />
              <span>WELCOME</span>
              <span>V1.0 · US RELEASE</span>
            </div>
            <p className="eyebrow dev-credit-eyebrow"><span /> A NOTE BEFORE YOU SEARCH</p>
            <h2 id="dev-credit-title">
              This website has been<br />developed by <span className="dev-credit-name">Yash Mali</span>.
            </h2>
            <p className="dev-credit-copy">
              Medora is an educational health search reference. It is built to help you find credible information
              and choose a more considered next step — not to diagnose or replace a clinician.
            </p>
            <div className="dev-credit-stamp">
              <span>DEVELOPER</span>
              <b>Yash Mali</b>
              <span>EDITION</span>
              <b>Medora V1.0</b>
            </div>
            <div className="dev-credit-actions">
              <a
                href="https://github.com/yashmali26b-code/medora.git"
                target="_blank"
                rel="noopener noreferrer"
                className="dev-credit-github-btn"
              >
                <Github size={17} aria-hidden="true" />
                <span>Contribute on GitHub</span>
                <ArrowUpRight size={15} className="dev-credit-ext" aria-hidden="true" />
              </a>
              <button
                className="primary-button dev-credit-cta"
                type="button"
                onClick={() => setWelcomeOpen(false)}
              >
                Got it, continue <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
