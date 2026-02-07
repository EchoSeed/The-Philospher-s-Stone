import { useState, useRef, useCallback, useEffect } from "react";

const STAGES = [
  {
    id: "dual_extract",
    name: "Dual-Register Extraction",
    icon: "⚗️",
    desc: "Technical + plain-language concept extraction",
    origin: "Step 1 → Analytical summaries",
  },
  {
    id: "triple_mode",
    name: "Triple-Mode Elaboration",
    icon: "🔬",
    desc: "Code examples, analogies, and distilled insights",
    origin: "Step 2 → Sub-bullet expansion",
  },
  {
    id: "semantic_index",
    name: "Semantic Taxonomy",
    icon: "🗂️",
    desc: "Auto-generated index terms with cross-references",
    origin: "Step 3 → Index term assignment",
  },
  {
    id: "compress_expand",
    name: "Compression / Expansion",
    icon: "💎",
    desc: "Core thesis distillation + expanded glossary",
    origin: "Step 4 → Recursive compression layer",
  },
  {
    id: "meta_analysis",
    name: "Meta-Analysis",
    icon: "📡",
    desc: "Information density, complexity mapping, structural insights",
    origin: "Step 6 → Computational analysis",
  },
];

const PROMPTS = {
  dual_extract: (text, depth) => ({
    system: `You are a precision extraction engine. You analyze text and produce structured dual-register summaries. Output ONLY valid JSON, no markdown fences, no preamble.`,
    user: `Analyze this text and extract EXACTLY ${depth === "deep" ? "23" : depth === "medium" ? "13" : "7"} concepts (this count is a prime number constraint — do not deviate).

For each concept, provide:
1. A "technical" sentence using precise domain terminology
2. A "plain" sentence explaining the same idea in everyday language
3. A "confidence" score (0.0-1.0) for how central this concept is to the text

Return as JSON array:
[{"id": 1, "technical": "...", "plain": "...", "confidence": 0.95, "keywords": ["term1", "term2"]}]

TEXT TO ANALYZE:
${text}`,
  }),

  triple_mode: (text, concepts) => ({
    system: `You are a multi-modal elaboration engine. For each concept provided, generate three elaboration modes. Output ONLY valid JSON, no markdown fences, no preamble.`,
    user: `Given these extracted concepts and the original text, elaborate each concept in three modes:

CONCEPTS:
${JSON.stringify(concepts, null, 2)}

For each concept, produce:
1. "code": A minimal working Python code example that demonstrates or implements the concept (3-8 lines)
2. "analogy": A vivid metaphorical explanation (1-2 sentences)
3. "insight": A distilled one-line takeaway

Return as JSON array:
[{"concept_id": 1, "code": "...", "analogy": "...", "insight": "..."}]

ORIGINAL TEXT (for context):
${text}`,
  }),

  semantic_index: (text, concepts) => ({
    system: `You are a semantic indexing engine. You create taxonomies and cross-reference maps from extracted concepts. Output ONLY valid JSON, no markdown fences, no preamble.`,
    user: `Create a semantic taxonomy from these concepts extracted from the text below.

CONCEPTS:
${JSON.stringify(concepts, null, 2)}

Generate:
1. "terms": An array of exactly 11 unique index terms (prime number constraint) — abstract categories that organize the concepts. Each term should map to 1-5 concepts.
2. "cross_references": A matrix showing which concepts relate to which terms
3. "clusters": Group related concepts into exactly 5 thematic clusters (prime number constraint) with labels

Return as JSON:
{
  "terms": [{"term": "...", "concept_ids": [1, 3, 5], "definition": "..."}],
  "clusters": [{"label": "...", "concept_ids": [1, 2], "theme": "..."}],
  "density_score": 0.0-1.0
}

ORIGINAL TEXT:
${text}`,
  }),

  compress_expand: (text, concepts, taxonomy) => ({
    system: `You are a compression/expansion engine. You distill complex analyses into core theses and then expand them into precise glossary entries. Output ONLY valid JSON, no markdown fences, no preamble.`,
    user: `Given this analysis, perform two operations:

CONCEPTS:
${JSON.stringify(concepts, null, 2)}

TAXONOMY:
${JSON.stringify(taxonomy, null, 2)}

1. COMPRESS: Distill the entire analysis into a "core_thesis" (exactly 3 sentences — prime constraint — capturing the essential meaning of the original text)

2. EXPAND: Create a glossary of exactly 17 key terms (prime number constraint) where each entry cites back to specific concept IDs and index terms.

Return as JSON:
{
  "core_thesis": "...",
  "glossary": [{"term": "...", "definition": "...", "concept_ids": [1, 3], "index_terms": ["term1"]}],
  "compression_ratio": "description of information density change"
}

ORIGINAL TEXT:
${text}`,
  }),

  meta_analysis: (text, allResults) => ({
    system: `You are a meta-analytical engine that evaluates information structures. Output ONLY valid JSON, no markdown fences, no preamble.`,
    user: `Perform a meta-analysis of this extraction pipeline's results.

PIPELINE RESULTS:
${JSON.stringify(allResults, null, 2)}

Analyze:
1. "complexity_profile": Rate the source text's complexity across dimensions (conceptual density, technical depth, abstraction level, interconnectedness) each 0.0-1.0
2. "extraction_quality": Assess how well the pipeline captured the text's meaning
3. "information_topology": Describe the structural shape of the information (hierarchical, networked, linear, fractal, etc.)
4. "blind_spots": What might the pipeline have missed?
5. "recommended_depth": If re-run, should depth be increased or is current extraction sufficient?
6. "computational_notes": Which stages required the most sophisticated reasoning and why?
7. "prime_constraints": Document the prime-number constraints enforced throughout the pipeline (concept counts, index terms, glossary entries, clusters, thesis sentences) and note how these rigid cardinalities affected extraction quality.

Return as JSON:
{
  "complexity_profile": {"conceptual_density": 0.8, "technical_depth": 0.7, "abstraction_level": 0.6, "interconnectedness": 0.9},
  "extraction_quality": {"score": 0.85, "notes": "..."},
  "information_topology": "...",
  "blind_spots": ["..."],
  "recommended_depth": "...",
  "computational_notes": "...",
  "prime_constraints": "..."
}

ORIGINAL TEXT:
${text}`,
  }),
};

