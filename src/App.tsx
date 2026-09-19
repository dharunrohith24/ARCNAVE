import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDot,
  Database,
  Gauge,
  Menu,
  Orbit,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties, FormEvent } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalytics, getCandidates, predict } from "./services/api";
import type { Analytics, Candidate, Observation, Prediction } from "./types";

const fields = [
  { key: "koi_period", label: "Orbital period", unit: "days", placeholder: "9.488", hint: "Time for one orbit" },
  { key: "koi_time0bk", label: "Transit reference time", unit: "BKJD", placeholder: "170.539", hint: "Transit epoch" },
  { key: "koi_duration", label: "Transit duration", unit: "hours", placeholder: "2.953", hint: "Length of transit signal" },
  { key: "koi_depth", label: "Transit depth", unit: "ppm", placeholder: "615.8", hint: "Signal depth in parts per million" },
  { key: "koi_prad", label: "Planet radius", unit: "Earth radii", placeholder: "2.26", hint: "Estimated planetary radius" },
  { key: "koi_model_snr", label: "Model signal-to-noise", unit: "SNR", placeholder: "35.8", hint: "Transit signal-to-noise ratio" },
  { key: "koi_steff", label: "Stellar temperature", unit: "K", placeholder: "5455", hint: "Effective temperature of host star" },
  { key: "koi_srad", label: "Stellar radius", unit: "Solar radii", placeholder: "0.927", hint: "Radius of host star" },
  { key: "koi_kepmag", label: "Kepler magnitude", unit: "mag", placeholder: "15.347", hint: "Brightness in Kepler band" },
] as const;

