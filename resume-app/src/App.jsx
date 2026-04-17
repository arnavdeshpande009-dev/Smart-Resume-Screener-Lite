import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Required: tell pdfjs where its worker lives.
// Without this, PDF parsing silently fails in many bundlers/environments.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/* ─── Inline styles (mirrors original CSS variables exactly) ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --bg: #0f0f13;
    --surface: #18181f;
    --surface2: #22222c;
    --border: #2e2e3a;
    --accent: #6ee7b7;
    --accent2: #818cf8;a
    --danger: #f87171;
    --text: #e8e8f0;
    --muted: #6b7280;
    --radius: 14px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    padding: 32px 20px 60px;
  }

  header { max-width: 1100px; margin: 0 auto 40px; }
  header h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(26px, 4vw, 40px);
    font-weight: 800;
    letter-spacing: -1px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  header p { color: var(--muted); margin-top: 4px; font-size: 15px; }

  .container { max-width: 1100px; margin: 0 auto; }

  .toast {
    position: fixed; top: 24px; right: 24px;
    background: #1a2e25; border: 1px solid var(--accent);
    color: var(--accent); padding: 12px 20px; border-radius: 10px;
    font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px;
    transform: translateX(200%); transition: transform .35s cubic-bezier(.4,0,.2,1);
    z-index: 999;
  }
  .toast.show { transform: translateX(0); }
  .toast .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }

  .toast-error {
    background: #2e1a1a; border-color: var(--danger); color: var(--danger);
  }
  .toast-error .dot { background: var(--danger); }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
  }

  .step-job {
    max-width: 720px;
    margin: 0 auto;
    animation: fadeUp .5s ease;
  }
  .step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
  .step-header .icon {
    width: 36px; height: 36px; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 8px;
    display: grid; place-items: center; font-size: 17px;
  }
  .step-header h2 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; }
  .step-header p { font-size: 13px; color: var(--muted); margin-top: 2px; }

  label { display: block; font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; margin-bottom: 8px; margin-top: 20px; }
  input[type=text], textarea {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 10px; padding: 13px 16px; color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 15px;
    outline: none; transition: border-color .2s;
  }
  input[type=text]:focus, textarea:focus { border-color: var(--accent2); }
  textarea { resize: vertical; min-height: 140px; }

  .btn-primary {
    width: 100%; margin-top: 28px;
    background: var(--text); color: #0f0f13;
    border: none; border-radius: 10px;
    padding: 14px; font-size: 15px; font-weight: 700;
    font-family: 'Syne', sans-serif;
    cursor: pointer; transition: opacity .2s, transform .1s;
  }
  .btn-primary:hover { opacity: .88; }
  .btn-primary:active { transform: scale(.98); }
  .btn-primary:disabled { opacity: .4; cursor: not-allowed; }

  .step-main { animation: fadeUp .5s ease; }
  .two-col { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
  @media(max-width:768px){ .two-col { grid-template-columns: 1fr; } }

  .sidebar .job-meta { margin-bottom: 20px; }
  .job-meta .label { font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; }
  .job-meta .title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-top: 6px; line-height: 1.4; }

  .upload-zone {
    border: 2px dashed var(--border); border-radius: 12px;
    padding: 40px 20px; text-align: center;
    cursor: pointer; transition: border-color .2s, background .2s;
    position: relative; margin-top: 16px;
  }
  .upload-zone:hover, .upload-zone.drag { border-color: var(--accent2); background: rgba(129,140,248,.06); }
  .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .upload-icon { font-size: 28px; margin-bottom: 10px; }
  .upload-zone p { font-size: 14px; font-weight: 500; }
  .upload-zone small { font-size: 12px; color: var(--muted); }

  .file-list { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
  .file-item {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 14px;
    display: flex; align-items: center; gap: 10px; font-size: 13px;
  }
  .file-item .fi { font-size: 16px; }
  .file-item .fname { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-item .rm { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; padding: 0; }
  .file-item .rm:hover { color: var(--danger); }

  .btn-analyze {
    width: 100%; margin-top: 16px;
    background: linear-gradient(135deg, var(--accent2), #a78bfa);
    color: #fff; border: none; border-radius: 10px;
    padding: 13px; font-size: 14px; font-weight: 700;
    font-family: 'Syne', sans-serif; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .2s;
  }
  .btn-analyze:hover { opacity: .88; }
  .btn-analyze:disabled { opacity: .5; cursor: not-allowed; }

  .uploaded-label { font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; margin-top: 20px; margin-bottom: 8px; }

  .results-panel { display: flex; flex-direction: column; gap: 20px; }

  .empty-state {
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 60px 20px; text-align: center; color: var(--muted);
    background: var(--surface);
  }
  .empty-state .ei { font-size: 40px; margin-bottom: 14px; opacity: .4; }
  .empty-state p { font-size: 14px; }

  .rankings-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; }
  .rankings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .rankings-header h3 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; }
  .rankings-header small { color: var(--muted); font-size: 13px; }

  .table-wrap { overflow-x: auto; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; padding: 8px 12px; border-bottom: 1px solid var(--border); }
  td { padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,.04); vertical-align: middle; }
  tr:hover td { background: rgba(255,255,255,.02); }

  .rank-badge {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--surface2); border: 1px solid var(--border);
    display: grid; place-items: center; font-size: 12px; font-weight: 700; font-family: 'Syne', sans-serif;
  }
  .rank-badge.top { background: linear-gradient(135deg, var(--accent), #34d399); color: #0f0f13; border: none; }

  .score-val { font-weight: 700; font-size: 16px; }
  .score-val.high { color: var(--accent); }
  .score-val.mid { color: #fbbf24; }
  .score-val.low { color: var(--danger); }

  .score-bar { height: 4px; border-radius: 2px; background: var(--border); margin-top: 4px; min-width: 80px; }
  .score-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--accent2), var(--accent)); transition: width .6s ease; }

  .btn-view {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 7px; padding: 6px 14px; font-size: 12px; font-weight: 600;
    color: var(--text); cursor: pointer; transition: border-color .2s, color .2s;
  }
  .btn-view:hover { border-color: var(--accent2); color: var(--accent2); }
  .btn-view.active { border-color: var(--accent2); color: var(--accent2); background: rgba(129,140,248,.1); }

  .detail-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; animation: fadeUp .3s ease; }
  .detail-card h3 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; }
  .detail-card .sub { font-size: 13px; color: var(--muted); margin-top: 2px; }

  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
  @media(max-width:600px){ .metrics { grid-template-columns: 1fr; } }
  .metric { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .metric .mk { font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; }
  .metric .mv { font-size: 26px; font-weight: 700; font-family: 'Syne', sans-serif; margin-top: 6px; }
  .metric .mv.high { color: var(--accent); }
  .metric .mv.mid { color: #fbbf24; }
  .metric .mv.low { color: var(--danger); }

  .skills-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
  @media(max-width:600px){ .skills-section { grid-template-columns: 1fr; } }

  .skills-box { border-radius: 10px; padding: 16px; border: 1px solid; }
  .skills-box.matched { border-color: rgba(110,231,183,.2); background: rgba(110,231,183,.04); }
  .skills-box.missing { border-color: rgba(248,113,113,.2); background: rgba(248,113,113,.04); }
  .skills-box .sk-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 12px; }
  .skills-box.matched .sk-label { color: var(--accent); }
  .skills-box.missing .sk-label { color: var(--danger); }

  .tags { display: flex; flex-wrap: wrap; gap: 7px; }
  .tag { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .tag.m { background: rgba(110,231,183,.15); color: var(--accent); }
  .tag.x { background: rgba(248,113,113,.15); color: var(--danger); }

  .explanation { margin-top: 20px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .explanation .ek { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .explanation p { font-size: 14px; line-height: 1.6; color: var(--text); }

  .loader-overlay {
    position: fixed; inset: 0; background: rgba(15,15,19,.85);
    display: grid; place-items: center; z-index: 500;
    backdrop-filter: blur(4px);
  }
  .loader-box { text-align: center; }
  .spinner {
    width: 48px; height: 48px; border: 3px solid var(--border);
    border-top-color: var(--accent2); border-radius: 50%;
    animation: spin .8s linear infinite; margin: 0 auto 16px;
  }
  .loader-box p { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 15px; color: var(--text); }
  .loader-box small { color: var(--muted); font-size: 13px; }

  .loading-steps { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  .loading-step {
    font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px;
  }
  .loading-step.active { color: var(--accent); font-weight: 600; }
  .loading-step .dot {
    width: 6px; height: 6px; border-radius: 50%; background: currentColor;
  }

  .interview-questions { margin-top: 20px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .interview-questions .ek { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
  .interview-questions ol { margin-left: 20px; display: flex; flex-direction: column; gap: 8px; }
  .interview-questions li { font-size: 14px; line-height: 1.5; color: var(--text); }

  .comparison-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; margin-top: 20px; animation: fadeUp .3s ease; }
  .comparison-card h3 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .comparison-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
  .comparison-item { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .comparison-item .ci-name { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
  .comparison-metric { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,.04); }
  .comparison-metric:last-child { border: none; margin-bottom: 0; padding-bottom: 0; }
  .comparison-metric .cm-label { font-size: 12px; color: var(--muted); }
  .comparison-metric .cm-value { font-size: 14px; font-weight: 700; }

  .checkbox-cell { display: flex; align-items: center; }
  input[type=checkbox] {
    width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent2);
  }

  .new-analysis-btn {
    background: none; border: 1px solid var(--border); border-radius: 8px;
    color: var(--muted); padding: 7px 16px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: border-color .2s, color .2s;
  }
  .new-analysis-btn:hover { border-color: var(--accent2); color: var(--accent2); }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

/* ─── Helpers ─── */
const scoreClass = (v) => {
  if (v >= 60) return "high";
  if (v >= 30) return "mid";
  return "low";
};

const readFileText = async (file) => {
  if (file.type === "application/pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        text += strings.join(" ") + " ";
      }

      const trimmed = text.trim();
      if (!trimmed) {
        console.warn("PDF extracted empty text for:", file.name,
          "— may be scanned/image-based or encrypted. Try a text-based PDF.");
        return "[EMPTY_PDF]";
      }
      console.log(`PDF: extracted ${trimmed.length} chars from ${file.name}`);
      return trimmed;
    } catch (error) {
      console.error("PDF parsing error:", error);
      return `[PARSE_ERROR: ${file.name}]`;
    }
  } else {
    try {
      return await file.text();
    } catch (error) {
      console.error("Text file reading error:", error);
      return `[Could not read: ${file.name}]`;
    }
  }
};

/* ─── Main Component ─── */
export default function App() {
  // State
  const [step, setStep] = useState("job"); // "job" | "main"
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [activeDetail, setActiveDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: "", error: false });
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  // Toast helper
  const showToast = useCallback((msg, error = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, msg, error });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  }, []);

  // Step 1 → Step 2
  const handleCreateJob = () => {
    if (!jobTitle.trim() || !jobDesc.trim()) {
      showToast("Please fill in both fields.", true);
      return;
    }
    setStep("main");
    showToast("Job description created successfully!");
  };

  // File handling
  const addFiles = (newFiles) => {
    setUploadedFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const removeFile = (idx) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

// Analyze — calls POST http://127.0.0.1:8000/predict per resume
const handleAnalyze = async () => {
  if (!uploadedFiles.length) return;

  setLoading(true);
  setLoadingStep("Uploading & analyzing resumes...");

  try {
    const apiResults = await Promise.all(
      uploadedFiles.map(async (file, i) => {
        setLoadingStep(`Analyzing ${i + 1}/${uploadedFiles.length}...`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("job_description", jobDesc);

        const res = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText);
        }

        const data = await res.json();

        if (data.error) {
          return {
            name: file.name,
            overallMatch: 0,
            tfidfScore: 0,
            keywordMatch: 0,
            matchedSkills: [],
            missingSkills: [],
            explanation: data.error,
            questions: [],
          };
        }

        return {
  name: file.name,
  overallMatch: Number(data.match_score ?? 0),
  tfidfScore: Number(data.tfidf_score ?? 0),
  keywordMatch: Number(data.keyword_match ?? 0),
  matchedSkills: data.matched_skills ?? [],
  missingSkills: data.missing_skills ?? [],
  explanation: data.explanation || "",
  questions: data.interview_questions ?? [],
  suggestedJobs: data.suggested_jobs ?? []   // 🔥 ADD THIS LINE
};
      })
    );

    // ✅ SORT ONCE (ONLY HERE)
    const sorted = [...apiResults].sort(
      (a, b) => b.overallMatch - a.overallMatch
    );

    setResults(sorted);
    setActiveDetail(sorted[0] ?? null);
    setSelectedCandidates([]);

    showToast(
      `Analysis complete! ${sorted.length} candidate${
        sorted.length !== 1 ? "s" : ""
      } ranked`
    );

  } catch (err) {
    console.error("Fetch error:", err);
    showToast(`Error: ${err.message || "API request failed"}`, true);

  } finally {
    setLoading(false);
    setLoadingStep("");
  }
};
  // New Analysis — reset everything
  const handleNewAnalysis = () => {
    setStep("job");
    setJobTitle("");
    setJobDesc("");
    setUploadedFiles([]);
    setResults([]);
    setActiveDetail(null);
    setSelectedCandidates([]);
  };

  // Handle candidate selection for comparison (max 2)
  const handleCandidateSelect = (candidateName) => {
    setSelectedCandidates((prev) => {
      if (prev.includes(candidateName)) {
        return prev.filter((n) => n !== candidateName);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, candidateName];
    });
  };

  /* ─── Render ─── */
  return (
    <>
      {/* Inject CSS */}
      <style>{css}</style>

      {/* Toast */}
      <div className={`toast${toast.show ? " show" : ""}${toast.error ? " toast-error" : ""}`}>
        <span className="dot" />
        <span>{toast.msg}</span>
      </div>

      {/* Loader */}
      {loading && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="spinner" />
            <p>Analyzing Candidates</p>
            <small>Scoring and ranking resumes…</small>
            {loadingStep && (
              <div className="loading-steps">
                <div className={`loading-step${loadingStep === "Parsing resumes..." ? " active" : ""}`}>
                  <span className="dot" />
                  Parsing resumes...
                </div>
                <div className={`loading-step${loadingStep === "Cleaning text..." ? " active" : ""}`}>
                  <span className="dot" />
                  Cleaning text...
                </div>
                <div className={`loading-step${loadingStep === "Extracting skills..." ? " active" : ""}`}>
                  <span className="dot" />
                  Extracting skills...
                </div>
                <div className={`loading-step${loadingStep === "Scoring candidates..." ? " active" : ""}`}>
                  <span className="dot" />
                  Scoring candidates...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header>
        <h1>Smart Resume Screener</h1>
        <p>AI-powered candidate ranking system</p>
      </header>

      <div className="container">
        {/* ── Step 1: Job Form ── */}
        {step === "job" && (
          <div className="step-job card">
            <div className="step-header">
              <div className="icon">💼</div>
              <div>
                <h2>Create Job Description</h2>
                <p>Enter the job details to start screening candidates</p>
              </div>
            </div>

            <label htmlFor="job-title">Job Title</label>
            <input
              id="job-title"
              type="text"
              placeholder="e.g. Python developer with experience in React, SQL, machine learning"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />

            <label htmlFor="job-desc">Job Description</label>
            <textarea
              id="job-desc"
              placeholder="e.g. Looking for Python developer with SQL and AI skills"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />

            <button className="btn-primary" onClick={handleCreateJob}>
              Create Job &amp; Continue
            </button>
          </div>
        )}

        {/* ── Step 2: Upload + Results ── */}
        {step === "main" && (
          <div className="step-main">
            <div className="two-col">
              {/* Sidebar */}
              <div className="sidebar">
                {/* Job Meta */}
                <div className="card job-meta">
                  <div className="label">Job Details</div>
                  <div style={{ marginTop: 16 }}>
                    <div className="label">Title</div>
                    <div className="title">{jobTitle}</div>
                  </div>
                </div>

                {/* Upload card */}
                <div className="card" style={{ marginTop: 0 }}>
                  <div className="step-header" style={{ marginBottom: 4 }}>
                    <div className="icon">⬆️</div>
                    <div>
                      <h2 style={{ fontSize: 17 }}>Upload Resumes</h2>
                      <p>PDF or TXT files</p>
                    </div>
                  </div>

                  {/* Drop zone */}
<div
  className={`upload-zone ${dragging ? "drag" : ""}`}
  onDragOver={(e) => {
    e.preventDefault();
    setDragging(true);
  }}
  onDragLeave={() => setDragging(false)}
  onDrop={(e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  }}
  onClick={() => fileInputRef.current.click()}
>
  <input
    ref={fileInputRef}
    type="file"
    accept=".pdf,.txt"
    multiple
    style={{ display: "none" }}
    onChange={(e) => {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
      e.target.value = "";
    }}
  />

  <div className="upload-icon">⬆️</div>
  <p>Click to upload</p>
  <small>PDF or TXT (multiple files supported)</small>
</div>

{/* File list */}
{uploadedFiles.length > 0 && (
  <>
    <div className="uploaded-label">
      Uploaded ({uploadedFiles.length})
    </div>

    <div className="file-list">
      {uploadedFiles.map((file, i) => (
        <div className="file-item" key={i}>
          <span>{file.name}</span>
          <button
            onClick={() =>
              setUploadedFiles((prev) =>
                prev.filter((_, index) => index !== i)
              )
            }
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </>
)}

                  {/* Analyze button */}
                  {uploadedFiles.length > 0 && (
                    <button
                      className="btn-analyze"
                      onClick={handleAnalyze}
                      disabled={loading}
                      style={{ marginTop: 16 }}
                    >
                      <span>📊</span>
                      {loading ? "Analyzing…" : "Analyze Candidates"}
                    </button>
                  )}
                </div>
              </div>

              {/* Results panel */}
              <div className="results-panel">
                {/* Empty state */}
                {results.length === 0 && !loading && (
                  <div className="empty-state">
                    <div className="ei">⚠️</div>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, marginBottom: 6, color: "var(--text)" }}>
                      No Analysis Yet
                    </h3>
                    <p>Upload resumes and click "Analyze Candidates" to see the ranking results</p>
                  </div>
                )}

                {/* Rankings table */}
                {results.length > 0 && (
                  <div className="rankings-card">
                    <div className="rankings-header">
                      <div>
                        <h3>Candidate Rankings</h3>
                        <small>{results.length} candidate{results.length !== 1 ? "s" : ""} analyzed and ranked</small>
                      </div>
                      <button className="new-analysis-btn" onClick={handleNewAnalysis}>
                        New Analysis
                      </button>
                    </div>

                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>
                              <div className="checkbox-cell" />
                            </th>
                            <th>Rank</th>
                            <th>Candidate</th>
                            <th>Match Score</th>
                            <th>Skills Match</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((c, i) => {
                            const sc = scoreClass(c.overallMatch);
                            const isActive = activeDetail?.name === c.name;
                            const isSelected = selectedCandidates.includes(c.name);
                            return (
                              <tr key={i}>
                                <td>
                                  <div className="checkbox-cell">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleCandidateSelect(c.name)}
                                      disabled={!isSelected && selectedCandidates.length >= 2}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className={`rank-badge${i === 0 ? " top" : ""}`}>{i + 1}</div>
                                </td>
                                <td style={{ fontWeight: 500 }}>{c.name}</td>
                                <td>
                                  <div className={`score-val ${sc}`}>
                                    {Number(c.overallMatch).toFixed(2)}%
                                  </div>
                                  <div className="score-bar">
                                    <div className="score-fill" style={{ width: `${Math.min(c.overallMatch, 100)}%` }} />
                                  </div>
                                </td>
                                <td style={{ color: "var(--muted)" }}>
                                  {c.matchedSkills.length}/{c.matchedSkills.length + c.missingSkills.length}
                                </td>
                                <td>
                                  <button
                                    className={`btn-view${isActive ? " active" : ""}`}
                                    onClick={() => setActiveDetail(c)}
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Comparison card */}
                    {selectedCandidates.length > 0 && (
                      <div className="comparison-card">
                        <h3>Candidate Comparison</h3>
                        <div className="comparison-grid">
                          {selectedCandidates.map((candidateName) => {
                            const candidate = results.find((c) => c.name === candidateName);
                            if (!candidate) return null;
                            return (
                              <div key={candidateName} className="comparison-item">
                                <div className="ci-name">{candidate.name}</div>
                                <div className="comparison-metric">
                                  <span className="cm-label">Overall Match</span>
                                  <span className={`cm-value ${scoreClass(candidate.overallMatch)}`}>
                                    {Number(candidate.overallMatch).toFixed(2)}%
                                  </span>
                                </div>
                                <div className="comparison-metric">
                                  <span className="cm-label">TF-IDF Score</span>
                                  <span className={`cm-value ${scoreClass(candidate.tfidfScore)}`}>
                                    {Number(candidate.tfidfScore).toFixed(2)}%
                                  </span>
                                </div>
                                <div className="comparison-metric">
                                  <span className="cm-label">Keyword Match</span>
                                  <span className={`cm-value ${scoreClass(candidate.keywordMatch)}`}>
                                    {Number(candidate.keywordMatch)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Detail card */}
{activeDetail && (
  <div className="detail-card">
    <h3>{activeDetail.name}</h3>
    <div className="sub">Detailed skill analysis and match breakdown</div>

    <div className="metrics">
      <div className="metric">
        <div className="mk">Overall Match</div>
        <div className={`mv ${scoreClass(activeDetail.overallMatch)}`}>
          {Number(activeDetail.overallMatch).toFixed(2)}%
        </div>
      </div>
      <div className="metric">
        <div className="mk">TF-IDF Score</div>
        <div className={`mv ${scoreClass(activeDetail.tfidfScore)}`}>
          {Number(activeDetail.tfidfScore).toFixed(2)}%
        </div>
      </div>
      <div className="metric">
        <div className="mk">Keyword Match</div>
        <div className={`mv ${scoreClass(activeDetail.keywordMatch)}`}>
          {Number(activeDetail.keywordMatch)}%
        </div>
      </div>
    </div>

    <div className="skills-section">
      <div className="skills-box matched">
        <div className="sk-label">
          Matched Skills ({activeDetail.matchedSkills.length})
        </div>
        <div className="tags">
          {activeDetail.matchedSkills.map((s, i) => (
            <span key={i} className="tag m">{s}</span>
          ))}
          {activeDetail.matchedSkills.length === 0 && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>None</span>
          )}
        </div>
      </div>

      <div className="skills-box missing">
        <div className="sk-label">
          Missing Skills ({activeDetail.missingSkills.length})
        </div>
        <div className="tags">
          {activeDetail.missingSkills.map((s, i) => (
            <span key={i} className="tag x">{s}</span>
          ))}
          {activeDetail.missingSkills.length === 0 && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>None</span>
          )}
        </div>
      </div>
    </div>

    <div className="explanation">
      <div className="ek">Ranking Explanation</div>
      <p>{activeDetail.explanation}</p>
    </div>

    {/* Interview Questions */}
    {activeDetail.questions && activeDetail.questions.length > 0 && (
      <div className="interview-questions">
        <div className="ek">Suggested Interview Questions</div>
        <ol>
          {activeDetail.questions.map((question, i) => (
            <li key={i}>{question}</li>
          ))}
        </ol>
      </div>
    )}

    {/* 🔥 NEW: JOB SUGGESTIONS */}
<div className="job-suggestions" style={{ marginTop: "20px" }}>
  <div className="ek">Suggested Jobs</div>

  {activeDetail?.suggestedJobs && activeDetail.suggestedJobs.length > 0 ? (
    activeDetail.suggestedJobs.map((job, i) => (
      <div
        key={i}
        style={{
          border: "1px solid #444",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "8px"
        }}
      >
        <p><strong>{job.title}</strong> - {job.company}</p>
        <a href={job.link} target="_blank" rel="noreferrer">
          Apply Now
        </a>
      </div>
    ))
  ) : (
    <p style={{ color: "var(--muted)" }}>
      No job suggestions available
    </p>
  )}
</div>
  </div>
)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