async function callAPI(system, user) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}

function StatusPill({ status }) {
  const colors = {
    idle: { bg: "rgba(255,255,255,0.05)", text: "#555", label: "WAITING" },
    running: { bg: "rgba(218,165,32,0.15)", text: "#daa520", label: "⟳ RUNNING" },
    complete: { bg: "rgba(80,200,120,0.12)", text: "#50c878", label: "✓ COMPLETE" },
    error: { bg: "rgba(220,50,50,0.12)", text: "#dc3232", label: "✗ ERROR" },
    skipped: { bg: "rgba(255,255,255,0.03)", text: "#3a3a3a", label: "SKIPPED" },
  };
  const c = colors[status] || colors.idle;
  return (
    <span style={{ padding: "2px 10px", borderRadius: "3px", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: "0.08em", background: c.bg, color: c.text, border: `1px solid ${c.text}22` }}>
      {c.label}
    </span>
  );
}

function ConceptCard({ concept, elaboration }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(218,165,32,0.1)", borderRadius: "5px", padding: "12px 14px", marginBottom: "6px", cursor: elaboration ? "pointer" : "default" }}
      onClick={() => elaboration && setOpen(!open)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12.5px", color: "#e8dcc8", lineHeight: 1.5, marginBottom: "3px" }}>
            <span style={{ color: "#daa520", fontFamily: "monospace", marginRight: "8px", fontSize: "11px" }}>#{concept.id}</span>
            {concept.technical}
          </div>
          <div style={{ fontSize: "11.5px", color: "#7a7060", lineHeight: 1.4 }}>{concept.plain}</div>
        </div>
        <div style={{ background: `rgba(218,165,32,${concept.confidence * 0.25})`, color: "#daa520", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontFamily: "monospace", marginLeft: "12px", whiteSpace: "nowrap" }}>
          {(concept.confidence * 100).toFixed(0)}%
        </div>
      </div>
      {concept.keywords && (
        <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
          {concept.keywords.map((kw, i) => (
            <span key={i} style={{ padding: "1px 6px", borderRadius: "3px", fontSize: "9.5px", background: "rgba(218,165,32,0.07)", color: "#908070", border: "1px solid rgba(218,165,32,0.08)" }}>{kw}</span>
          ))}
        </div>
      )}
      {open && elaboration && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(218,165,32,0.08)" }}>
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "9px", color: "#daa520", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "4px" }}>CODE</div>
            <pre style={{ background: "rgba(0,0,0,0.35)", padding: "8px 10px", borderRadius: "4px", fontSize: "10.5px", color: "#c8b898", overflow: "auto", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5, margin: 0 }}>{elaboration.code}</pre>
          </div>
          <div style={{ marginBottom: "6px" }}>
            <div style={{ fontSize: "9px", color: "#daa520", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "3px" }}>ANALOGY</div>
            <div style={{ fontSize: "11.5px", color: "#a09888", fontStyle: "italic", lineHeight: 1.5 }}>{elaboration.analogy}</div>
          </div>
          <div>
            <div style={{ fontSize: "9px", color: "#daa520", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "3px" }}>INSIGHT</div>
            <div style={{ fontSize: "11.5px", color: "#e8dcc8", fontWeight: 500 }}>{elaboration.insight}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StageDropdown({ stage, status, result, children }) {
  const [open, setOpen] = useState(false);
  const isClickable = status === "complete";

  return (
    <div style={{ marginBottom: "6px" }}>
      <div
        onClick={() => isClickable && setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px",
          background: open ? "rgba(218,165,32,0.06)" : status === "running" ? "rgba(218,165,32,0.03)" : "rgba(255,255,255,0.015)",
          border: `1px solid ${open ? "rgba(218,165,32,0.18)" : status === "running" ? "rgba(218,165,32,0.1)" : "rgba(255,255,255,0.04)"}`,
          borderRadius: open ? "6px 6px 0 0" : "6px",
          cursor: isClickable ? "pointer" : "default",
          transition: "all 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isClickable ? (
            <span style={{ fontSize: "11px", color: "#daa520", transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", width: "14px", textAlign: "center" }}>▶</span>
          ) : (
            <span style={{ width: "14px" }} />
          )}
          <span style={{ fontSize: "16px" }}>{stage.icon}</span>
          <div>
            <div style={{ fontSize: "13px", color: isClickable ? "#e8dcc8" : "#666", fontWeight: 600 }}>{stage.name}</div>
            <div style={{ fontSize: "10px", color: "#555", marginTop: "1px" }}>{stage.desc}</div>
          </div>
        </div>
        <StatusPill status={status} />
      </div>
      {open && result && (
        <div style={{ padding: "16px 18px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(218,165,32,0.18)", borderTop: "none", borderRadius: "0 0 6px 6px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function PhilosophersStone() {
  const [input, setInput] = useState("");
  const [depth, setDepth] = useState("medium");
  const [selectedStages, setSelectedStages] = useState(new Set(STAGES.map((s) => s.id)));
  const [stageStatus, setStageStatus] = useState({});
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [log, setLog] = useState([]);
  const logRef = useRef(null);

  const addLog = useCallback((msg) => {
    setLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const toggleStage = (id) => {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const runPipeline = async () => {
    if (!input.trim()) return;
    setRunning(true);
    setError(null);
    setResults({});
    setLog([]);
    const newStatus = {};
    STAGES.forEach((s) => { newStatus[s.id] = selectedStages.has(s.id) ? "idle" : "skipped"; });
    setStageStatus(newStatus);
    addLog("Pipeline initiated");

    let concepts = null;
    let elaborations = null;
    let taxonomy = null;
    const allResults = {};

    try {
      if (selectedStages.has("dual_extract")) {
        setStageStatus((p) => ({ ...p, dual_extract: "running" }));
        addLog("Stage 1: Dual-Register Extraction...");
        const prompt = PROMPTS.dual_extract(input, depth);
        concepts = await callAPI(prompt.system, prompt.user);
        allResults.concepts = concepts;
        setResults((p) => ({ ...p, dual_extract: concepts }));
        setStageStatus((p) => ({ ...p, dual_extract: "complete" }));
        addLog(`Extracted ${concepts.length} concepts (prime: ${[7,13,23].includes(concepts.length) ? "✓" : "✗"})`);
      }

      if (selectedStages.has("triple_mode") && concepts) {
        setStageStatus((p) => ({ ...p, triple_mode: "running" }));
        addLog("Stage 2: Triple-Mode Elaboration...");
        const prompt = PROMPTS.triple_mode(input, concepts);
        elaborations = await callAPI(prompt.system, prompt.user);
        allResults.elaborations = elaborations;
        setResults((p) => ({ ...p, triple_mode: elaborations }));
        setStageStatus((p) => ({ ...p, triple_mode: "complete" }));
        addLog(`Generated ${elaborations.length} elaborations`);
      } else if (selectedStages.has("triple_mode")) {
        setStageStatus((p) => ({ ...p, triple_mode: "skipped" }));
        addLog("Stage 2 skipped (requires Stage 1)");
      }

      if (selectedStages.has("semantic_index") && concepts) {
        setStageStatus((p) => ({ ...p, semantic_index: "running" }));
        addLog("Stage 3: Semantic Taxonomy...");
        const prompt = PROMPTS.semantic_index(input, concepts);
        taxonomy = await callAPI(prompt.system, prompt.user);
        allResults.taxonomy = taxonomy;
        setResults((p) => ({ ...p, semantic_index: taxonomy }));
        setStageStatus((p) => ({ ...p, semantic_index: "complete" }));
        addLog(`Generated ${taxonomy.terms?.length || 0} index terms (prime target: 11), ${taxonomy.clusters?.length || 0} clusters (prime target: 5)`);
      } else if (selectedStages.has("semantic_index")) {
        setStageStatus((p) => ({ ...p, semantic_index: "skipped" }));
        addLog("Stage 3 skipped (requires Stage 1)");
      }

      if (selectedStages.has("compress_expand") && concepts) {
        setStageStatus((p) => ({ ...p, compress_expand: "running" }));
        addLog("Stage 4: Compression / Expansion...");
        const prompt = PROMPTS.compress_expand(input, concepts, taxonomy);
        const compression = await callAPI(prompt.system, prompt.user);
        allResults.compression = compression;
        setResults((p) => ({ ...p, compress_expand: compression }));
        setStageStatus((p) => ({ ...p, compress_expand: "complete" }));
        addLog(`Core thesis distilled (3 sentences), ${compression.glossary?.length || 0} glossary entries (prime target: 17)`);
      } else if (selectedStages.has("compress_expand")) {
        setStageStatus((p) => ({ ...p, compress_expand: "skipped" }));
        addLog("Stage 4 skipped (requires Stage 1)");
      }

      if (selectedStages.has("meta_analysis")) {
        setStageStatus((p) => ({ ...p, meta_analysis: "running" }));
        addLog("Stage 5: Meta-Analysis...");
        const prompt = PROMPTS.meta_analysis(input, allResults);
        const meta = await callAPI(prompt.system, prompt.user);
        allResults.meta = meta;
        setResults((p) => ({ ...p, meta_analysis: meta }));
        setStageStatus((p) => ({ ...p, meta_analysis: "complete" }));
        addLog("Meta-analysis complete");
      }

      addLog("Pipeline complete ✓");
    } catch (err) {
      setError(err.message);
      addLog(`ERROR: ${err.message}`);
      STAGES.forEach((s) => {
        setStageStatus((p) => p[s.id] === "running" ? { ...p, [s.id]: "error" } : p);
      });
    }
    setRunning(false);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "philosophers-stone-extraction.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasResults = Object.keys(results).length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0b08", color: "#c8b898", fontFamily: "'Newsreader', 'Georgia', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 20px" }}>

        {/* Header */}
        <div style={{ padding: "32px 0 24px", borderBottom: "1px solid rgba(218,165,32,0.12)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "4px", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 300, color: "#daa520", letterSpacing: "0.02em" }}>The Philosopher's Stone</h1>
            <span style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", color: "#555", letterSpacing: "0.15em" }}>LLM EXTRACTION ENGINE</span>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#5a5040", fontStyle: "italic" }}>Multi-stage analysis pipeline — stress test turned surgical instrument</p>
        </div>

        {/* Source Text */}
        <div style={{ padding: "20px 0 16px" }}>
          <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#daa520", letterSpacing: "0.15em", marginBottom: "8px" }}>SOURCE TEXT</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste text to analyze — papers, conversations, code, documentation, anything with extractable structure..."
            style={{ width: "100%", height: "140px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(218,165,32,0.1)", borderRadius: "5px", color: "#c8b898", fontFamily: "'Newsreader', serif", fontSize: "13px", padding: "10px 12px", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(218,165,32,0.3)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(218,165,32,0.1)")}
          />
          <div style={{ fontSize: "10px", color: "#3a3520", fontFamily: "monospace", marginTop: "3px", textAlign: "right" }}>{input.length} chars</div>
        </div>

        {/* Controls Row */}
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#daa520", letterSpacing: "0.15em", marginBottom: "6px" }}>EXTRACTION DEPTH</div>
            <div style={{ display: "flex", gap: "4px" }}>
              {["shallow", "medium", "deep"].map((d) => (
                <button key={d} onClick={() => setDepth(d)} style={{ flex: 1, padding: "7px 4px", background: depth === d ? "rgba(218,165,32,0.15)" : "rgba(255,255,255,0.02)", border: `1px solid ${depth === d ? "rgba(218,165,32,0.3)" : "rgba(255,255,255,0.04)"}`, borderRadius: "3px", color: depth === d ? "#daa520" : "#555", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {d}
                  <div style={{ fontSize: "8px", color: depth === d ? "#b8941a" : "#3a3a3a", marginTop: "2px" }}>
                    {d === "shallow" ? "7 (prime)" : d === "medium" ? "13 (prime)" : "23 (prime)"}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#daa520", letterSpacing: "0.15em", marginBottom: "6px" }}>STAGES</div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {STAGES.map((s) => (
                <button key={s.id} onClick={() => !running && toggleStage(s.id)} title={s.name} style={{ padding: "5px 10px", background: selectedStages.has(s.id) ? "rgba(218,165,32,0.1)" : "rgba(255,255,255,0.015)", border: `1px solid ${selectedStages.has(s.id) ? "rgba(218,165,32,0.2)" : "rgba(255,255,255,0.04)"}`, borderRadius: "3px", color: selectedStages.has(s.id) ? "#daa520" : "#444", fontSize: "11px", cursor: running ? "default" : "pointer" }}>
                  {s.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Run Button */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button onClick={runPipeline} disabled={running || !input.trim()} style={{ flex: 1, padding: "13px", background: running ? "rgba(218,165,32,0.1)" : input.trim() ? "linear-gradient(135deg, #8B6914, #daa520)" : "rgba(255,255,255,0.03)", border: "none", borderRadius: "5px", color: running ? "#daa520" : input.trim() ? "#0d0b08" : "#444", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: "0.1em", cursor: running || !input.trim() ? "default" : "pointer" }}>
            {running ? "⟳ TRANSMUTING..." : "⚗️ BEGIN EXTRACTION"}
          </button>
          {hasResults && !running && (
            <button onClick={exportJSON} style={{ padding: "13px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(218,165,32,0.15)", borderRadius: "5px", color: "#8a8070", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" }}>
              ↓ JSON
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.2)", borderRadius: "5px", color: "#dc6464", fontSize: "12px", marginBottom: "16px" }}>{error}</div>
        )}

        {/* Pipeline Stages as Dropdowns */}
        <div style={{ marginBottom: "16px" }}>

          {/* Stage 1 */}
          <StageDropdown stage={STAGES[0]} status={stageStatus.dual_extract || "idle"} result={results.dual_extract}>
            <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", marginBottom: "10px" }}>
              {results.dual_extract?.length} concepts extracted — {results.triple_mode ? "click concepts to expand elaborations" : "elaboration data pending"}
            </div>
            {results.dual_extract?.map((concept) => {
              const elab = results.triple_mode?.find((e) => e.concept_id === concept.id);
              return <ConceptCard key={concept.id} concept={concept} elaboration={elab} />;
            })}
          </StageDropdown>

          {/* Stage 2 */}
          <StageDropdown stage={STAGES[1]} status={stageStatus.triple_mode || "idle"} result={results.triple_mode}>
            <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", marginBottom: "10px" }}>
              {results.triple_mode?.length} elaborations generated (code + analogy + insight per concept)
            </div>
            {results.triple_mode?.map((elab, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(218,165,32,0.08)", borderRadius: "5px", padding: "12px", marginBottom: "6px" }}>
                <div style={{ fontSize: "10px", color: "#daa520", fontFamily: "monospace", marginBottom: "2px" }}>Concept #{elab.concept_id}</div>
                <pre style={{ background: "rgba(0,0,0,0.35)", padding: "8px", borderRadius: "4px", fontSize: "10.5px", color: "#c8b898", overflow: "auto", fontFamily: "'JetBrains Mono', monospace", margin: "6px 0", lineHeight: 1.5 }}>{elab.code}</pre>
                <div style={{ fontSize: "11.5px", color: "#a09888", fontStyle: "italic", marginBottom: "4px" }}>{elab.analogy}</div>
                <div style={{ fontSize: "11.5px", color: "#e8dcc8", fontWeight: 500 }}>{elab.insight}</div>
              </div>
            ))}
          </StageDropdown>

          {/* Stage 3 */}
          <StageDropdown stage={STAGES[2]} status={stageStatus.semantic_index || "idle"} result={results.semantic_index}>
            {results.semantic_index?.clusters && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", color: "#daa520", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "8px" }}>THEMATIC CLUSTERS ({results.semantic_index.clusters.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {results.semantic_index.clusters.map((cluster, i) => (
                    <div key={i} style={{ background: "rgba(218,165,32,0.05)", border: "1px solid rgba(218,165,32,0.12)", borderRadius: "5px", padding: "10px 12px", flex: "1 1 200px" }}>
                      <div style={{ fontSize: "12.5px", color: "#e8dcc8", fontWeight: 600, marginBottom: "3px" }}>{cluster.label}</div>
                      <div style={{ fontSize: "11px", color: "#7a7060", marginBottom: "4px" }}>{cluster.theme}</div>
                      <div style={{ fontSize: "9px", color: "#555", fontFamily: "monospace" }}>Concepts: {cluster.concept_ids?.join(", ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.semantic_index?.terms && (
              <div>
                <div style={{ fontSize: "10px", color: "#daa520", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "8px" }}>INDEX TERMS ({results.semantic_index.terms.length})</div>
                {results.semantic_index.terms.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "5px 8px", background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent", borderRadius: "3px" }}>
                    <span style={{ fontSize: "12px", color: "#daa520", fontWeight: 600, minWidth: "110px" }}>{t.term}</span>
                    <span style={{ fontSize: "11px", color: "#7a7060", flex: 1 }}>{t.definition}</span>
                    <span style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", whiteSpace: "nowrap" }}>→{t.concept_ids?.join(",")}</span>
                  </div>
                ))}
              </div>
            )}
            {results.semantic_index?.density_score != null && (
              <div style={{ marginTop: "10px", fontSize: "10px", color: "#555", fontFamily: "monospace" }}>Density score: {results.semantic_index.density_score}</div>
            )}
          </StageDropdown>

          {/* Stage 4 */}
          <StageDropdown stage={STAGES[3]} status={stageStatus.compress_expand || "idle"} result={results.compress_expand}>
            {results.compress_expand?.core_thesis && (
              <div style={{ background: "rgba(218,165,32,0.05)", border: "1px solid rgba(218,165,32,0.12)", borderRadius: "5px", padding: "16px", marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", color: "#daa520", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "6px" }}>CORE THESIS</div>
                <div style={{ fontSize: "13.5px", color: "#e8dcc8", lineHeight: 1.6 }}>{results.compress_expand.core_thesis}</div>
                {results.compress_expand.compression_ratio && (
                  <div style={{ fontSize: "9px", color: "#555", marginTop: "8px", fontFamily: "monospace" }}>{results.compress_expand.compression_ratio}</div>
                )}
              </div>
            )}
            {results.compress_expand?.glossary && (
              <div>
                <div style={{ fontSize: "10px", color: "#daa520", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "8px" }}>GLOSSARY ({results.compress_expand.glossary.length} entries)</div>
                {results.compress_expand.glossary.map((entry, i) => (
                  <div key={i} style={{ padding: "8px 10px", background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent", borderRadius: "3px", marginBottom: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "12.5px", color: "#daa520", fontWeight: 600 }}>{entry.term}</span>
                      <span style={{ fontSize: "8.5px", color: "#3a3520", fontFamily: "monospace" }}>c:{entry.concept_ids?.join(",")} | {entry.index_terms?.join(", ")}</span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#7a7060", marginTop: "2px", lineHeight: 1.4 }}>{entry.definition}</div>
                  </div>
                ))}
              </div>
            )}
          </StageDropdown>

          {/* Stage 5 */}
          <StageDropdown stage={STAGES[4]} status={stageStatus.meta_analysis || "idle"} result={results.meta_analysis}>
            {results.meta_analysis?.complexity_profile && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", color: "#daa520", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: "10px" }}>COMPLEXITY PROFILE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {Object.entries(results.meta_analysis.complexity_profile).map(([key, val]) => (
                    <div key={key} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                      <div style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", marginBottom: "5px" }}>{key.replace(/_/g, " ")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ height: "4px", flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(val || 0) * 100}%`, background: "linear-gradient(90deg, #8B6914, #daa520)", borderRadius: "2px" }} />
                        </div>
                        <span style={{ fontSize: "11px", color: "#daa520", fontFamily: "monospace", minWidth: "32px" }}>{((val || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.meta_analysis?.information_topology && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", marginBottom: "3px" }}>Information Topology</div>
                <div style={{ fontSize: "12.5px", color: "#e8dcc8", lineHeight: 1.5 }}>{results.meta_analysis.information_topology}</div>
              </div>
            )}
            {results.meta_analysis?.extraction_quality && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", marginBottom: "3px" }}>Extraction Quality</div>
                <div style={{ fontSize: "12px", color: "#a09080", lineHeight: 1.5 }}>
                  Score: <span style={{ color: "#daa520", fontFamily: "monospace" }}>{results.meta_analysis.extraction_quality.score}</span> — {results.meta_analysis.extraction_quality.notes}
                </div>
              </div>
            )}
            {results.meta_analysis?.blind_spots && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", marginBottom: "4px" }}>Blind Spots</div>
                {results.meta_analysis.blind_spots.map((bs, i) => (
                  <div key={i} style={{ fontSize: "11.5px", color: "#8a7a6a", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>⚠ {bs}</div>
                ))}
              </div>
            )}
            {results.meta_analysis?.computational_notes && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", marginBottom: "3px" }}>Computational Notes</div>
                <div style={{ fontSize: "11px", color: "#8a8070", lineHeight: 1.5, background: "rgba(0,0,0,0.25)", padding: "8px 12px", borderRadius: "4px", fontFamily: "'JetBrains Mono', monospace" }}>{results.meta_analysis.computational_notes}</div>
              </div>
            )}
            {results.meta_analysis?.prime_constraints && (
              <div>
                <div style={{ fontSize: "9px", color: "#555", textTransform: "uppercase", marginBottom: "3px" }}>Prime Number Constraints</div>
                <div style={{ fontSize: "11px", color: "#daa520", lineHeight: 1.5, background: "rgba(218,165,32,0.05)", padding: "8px 12px", borderRadius: "4px", fontFamily: "'JetBrains Mono', monospace", border: "1px solid rgba(218,165,32,0.1)" }}>{results.meta_analysis.prime_constraints}</div>
              </div>
            )}
          </StageDropdown>
        </div>

        {/* Activity Log */}
        {log.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#3a3520", letterSpacing: "0.12em", marginBottom: "6px" }}>ACTIVITY LOG</div>
            <div ref={logRef} style={{ maxHeight: "120px", overflowY: "auto", padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.03)" }}>
              {log.map((entry, i) => (
                <div key={i} style={{ fontSize: "10px", fontFamily: "monospace", color: "#4a4a3a", lineHeight: 1.7 }}>
                  <span style={{ color: "#2a2a1a" }}>{entry.time}</span> {entry.msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasResults && !running && log.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0 80px", opacity: 0.35 }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚗️</div>
            <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px" }}>Paste source text and begin extraction</div>
            <div style={{ fontSize: "11px", color: "#333", fontFamily: "monospace", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto" }}>
              The stress test becomes a scalpel.<br />
              Prime-number constraints become extraction precision.<br />
              Recursive compression becomes knowledge distillation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