const initialObservation: Observation = {
  koi_period: "",
  koi_time0bk: "",
  koi_duration: "",
  koi_depth: "",
  koi_prad: "",
  koi_model_snr: "",
  koi_steff: "",
  koi_srad: "",
  koi_kepmag: "",
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function formatNumber(value: number | undefined) {
  return value === undefined ? "—" : value.toLocaleString("en-US");
}

function ProbabilityGauge({ value, small = false }: { value: number; small?: boolean }) {
  const percent = Math.round(value * 1000) / 10;
  return (
    <div className={`gauge ${small ? "gauge-small" : ""}`} style={{ "--gauge": `${value * 360}deg` } as CSSProperties}>
      <div className="gauge-inner">
        <strong>{percent}%</strong>
        {!small && <span>CONFIDENCE</span>}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="brand" aria-label="ARCNAVE home">
      <span className="brand-mark"><Orbit size={22} strokeWidth={1.6} /><i /></span>
      <span><b>ARCNAVE</b><small>EXOPLANET INTELLIGENCE</small></span>
    </div>
  );
}

function Navbar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (value: boolean) => void }) {
  const links = [
    ["mission", "Mission"],
    ["predictor", "AI Predictor"],
    ["explorer", "Candidate Explorer"],
    ["analytics", "Analytics"],
    ["about", "About"],
  ];
  return (
    <header className="navbar">
      <div className="nav-inner">
        <button className="logo-button" onClick={() => scrollTo("mission")}><Logo /></button>
        <nav className={mobileOpen ? "nav-links nav-open" : "nav-links"} aria-label="Primary navigation">
          {links.map(([id, label]) => (
            <button key={id} onClick={() => { scrollTo(id); setMobileOpen(false); }}>{label}</button>
          ))}
        </nav>
        <button className="nav-cta" onClick={() => scrollTo("predictor")}>Launch analysis <ArrowRight size={15} /></button>
        <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function SpaceVisual() {
  return (
    <div className="space-visual" aria-label="Orbital visualization">
      <div className="visual-coordinate coord-a">RA 19h 34m 22s</div>
      <div className="visual-coordinate coord-b">DEC +42° 18′ 07″</div>
      <div className="visual-coordinate coord-c">SIGNAL / 0.8933</div>
      <div className="visual-crosshair"><span /><span /></div>
      <div className="orbit orbit-one"><i /></div>
      <div className="orbit orbit-two"><i /></div>
      <div className="orbit orbit-three"><i /></div>
      <div className="star-core"><span /></div>
      <div className="planet"><div className="planet-glow" /></div>
      <div className="signal-line signal-one" /><div className="signal-line signal-two" />
      {Array.from({ length: 18 }).map((_, index) => <span key={index} className={`visual-star star-${index}`} />)}
      <div className="visual-caption"><Radar size={14} /><span>LIVE OBSERVATION FEED</span><em>●</em></div>
    </div>
  );
}

function MissionStats({ analytics }: { analytics: Analytics | null }) {
  const stats = [
    ["01", formatNumber(analytics?.total_observations), "KEPLER OBSERVATIONS"],
    ["02", formatNumber(analytics?.disposition?.CONFIRMED), "CONFIRMED RECORDS"],
    ["03", formatNumber(analytics?.disposition?.["FALSE POSITIVE"]), "FALSE POSITIVE"],
    ["04", formatNumber(analytics?.disposition?.CANDIDATE), "CANDIDATE RECORDS"],
  ];
  return <div className="mission-stats">{stats.map(([index, value, label]) => <div className="mission-stat" key={label}><small>{index}</small><strong>{value}</strong><span>{label}</span></div>)}</div>;
}

function Hero({ analytics }: { analytics: Analytics | null }) {
  return (
    <section className="hero section-shell" id="mission">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> ARCNAVE / EXOPLANET INTELLIGENCE</div>
        <h1>SEARCH THE SKY.<br /><span>FIND THE SIGNAL.</span></h1>
        <p className="hero-lede">Explore Kepler observations and analyze planetary candidates using machine learning built for the next generation of discovery.</p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={() => scrollTo("predictor")}>Start AI analysis <ArrowRight size={17} /></button>
          <button className="button button-ghost" onClick={() => scrollTo("explorer")}>Explore candidates <ArrowDownRight size={17} /></button>
        </div>
        <div className="hero-footnote"><span><ShieldCheck size={14} /> MODEL LINK SECURE</span><span><Database size={14} /> NASA / KEPLER KOI DATA</span></div>
      </div>
      <SpaceVisual />
      <MissionStats analytics={analytics} />
    </section>
  );
}

function Pipeline() {
  const steps = [["01", "OBSERVE", "Collect the light curve"], ["02", "EXTRACT", "Read the transit signal"], ["03", "ANALYZE", "Compare learned patterns"], ["04", "CLASSIFY", "Return model prediction"]];
  return <section className="pipeline section-shell">
    <div className="section-heading"><div><div className="eyebrow">THE ARCNAVE METHOD</div><h2>FROM SIGNAL <span>TO CLASSIFICATION</span></h2></div><p>ARCNAVE processes observational parameters and sends them through the existing machine-learning classification pipeline.</p></div>
    <div className="pipeline-grid">{steps.map(([number, title, copy], i) => <div className="pipeline-step" key={number}><div className="pipeline-number">{number}</div><div className="pipeline-icon"><span>{i === 0 ? <Radar /> : i === 1 ? <Activity /> : i === 2 ? <Gauge /> : <Sparkles />}</span></div><h3>{title}</h3><p>{copy}</p>{i < steps.length - 1 && <ArrowRight className="pipeline-arrow" />}</div>)}</div>
  </section>;
}

function ParameterInput({ field, value, onChange, error }: { field: typeof fields[number]; value: string; onChange: (value: string) => void; error?: string }) {
  return <label className="parameter-field">
    <span className="parameter-label"><span>{field.label}</span><em>{field.unit}</em></span>
    <span className={error ? "input-wrap input-error" : "input-wrap"}><input aria-label={`${field.label} in ${field.unit}`} inputMode="decimal" value={value} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /><span>{field.unit}</span></span>
    <small><CircleDot size={11} /> {field.key} · {field.hint}{error && <b>{error}</b>}</small>
  </label>;
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="empty-state"><CircleAlert size={23} /><strong>{title}</strong><p>{detail}</p>{action}</div>;
}

function PredictionResult({ result, observation }: { result: Prediction; observation: Observation }) {
  const confirmed = result.prediction === "CONFIRMED";
  return <div className={`result-panel ${confirmed ? "result-confirmed" : "result-false"}`}>
    <div className="result-topline"><span className="status-pill"><span /> AI CLASSIFICATION</span><span>MODEL OUTPUT / 01</span></div>
    <div className="result-main">
      <div><small>MODEL PREDICTION</small><h3>{result.prediction}</h3><p>{confirmed ? "The model found a classification pattern consistent with confirmed training examples." : "The model found a classification pattern consistent with false-positive training examples."}</p></div>
      <ProbabilityGauge value={result.confirmed_probability} />
    </div>
    <div className="result-metrics"><div><span>MODEL</span><strong>ARCNAVE RANDOM FOREST</strong></div><div><span>CLASSIFICATION</span><strong>{result.prediction}</strong></div><div><span>FALSE POSITIVE PROBABILITY</span><strong>{(result.false_positive_probability * 100).toFixed(1)}%</strong></div></div>
    <div className="result-observation"><div className="mini-heading">OBSERVATION PARAMETERS</div><div className="observation-grid">{fields.map((field) => <div key={field.key}><span>{field.label}</span><strong>{observation[field.key]} <i>{field.unit}</i></strong></div>)}</div></div>
    <div className="responsible-note"><ShieldCheck size={15} /> AI classification for research and demonstration purposes. This model prediction is not independent astronomical confirmation.</div>
  </div>;
}

function Predictor() {
  const [observation, setObservation] = useState<Observation>(initialObservation);
  const [result, setResult] = useState<Prediction | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (observation[field.key].trim() === "" || !Number.isFinite(Number(observation[field.key]))) nextErrors[field.key] = "Enter a valid number";
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true); setError(""); setResult(null);
    try { setResult(await predict(observation)); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "ANALYSIS INTERRUPTED"); } finally { setLoading(false); }
  }
  return <section className="predictor section-shell" id="predictor">
    <div className="section-heading predictor-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> LIVE MODEL INTERFACE</div><h2>AI EXOPLANET <span>PREDICTOR</span></h2></div><p>Submit observational parameters to the ARCNAVE classification model.</p></div>
    <div className="predictor-layout">
      <form className="input-panel glass-panel" onSubmit={handleSubmit} noValidate>
        <div className="panel-title"><div><span className="panel-index">01</span><div><h3>OBSERVATION INPUT</h3><p>Nine model features · raw values</p></div></div><span className="live-badge"><i /> READY</span></div>
        <div className="parameter-grid">{fields.map((field) => <ParameterInput key={field.key} field={field} value={observation[field.key]} error={errors[field.key]} onChange={(value) => { setObservation({ ...observation, [field.key]: value }); setErrors({ ...errors, [field.key]: "" }); }} />)}</div>
        {error && <div className="inline-error"><XCircle size={16} /><span><b>{error}</b><small>Check that the backend service is running and try again.</small></span></div>}
        <button className="button button-primary analyze-button" type="submit" disabled={loading}>{loading ? <><RefreshCw className="spin" size={18} /> Analyzing observation</> : <><Orbit size={18} /> Analyze candidate <ArrowRight size={16} /></>}</button>
        <p className="form-disclaimer">No values are changed or scaled before submission. Inputs follow the model's documented feature order.</p>
      </form>
      <div className="analysis-column">
        <div className="panel-title analysis-title"><div><span className="panel-index">02</span><div><h3>AI ANALYSIS</h3><p>ARCNAVE RANDOM FOREST / LIVE OUTPUT</p></div></div><span className="signal-status">{loading ? "PROCESSING" : result ? "COMPLETE" : "AWAITING SIGNAL"}</span></div>
        {loading ? <div className="analysis-wait"><div className="scan-orbit"><Orbit size={52} /><span /></div><h3>ANALYZING SIGNAL<span>...</span></h3><p>Running ARCNAVE classifier against the supplied observation.</p><div className="loading-line"><span /></div></div> : result ? <PredictionResult result={result} observation={observation} /> : <EmptyState title="AWAITING OBSERVATION" detail="Submit nine Kepler features to begin an AI classification." action={<button className="text-action" onClick={() => document.querySelector<HTMLInputElement>(".parameter-field input")?.focus()}>Focus first parameter <ArrowRight size={14} /></button>} />}
      </div>
    </div>
  </section>;
}

function CandidateDetail({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><aside className="detail-drawer" role="dialog" aria-modal="true" aria-label="Candidate detail" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={onClose} aria-label="Close candidate detail"><X /></button><div className="eyebrow">CANDIDATE DETAIL / {candidate.kepid}</div><h3>KEPLER OBJECT<br /><span>{candidate.kepid}</span></h3><div className="detail-gauge"><ProbabilityGauge value={candidate.confirmed_probability} /></div><div className="detail-rows"><div><span>ORIGINAL STATUS</span><strong>{candidate.original_status}</strong></div><div><span>AI PREDICTION</span><strong className={candidate.ai_prediction === "CONFIRMED" ? "text-cyan" : "text-violet"}>{candidate.ai_prediction}</strong></div><div><span>CONFIRMED PROBABILITY</span><strong>{(candidate.confirmed_probability * 100).toFixed(1)}%</strong></div></div><div className="detail-explanation"><Sparkles size={16} /><p>The candidate was originally labelled CANDIDATE in the supplied dataset. The ARCNAVE model assigned the displayed AI classification and probability.</p></div></aside></div>;
}

function CandidateExplorer() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [probability, setProbability] = useState("ALL");
  const [sort, setSort] = useState("probability_desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Candidate[]; total: number } | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  useEffect(() => { let active = true; getCandidates({ search, status, probability, sort, page }).then((next) => { if (active) { setData(next); setError(""); } }).catch((requestError) => active && setError(requestError instanceof Error ? requestError.message : "MISSION LINK OFFLINE")); return () => { active = false; }; }, [search, status, probability, sort, page]);
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / 10));
  return <section className="explorer section-shell" id="explorer">
    <div className="section-heading"><div><div className="eyebrow">SUPPLIED PREDICTION DATASET</div><h2>CANDIDATE <span>EXPLORER</span></h2></div><p>Search the 1,979 candidate observations and inspect how the ARCNAVE model classified each signal.</p></div>
    <div className="explorer-highlight"><div><span className="highlight-kicker">MODEL CLASSIFICATION INDEX</span><strong>490</strong><p>candidates classified as <b>CONFIRMED</b> by the ARCNAVE model.</p></div><div className="highlight-bars">{[25, 52, 38, 74, 62, 91, 68, 84, 46, 78, 58, 96].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div><div className="highlight-side"><span>MEAN CONFIRMED PROBABILITY</span><strong>29.3%</strong><small>ADAPTIVE CANDIDATE RUN</small></div></div>
    <div className="table-panel glass-panel">
      <div className="table-toolbar"><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by KEPID..." aria-label="Search by KEPID" /></label><div className="filter-group"><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by AI prediction"><option value="ALL">All classifications</option><option value="CONFIRMED">Confirmed</option><option value="FALSE POSITIVE">False positive</option></select><select value={probability} onChange={(event) => { setProbability(event.target.value); setPage(1); }} aria-label="Filter by probability"><option value="ALL">All probability</option><option value="0-25">0–25%</option><option value="25-50">25–50%</option><option value="50-75">50–75%</option><option value="75-100">75–100%</option></select><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort candidates"><option value="probability_desc">Probability: high to low</option><option value="probability_asc">Probability: low to high</option><option value="kepid">KEPID: ascending</option></select></div></div>
      {error ? <EmptyState title={error} detail="Candidate records could not be loaded from the mission link." /> : <><div className="table-scroll"><table><thead><tr><th>KEPID</th><th>ORIGINAL STATUS</th><th>AI PREDICTION</th><th>CONFIRMED PROBABILITY</th><th> </th></tr></thead><tbody>{data?.items.map((candidate) => <tr key={candidate.kepid}><td className="mono">{candidate.kepid}</td><td><span className="status-text status-candidate"><i />{candidate.original_status}</span></td><td><span className={`status-text ${candidate.ai_prediction === "CONFIRMED" ? "status-confirmed" : "status-false"}`}><i />{candidate.ai_prediction}</span></td><td><div className="probability-cell"><div className="probability-track"><span style={{ width: `${candidate.confirmed_probability * 100}%` }} /></div><b>{(candidate.confirmed_probability * 100).toFixed(1)}%</b></div></td><td><button className="view-button" onClick={() => setSelected(candidate)}>View <ArrowRight size={13} /></button></td></tr>)}</tbody></table>{data && data.items.length === 0 && <EmptyState title="NO OBSERVATIONS MATCH YOUR FILTERS" detail="Try widening the search or probability range." />}{!data && !error && <div className="table-loading"><RefreshCw className="spin" /> Loading candidate records...</div>}</div><div className="table-footer"><span>{data ? `Showing ${data.total === 0 ? 0 : (page - 1) * 10 + 1}–${Math.min(page * 10, data.total)} of ${data.total.toLocaleString()} records` : "Loading records..."}</span><div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><b>{page}</b><span>/ {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div></>}
    </div>
    {selected && <CandidateDetail candidate={selected} onClose={() => setSelected(null)} />}
  </section>;
}

function AnalyticsSection({ analytics }: { analytics: Analytics | null }) {
  const disposition = analytics ? Object.entries(analytics.disposition).map(([name, value]) => ({ name, value })) : [];
  const ai = analytics ? Object.entries(analytics.ai_classification).map(([name, value]) => ({ name, value })) : [];
  const colors = ["#67e8f9", "#8b5cf6", "#334155"];
  const metricCards: [string, number | undefined, LucideIcon][] = [
    ["TOTAL OBSERVATIONS", analytics?.total_observations, Database],
    ["CONFIRMED", analytics?.disposition?.CONFIRMED, Check],
    ["FALSE POSITIVE", analytics?.disposition?.["FALSE POSITIVE"], XCircle],
    ["CANDIDATE", analytics?.disposition?.CANDIDATE, CircleDot],
    ["AI CONFIRMED", analytics?.ai_confirmed, Sparkles],
    ["AI FALSE POSITIVE", analytics?.ai_false_positive, Activity],
  ];
  return <section className="analytics section-shell" id="analytics">
    <div className="section-heading"><div><div className="eyebrow">OBSERVATORY TELEMETRY</div><h2>MISSION <span>ANALYTICS</span></h2></div><p>Dataset-level context for the supplied Kepler observations and adaptive model run.</p></div>
    <div className="analytics-cards">{metricCards.map(([label, value, Icon]) => <div className="analytics-card" key={label}><Icon size={17} /><span>{label}</span><strong>{formatNumber(value)}</strong></div>)}</div>
    <div className="charts-grid">
      <div className="chart-card"><div className="chart-title"><div><span>01 / DATASET DISPOSITION</span><h3>Original observation labels</h3></div><BarChart3 size={18} /></div><div className="chart-body">{disposition.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={disposition} layout="vertical" margin={{ left: 18, right: 20 }}><CartesianGrid stroke="#1f2a44" horizontal={false} /><XAxis type="number" stroke="#687591" fontSize={10} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" stroke="#aab4c9" fontSize={10} tickLine={false} axisLine={false} width={105} /><Tooltip contentStyle={{ background: "#0d1425", border: "1px solid #24304a", borderRadius: 4, color: "#e6f0ff" }} cursor={{ fill: "#111b31" }} /><Bar dataKey="value" fill="#67e8f9" radius={[0, 2, 2, 0]} /></BarChart></ResponsiveContainer> : <EmptyState title="INSUFFICIENT OBSERVATION DATA" detail="Analytics are waiting for the mission link." />}</div></div>
      <div className="chart-card"><div className="chart-title"><div><span>02 / AI CLASSIFICATION</span><h3>Adaptive candidate run</h3></div><Gauge size={18} /></div><div className="chart-body donut-body">{ai.length ? <><ResponsiveContainer width="55%" height="100%"><PieChart><Pie data={ai} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={4} stroke="none">{ai.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}</Pie><Tooltip contentStyle={{ background: "#0d1425", border: "1px solid #24304a", borderRadius: 4, color: "#e6f0ff" }} /></PieChart></ResponsiveContainer><div className="chart-legend">{ai.map((entry, index) => <div key={entry.name}><i style={{ background: colors[index] }} /><span>{entry.name}</span><b>{entry.value.toLocaleString()}</b></div>)}</div></> : <EmptyState title="INSUFFICIENT OBSERVATION DATA" detail="Analytics are waiting for the mission link." />}</div></div>
      <div className="chart-card chart-wide"><div className="chart-title"><div><span>03 / CONFIRMED PROBABILITY DISTRIBUTION</span><h3>Candidate signal confidence bands</h3></div><Activity size={18} /></div><div className="chart-body">{analytics?.probability_bands.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={analytics.probability_bands} margin={{ left: 4, right: 14, top: 10 }}><defs><linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#67e8f9" stopOpacity={0.35} /><stop offset="95%" stopColor="#67e8f9" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" /><XAxis dataKey="label" stroke="#687591" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#687591" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "#0d1425", border: "1px solid #24304a", borderRadius: 4, color: "#e6f0ff" }} /><Area type="monotone" dataKey="count" stroke="#67e8f9" strokeWidth={2} fill="url(#cyanArea)" /></AreaChart></ResponsiveContainer> : <EmptyState title="INSUFFICIENT OBSERVATION DATA" detail="Analytics are waiting for the mission link." />}</div></div>
    </div>
  </section>;
}

function About() {
  return <section className="about section-shell" id="about"><div className="about-main"><div className="eyebrow">THE MISSION</div><h2>ABOUT <span>ARCNAVE</span></h2><p className="about-lede">ARCNAVE is an AI-assisted platform for exploring astronomical observations and analyzing exoplanet candidates.</p><div className="about-columns"><div><span>DATA</span><p>The project uses Kepler/KOI observations from the supplied NASA Exoplanet Archive dataset.</p></div><div><span>MODEL</span><p>The classification pipeline uses a Random Forest machine-learning classifier.</p></div><div><span>OUTPUT</span><p>CONFIRMED, FALSE POSITIVE, and a CONFIRMED probability from the existing model.</p></div></div></div><div className="feature-terminal"><div className="terminal-top"><span>MODEL FEATURES</span><span>09 / 09</span></div>{fields.map((field, index) => <div key={field.key} className="terminal-row"><i>{String(index + 1).padStart(2, "0")}</i><span>{field.key}</span><small>FLOAT</small></div>)}</div><div className="limitations"><CircleAlert size={16} /><p><b>LIMITATIONS</b> ARCNAVE provides machine-learning classifications for research and demonstration purposes. A model prediction is not equivalent to independent astronomical confirmation.</p></div></section>;
}

function Footer() {
  return <footer><div className="footer-inner"><Logo /><span>KEPLER / KOI OBSERVATORY INTERFACE</span><span>© 2026 ARCNAVE</span></div></footer>;
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  useEffect(() => { getAnalytics().then(setAnalytics).catch(() => setAnalytics(null)); }, []);
  return <div className="app"><div className="nebula nebula-one" /><div className="nebula nebula-two" /><div className="star-field" /><Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} /><main><Hero analytics={analytics} /><Pipeline /><Predictor /><CandidateExplorer /><AnalyticsSection analytics={analytics} /><About /></main><Footer /></div>;
}