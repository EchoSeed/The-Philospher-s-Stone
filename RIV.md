# Robust Input Validation

> Trigger this skill when a data pipeline, LLM workflow, or document-processing system must ingest user-supplied text before analysis. Use it to detect placeholder inputs, flag parse failures, enforce schema contracts, and return structured clarification requests instead of silently propagating garbage downstream.

## Overview

This skill provides a layered defense strategy for text-ingestion pipelines. It covers four failure modes in sequence: (1) semantic placeholder detection — catching strings like 'Markdown file' or 'N/A' that pass structural checks but carry no real content; (2) parse-failure flagging — encoding error states as values rather than exceptions so they survive serialization across process boundaries; (3) schema validation at the boundary — transforming raw input into proven-valid typed objects before any business logic runs; and (4) graceful degradation — returning structured, machine-readable clarification requests that agentic orchestrators can route back to the user automatically. The skill also covers Markdown-specific content extraction and TF-IDF keyword scoring as downstream processing patterns once input is confirmed valid.

## When to Use

- A user or upstream system supplies a text field that might contain a label, placeholder, or template stub instead of real content.
- A JSON payload arrives with a _parse_failed flag or an unexpectedly short 'raw' field.
- An LLM-powered pipeline needs to return a recoverable error state (not a crash) when input is insufficient for analysis.
- A document-processing step must strip Markdown syntax before running NLP or concept extraction.
- A keyword-extraction stage needs TF-IDF scoring but the corpus may be domain-specific, requiring awareness of IDF baseline assumptions.

## Core Workflow

1. Step 1 — Semantic placeholder check: Before any parsing, run a regex-based or heuristic check to detect sentinel strings ('Markdown file', '[Insert content]', 'TBD', 'N/A', 'Lorem ipsum'). Reject immediately with a structured 'insufficient_input' response if matched.
2. Step 2 — Structural parse and failure flagging: Attempt to parse the payload (JSON, YAML, etc.). On failure, set a _parse_failed flag on the result object rather than raising an exception. The flagged object flows downstream as a value, not a disruption.
3. Step 3 — Schema validation at the boundary: Check required keys, field types, and minimum content length (e.g., raw string ≥ 20 chars, word count ≥ 50). Return a structured validation error with an 'action_required' field if any check fails.
4. Step 4 — Content extraction (Markdown): Strip Markdown syntax (headers, bold/italic, code blocks, links) to recover analyzable plain text. Optionally preserve AST structural metadata (heading hierarchy, code-block density, link count) as feature signals for downstream weighting.
5. Step 5 — Concept extraction: Run TF-IDF or equivalent keyword scoring against an appropriate reference corpus. Flag results when the target domain is specialized, as general-web IDF baselines will under-score foundational domain terms.
6. Step 6 — Structured output contract: Serialize results into a fixed schema (concept_id, label, definitions, optional code/analogy/insight). The schema is the stable contract; the model or extractor is an implementation detail that can be swapped without touching consumers.

## Key Patterns

### Placeholder Propagation Guard
Placeholders pass type checks, length checks, and NLP tokenization — making them silent failures. Validate semantics, not just structure, at the earliest possible pipeline stage using a small set of regex patterns covering the most common sentinel values.

### Error-as-Value (Railway Pattern)
Instead of raising exceptions, encode parse failures as a _parse_failed boolean on the result dataclass. This makes errors serializable across network or process boundaries and forces every consumer to explicitly handle the failure state — the key advantage of Railway-Oriented Programming.

### Parse, Don't Validate
Concentrate all if-checks at the system boundary in a single validate_payload function that returns a proven-valid typed object. Business logic downstream trusts its inputs completely, eliminating defensive coding and cognitive overhead.

### Structured Clarification Response
When input is insufficient, return a JSON object with status, message, and action_required fields rather than null or an exception. Agentic orchestrators can read the action_required field and automatically re-route the task to the user, turning a dead end into a recoverable loop.

### Markdown AST as Feature Source
Do not treat Markdown syntax purely as noise to strip. Heading hierarchy signals topic salience, code-block density signals technical depth, and link density signals reference-heaviness. A richer pipeline extracts these as weights before NLP scoring.

### Domain-Aware TF-IDF
Standard TF-IDF penalizes high-frequency terms as unsurprising. In domain-specific corpora (medicine, law, finance), the most critical terms are high-frequency precisely because they are foundational. Use in-domain IDF baselines rather than general web-text IDF for such corpora.

### Output Schema as Interface Contract
Downstream consumers should depend on the output schema, not on the model that produced it. This mirrors the database-view pattern: the schema is stable; the model is an implementation detail. Define the schema first, then build the extractor to satisfy it.

## Edge Cases & Warnings

- ⚠️ A plausible-looking placeholder ('Overview', 'Introduction', 'Summary') may not match any regex pattern — supplement regex with a minimum word-count gate (e.g., < 50 words triggers a clarification request regardless of pattern match).
- ⚠️ A _parse_failed flag can itself be absent if the payload was constructed by a system that does not follow the flagging convention — always check both the flag and the content length independently.
- ⚠️ Markdown stripping via regex is lossy for nested or malformed syntax; prefer a proper Markdown AST parser (e.g., mistletoe, markdown-it) for production pipelines where structural metadata matters.
- ⚠️ TF-IDF scores collapse to near-zero when the target document is the only document in the corpus (IDF = 0 for all terms); always ensure the reference corpus contains at least several documents before scoring.
- ⚠️ Returning structured clarification requests works well in agentic pipelines but can confuse synchronous human-facing APIs that expect either a result or an HTTP error — document the 'insufficient_input' status code in your API contract explicitly.
- ⚠️ The 'parse, don't validate' boundary pattern requires discipline: if validation logic leaks into business logic (even one stray if-check), the guarantee breaks and the cognitive overhead returns.

## Quick Reference

- Placeholder regex patterns: ^\s*Markdown file\s*$, ^\s*\[.*?\]\s*$, ^\s*(placeholder|tbd|n/a|lorem ipsum)\s*$ — case-insensitive.
- Minimum content gate: word count < 50 → return {status: 'insufficient_input', action_required: '...'}.
- Parse failure pattern: catch exception → return ParseResult(parse_failed=True, error=str(e)) — never re-raise.
- Validation order: (1) check _parse_failed flag, (2) check required keys, (3) check field types, (4) check content length.
- Markdown plain-text extraction order: strip code blocks → inline code → headers → bold/italic → links → collapse whitespace.
- TF-IDF formula: score(w, doc) = (count(w, doc) / len(doc)) * log((N+1) / (df(w)+1)).
- Output schema required fields: concept_id (int), label (str), definitions.technical (str), definitions.plain_language (str).
- Schema-first rule: define the output JSON contract before writing any extractor logic.

---

## Resources

### 📎 placeholder_detection.md
_Reference patterns and decision logic for detecting sentinel/placeholder strings in text fields._

# Placeholder Detection Reference

## Core Regex Patterns

python
import re

PLACEHOLDER_PATTERNS = [
    r'^\s*Markdown file\s*$',
    r'^\s*\[.*?\]\s*$',
    r'^\s*(placeholder|example|lorem ipsum|tbd|n/a|insert|overview|summary|introduction)\s*$',
    r'^\s*<.*?>\s*$',  # XML-style placeholders
]

def is_placeholder(text: str) -> bool:
    return any(re.match(p, text, re.IGNORECASE) for p in PLACEHOLDER_PATTERNS)


## Decision Tree

1. Run regex match → if True, return insufficient_input immediately.
2. Split on whitespace → if word count < 50, return insufficient_input.
3. Check character entropy (optional advanced gate) → very low entropy suggests repeated or formulaic text.
4. Only then proceed to parse and validate.

## Why Regex Is Not Enough

Placeholders like 'Overview', 'Introduction', or 'Notes' are semantically empty but lexically normal. Pair regex with the word-count gate and, for high-stakes pipelines, a lightweight perplexity check against a language model to detect formulaic filler.

## Structured Clarification Response Schema


{
  "status": "insufficient_input",
  "message": "Input has 2 word(s); at least 50 required for meaningful concept extraction.",
  "action_required": "Please paste the actual document content you want analyzed.",
  "concepts": []
}


The `action_required` field is machine-readable: an agentic orchestrator can detect this status and automatically re-prompt the user without human intervention in the loop.


### 📎 parse_failure_flagging.md
_Pattern reference for encoding parse errors as values using the Railway-Oriented Programming approach._

# Parse Failure Flagging Reference

## ParseResult Dataclass

python
from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class ParseResult:
    raw: str
    parsed: Optional[Any] = None
    parse_failed: bool = False
    error: str = ''
    action_required: str = ''


## safe_parse Pattern

python
import json

def safe_parse(raw: str) -> ParseResult:
    try:
        parsed = json.loads(raw)
        return ParseResult(raw=raw, parsed=parsed)
    except json.JSONDecodeError as e:
        return ParseResult(
            raw=raw,
            parse_failed=True,
            error=str(e),
            action_required='Provide valid JSON or plaintext content.'
        )


## Why Error-as-Value Matters

- **Serializable across boundaries**: A _parse_failed flag survives JSON serialization across network or process hops; a Python exception does not.
- **Forces explicit handling**: Every consumer must check the flag, equivalent to checked exceptions but without the language dependency.
- **Agentic pipeline compatible**: An orchestrator reading JSON can branch on `parse_failed: true` without catching exceptions.

## Railway-Oriented Programming Summary

In Railway-Oriented Programming (Result/Either monad pattern):
- **Happy path**: input → validated → processed → output.
- **Error track**: input → flagged as failed → flows as a value → consumer handles or re-routes.

The key invariant: errors never escape as exceptions after the boundary. They become data.

## Consumer Checklist

Every function that receives a ParseResult must:
1. Check `result.parse_failed` before accessing `result.parsed`.
2. Return or propagate a structured error if `parse_failed` is True.
3. Never assume `result.parsed` is non-None without the flag check.


### 📎 schema_validation.md
_Boundary validation patterns implementing parse-don't-validate for text ingestion payloads._

# Schema Validation Reference

## Core Principle: Parse, Don't Validate

Concentrate all validation at the system boundary. Return a proven-valid typed object. Business logic downstream trusts its inputs completely.

## Payload Validator

python
from typing import TypedDict, Optional

class SourcePayload(TypedDict):
    raw: str
    _parse_failed: bool

MIN_CHARS = 20
MIN_WORDS = 50

def validate_payload(payload: dict) -> tuple[bool, str]:
    # Gate 1: Required keys
    required_keys = {'raw'}
    missing = required_keys - payload.keys()
    if missing:
        return False, f'Missing required keys: {missing}'

    # Gate 2: Parse failure flag
    if payload.get('_parse_failed'):
        return False, 'Payload flagged as parse-failed; original content unavailable.'

    raw = payload.get('raw', '')

    # Gate 3: Type and minimum length
    if not isinstance(raw, str) or len(raw.strip()) < MIN_CHARS:
        return False, f'raw field is empty or under {MIN_CHARS} characters.'

    # Gate 4: Semantic word count
    if len(raw.split()) < MIN_WORDS:
        return False, f'raw field has fewer than {MIN_WORDS} words; likely a placeholder.'

    return True, 'OK'


## Validation Order

Always validate in this sequence to fail fast at the cheapest check:
1. Presence of required keys (O(1) set operation).
2. Parse failure flag (O(1) dict lookup).
3. Type and character length (O(n) string check).
4. Word count (O(n) split).
5. Semantic/regex placeholder check (O(p) where p = number of patterns).

## Anti-Pattern: Scattered Validation

Do NOT scatter validation checks across business logic:

python
# BAD: validation leaking into business logic
def extract_concepts(payload):
    if not payload.get('raw'):  # <-- leaked validation
        return []
    if payload['_parse_failed']:  # <-- leaked validation
        return []
    # ... actual logic


This re-introduces the cognitive overhead the boundary pattern was designed to eliminate.


### 📎 markdown_extraction.md
_Reference for stripping Markdown syntax and preserving structural metadata as NLP feature signals._

# Markdown Content Extraction Reference

## Plain Text Extraction (Regex)

python
import re

def extract_plain_text(markdown: str) -> str:
    text = re.sub(r'[\s\S]*?', '', markdown)   # fenced code blocks
    text = re.sub(r'`[^`]+`', '', text)                   # inline code
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)  # headers
    text = re.sub(r'[*_]{1,3}([^*_]+)[*_]{1,3}', r'\1', text)  # bold/italic
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)        # links
    text = re.sub(r'\n{2,}', '\n', text).strip()                # whitespace
    return text


## Structural Metadata Signals

Do not discard these — they encode document semantics:

| Signal | How to Extract | What It Indicates |
|---|---|---|
| Heading depth distribution | Count #, ##, ### occurrences | Topic hierarchy depth |
| Code block count | Count fences | Technical depth |
| Link density | Count [text](url) patterns / total words | Reference-heaviness |
| List density | Count - and 1. patterns | Enumerative vs. narrative structure |
| Bold term count | Count **term** occurrences | Author-flagged key terms |

## AST-Based Extraction (Production)

For production pipelines, prefer a proper AST parser:

python
# Using mistletoe (pip install mistletoe)
import mistletoe
from mistletoe.ast_renderer import AstRenderer

with AstRenderer() as renderer:
    ast = renderer.render(mistletoe.Document(markdown_text))
# Traverse ast to extract nodes by type


Regex extraction is lossy for nested syntax, escaped characters, and HTML-embedded Markdown.

## Feature Weight Heuristic

When scoring concepts from a Markdown document, apply multipliers:
- Term appears in an H1 or H2 heading → weight × 3
- Term appears in bold → weight × 2
- Term appears in a code block identifier → weight × 1.5
- Term appears only in body prose → weight × 1


### 📎 tfidf_concept_extraction.md
_TF-IDF keyword extraction implementation with domain-corpus warnings and scoring heuristics._

# TF-IDF Concept Extraction Reference

## Implementation

python
import re
from math import log
from collections import Counter

def tfidf_keywords(docs: list[str], target_idx: int = 0, top_n: int = 7) -> list[tuple[str, float]]:
    """
    docs: list of documents; docs[target_idx] is the document to score.
    Returns top_n (word, score) pairs sorted descending.
    """
    tokenize = lambda d: re.findall(r'\b[a-z]{4,}\b', d.lower())
    tokenized = [tokenize(d) for d in docs]
    N = len(docs)
    df = Counter(word for doc in tokenized for word in set(doc))

    target = tokenized[target_idx]
    freq = Counter(target)
    total = len(target) or 1

    scored = {
        w: (freq[w] / total) * log((N + 1) / (df[w] + 1))
        for w in set(target)
    }
    return sorted(scored.items(), key=lambda x: x[1], reverse=True)[:top_n]


## Formula


TF(w, doc)  = count(w, doc) / len(doc)
IDF(w)      = log( (N + 1) / (df(w) + 1) )
TF-IDF(w)   = TF(w, doc) * IDF(w)


The +1 smoothing prevents division by zero and avoids log(0).

## Domain-Corpus Warning

TF-IDF assumes rarity = importance. This breaks in domain-specific corpora:

| Domain | High-Frequency Foundational Terms | Risk |
|---|---|---|
| Cardiology | myocardial, ventricular, arrhythmia | Under-scored vs. general IDF |
| Law | plaintiff, jurisdiction, statutory | Under-scored vs. general IDF |
| ML Engineering | gradient, tensor, epoch | Under-scored vs. general IDF |

**Mitigation**: Compute IDF baseline from an in-domain reference corpus, not general web text.

## Minimum Corpus Size

With only 1 document, IDF = log((1+1)/(1+1)) = log(1) = 0 for all terms. Scores collapse.

Rule: always include at least 5–10 reference documents in the corpus before scoring a target.

## Markdown Weight Integration

After TF-IDF scoring, apply Markdown structural multipliers (see markdown_extraction.md) before selecting top concepts. Final score = TF-IDF score × structural weight.


### 📎 output_schema_contract.md
_JSON output schema definition and enforcement patterns for concept extraction pipelines._

# Output Schema Contract Reference

## Concept Entry Schema


{
  "concept_id": 1,
  "label": "string — 2-5 word concept name",
  "definitions": {
    "technical": "string — precise, domain-accurate definition",
    "plain_language": "string — jargon-free explanation for a non-specialist"
  },
  "code": "string (optional) — self-contained runnable example",
  "analogy": "string (optional) — concrete real-world comparison",
  "insight": "string (optional) — non-obvious implication or tradeoff"
}


## Builder Function

python
from typing import Optional

def build_concept_entry(
    concept_id: int,
    label: str,
    technical: str,
    plain: str,
    code: Optional[str] = None,
    analogy: Optional[str] = None,
    insight: Optional[str] = None,
) -> dict:
    entry = {
        'concept_id': concept_id,
        'label': label,
        'definitions': {
            'technical': technical,
            'plain_language': plain,
        },
    }
    for key, val in [('code', code), ('analogy', analogy), ('insight', insight)]:
        if val is not None:
            entry[key] = val
    return entry


## Schema-First Design Rule

1. Define the output schema before writing any extraction logic.
2. Write a schema validator that rejects any output that does not conform.
3. Treat the model or extractor as an implementation detail — swap it freely as long as it satisfies the schema.
4. Document the schema version in every payload: add `"schema_version": "1.0"` at the envelope level.

## Interface Segregation Benefit

Downstream consumers import the schema, not the extractor. This means:
- The extractor can be replaced (different model, different library) without touching consumer code.
- The schema can be versioned and migrated independently.
- Integration tests validate the schema contract, not the extractor internals.

## Failure Envelope

When extraction fails, return the same envelope shape with a status field:


{
  "schema_version": "1.0",
  "status": "insufficient_input",
  "message": "Input too short for concept extraction.",
  "action_required": "Provide at least 50 words of real content.",
  "concepts": []
}


This keeps the response shape consistent whether extraction succeeded or failed — consumers always get an object with a `status` field and a `concepts` array.

19,889 chars
Clear
Extraction Depth
Shallow
7 concepts
Medium
13 concepts
Deep
23 concepts
Pipeline Stages
✓
⚗️
Dual-Register Extraction
Technical + plain language concept pairs
✓
🔬
Triple-Mode Elaboration
Code · Analogy · Insight per concept
needs 1
✓
🗂️
Semantic Taxonomy
Terms, clusters, density mapping
needs 1
✓
💎
Compress / Expand
Core thesis + glossary generation
needs 1
✓
📡
Meta-Analysis
Complexity profiling & blind spots
✓
🛠️
Skill Forge
Transmute into structured SKILL.md
needs 3
⚗️ Run Pipeline
🛠️ SKILL.md
📄 Raw MD
📋 Copy
# Robust Input Validation

> Trigger when a data pipeline, LLM workflow, or document-processing system must ingest user-supplied text before analysis. Use to detect placeholder inputs, flag parse failures, enforce schema contracts, and return structured clarification requests instead of silently propagating garbage downstream.

## Overview

This skill provides a layered boundary-defense architecture for text ingestion. It intercepts semantically empty inputs (placeholders, sentinel strings) before they enter any processing stage, encodes parse failures as passable values rather than exceptions so error states survive serialization, concentrates all validation logic at a single ingestion boundary so downstream code receives proven-valid typed objects, and returns machine-readable JSON error envelopes that agentic orchestrators can act on without human intervention. Once inputs survive this gauntlet, the skill also covers Markdown AST-based feature extraction — treating headings and bold terms as weighted signals — and domain-aware TF-IDF scoring calibrated against in-domain corpora rather than general-web baselines. The entire system is anchored by a schema-first output contract defined before any extractor logic is written.

## When to Use

- A user or upstream system supplies a text field that might contain a label, placeholder, or template stub ('N/A', 'TBD', '[Insert content]') instead of real content.
- A JSON payload arrives with a _parse_failed flag or an unexpectedly short or missing 'content' field that could silently corrupt downstream analysis.
- An LLM-powered pipeline needs to return a recoverable error state — not a crash — when input is insufficient for analysis, and an agentic orchestrator must be able to re-route the failure automatically.
- A document-processing step must strip Markdown syntax before running NLP, but structural metadata (headings, bold terms) should be preserved as weighted signals rather than discarded as noise.
- A keyword-extraction stage needs TF-IDF scoring over a domain-specific corpus where foundational terms are high-frequency by nature and would be unfairly penalized by a general-web IDF baseline.

## Core Workflow

1. Step 1 — Semantic placeholder check: Before any parsing, run regex pattern matching and a minimum word-count gate (e.g., < 5 words) against the raw input string. Reject sentinel strings ('N/A', 'TBD', '[Insert content]', 'Lorem ipsum', repetitive non-word characters) immediately, returning a structured rejection rather than passing the string downstream. Combine pattern matching with entropy or type-token ratio measures for stronger coverage against novel placeholders.
2. Step 2 — Error-as-Value parse stage: Attempt JSON or format parsing. On failure, do not raise an exception — instead encode the failure as a boolean flag (_parse_failed: true) on a returned dataclass alongside an error_code and error_message. Every downstream function that receives this object must explicitly inspect is_ok() before proceeding, making it impossible to silently ignore a parse failure across process or network boundaries.
3. Step 3 — Boundary validation (Parse-Don't-Validate): Pass the parsed payload through a single validate_payload function that is the one and only place where untrusted data becomes trusted data. This function performs type checks, length constraints, and required-field enforcement, then returns a frozen, typed ValidPayload object. All business logic downstream receives this proven-valid object and needs zero defensive null checks.
4. Step 4 — Structured clarification response: If validation fails, do not return null or raise an HTTP exception. Build and return a machine-readable JSON envelope with status ('clarification_required'), message, action_required, and a concepts array listing each failing field with its issue and a corrective example. An agentic orchestrator can parse this response and automatically re-route the task to the user without human intervention.
5. Step 5 — Markdown AST feature extraction (post-validation): Parse confirmed-valid Markdown input into an Abstract Syntax Tree. Extract structural metadata — heading depth, bold term frequency, code-block density, link density — and apply multiplicative TF-IDF weight modifiers (H1/H2 terms × 3, bold terms × 2, code terms × 1.5, body text × 1) rather than discarding syntax. This recovers the author's embedded salience judgments for free.
6. Step 6 — Domain-aware TF-IDF scoring: Replace the general-web IDF baseline with an in-domain reference corpus. Compute document frequency across that corpus so that high-frequency foundational domain terms ('jurisdiction' in law, 'gradient' in ML) receive IDF scores reflecting their conceptual centrality rather than being penalized for commonality. Return the top-N scored terms as the keyword output.

## Key Patterns

### Sentinel Pattern + Word-Count Gate
Regex alone is insufficient — a motivated upstream system or careless LLM will eventually produce text that evades every listed pattern while carrying zero semantic value. The minimum word-count gate does more epistemic work than regex because it proxies for semantic density. Stack both: regex catches known sentinels, word-count catches unknowns. Add type-token ratio for an even stronger signal.

### Error-as-Value (Railway-Oriented Flow)
Encode failures as a _parse_failed boolean on a returned dataclass, not as raised exceptions. This makes failures serializable across process and network boundaries, and forces every downstream consumer to explicitly handle the failure branch — you cannot accidentally pass a broken payload through. The type system becomes your enforcement mechanism rather than runtime crashes.

### Single Ingestion Boundary
Concentrate all validation in one validate_payload function. This reduces the security audit surface to a single question ('is validate_payload correct and complete?') rather than requiring every function that touches user input to be individually audited. Downstream business logic should be written with the assumption that its inputs are already valid — no defensive null checks, no scattered type guards.

### Machine-Readable Error Envelopes
Return structured clarification responses (status, message, action_required, concepts array) instead of null or HTTP exceptions. This moves error-handling logic into the producing system rather than duplicating heuristics across every consumer. The analogy to Parse-Don't-Validate is exact: parse the failure once at the source so consumers receive a proven-valid failure description rather than raw ambiguity.

### Markdown Formatting as Free Salience Signal
Markdown formatting is lossy compression of the author's attention model. Bolding a term or placing it in a heading encodes a salience judgment that would otherwise require expensive semantic analysis to recover. Parsing the AST decompresses that judgment for free, making Markdown documents richer information sources than equivalent plain-text of the same length. Never discard syntax — convert it to weights.

### Schema-First Output Contract
Define and version the JSON output schema (concept_id, label, definitions.technical, definitions.plain_language, optional code/analogy/insight) before writing any extractor logic. This decouples downstream consumers from the specific model or library producing the output. The extractor becomes a swappable implementation detail; consumers depend on the agreed format, not the tool that produced it.

## Edge Cases & Warnings

- ⚠️ Novel placeholders evade regex: A sufficiently motivated upstream system or an LLM prompted to 'fill in the form' will generate text that passes every listed sentinel pattern while carrying zero real information. Supplement regex with vocabulary richness measures (type-token ratio, bigram entropy) to catch these cases.
- ⚠️ Domain-specific foundational terms penalized by general IDF: Standard TF-IDF will rank 'jurisdiction', 'gradient', or 'authentication' as unimportant in legal, ML, or security corpora because they appear frequently. Always substitute an in-domain reference corpus for the IDF baseline when operating in a specialized field.
- ⚠️ Error-as-Value bypass via unchecked consumption: If a downstream function accepts the dataclass without calling is_ok() first, failures slip through silently — recreating the problem exceptions were meant to solve. Enforce the check via typed return signatures or linting rules; document the contract explicitly for every team consuming the output.
- ⚠️ Markdown AST weight inflation for heading-dense documents: Documents with many short headings and little body text will have their heading terms artificially dominate TF-IDF scores regardless of actual content importance. Cap the heading multiplier's contribution per term or require a minimum body-text word count before applying structural weights.
- ⚠️ Validate_payload completeness drift: As the input schema evolves, validate_payload can silently become incomplete — new required fields added to downstream logic but not to the boundary validator. Tie schema validation to a versioned Pydantic or JSON Schema definition so additions trigger explicit validator updates rather than silent gaps.
- ⚠️ Clarification response misinterpreted as success by naive consumers: Orchestrators that only check HTTP status codes will treat a 200 OK clarification_required envelope as a success. Document that consumers must inspect the status field of the JSON body, and consider returning HTTP 422 Unprocessable Entity alongside the structured envelope for defense in depth.

## Quick Reference

- Placeholder check order: word-count gate FIRST, then regex — word count catches unknowns regex can't enumerate.
- MIN_WORD_COUNT = 5 is a reasonable default; raise to 20+ for document-level inputs where a sentence is insufficient.
- Error-as-Value fields: _parse_failed (bool), error_code (str), error_message (str), data (dict) — always return all four.
- validate_payload is the ONE trust boundary — every function below it receives ValidPayload and never re-validates.
- Clarification envelope required fields: status='clarification_required', message, action_required, concepts (list of {field, issue, example}).
- Markdown AST weight table: H1/H2 = 3.0, bold = 2.0, inline/block code = 1.5, body text = 1.0.
- Domain TF-IDF: compute IDF from in-domain corpus, not Wikipedia/web — formula: log((N+1)/(df+1)) + 1.
- Output schema must be versioned and defined before extractor logic — consumers depend on shape, not tool.
- Security audit shortcut: only validate_payload needs auditing for input-handling vulnerabilities — keep it small and explicit.
- HTTP status for clarification: return 422 Unprocessable Entity + JSON body so both naive and smart consumers detect failure.

---

## Resources

### 📎 validation-reference.md
_Complete reference covering all seven concepts: sentinel detection patterns, error-as-value dataclass design, boundary validation architecture, structured clarification response schema, Markdown AST weight extraction, domain-aware TF-IDF configuration, and output schema contract design — with annotated code examples and decision rationale for each._

# Robust Input Validation — Full Reference

## Concept Map

Seven concepts organize into three clusters:

**Validation and Rejection Layer** (Concepts 1, 3, 4): How raw input is intercepted, tested, and either admitted or returned with actionable failure information.

**Resilient Error Representation** (Concepts 2, 4, 7): How failures and outputs are encoded as explicit, typed, serializable data structures consumable by automated systems.

**Content Feature Engineering** (Concepts 5, 6): How confirmed-valid input is mined for meaningful signals using document structure and domain-calibrated scoring.

Concept 4 (Structured Clarification Response) is the highest-connectivity node — it bridges the Validation layer and the Error Representation layer and is the primary output surface for both failure modes.

---

## Concept 1 — Semantic Placeholder Detection

**What it is:** A pre-parse filter that rejects sentinel strings satisfying structural constraints but carrying no real information.

**Implementation pattern:**

python
import re
from dataclasses import dataclass

SENTINEL_PATTERNS = [
    r'^\s*(n/?a|tbd|todo|placeholder|lorem ipsum|\[.*?\]|<.*?>|insert.*here)\s*$',
    r'^\s*([\W_])\1{2,}\s*$',  # repetitive non-word chars: '...', '---'
]
MIN_WORD_COUNT = 5

@dataclass
class ValidationResult:
    is_placeholder: bool
    reason: str | None = None

def detect_placeholder(text: str) -> ValidationResult:
    word_count = len(text.split())
    if word_count < MIN_WORD_COUNT:
        return ValidationResult(is_placeholder=True, reason=f'Too few words ({word_count} < {MIN_WORD_COUNT})')
    for pattern in SENTINEL_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return ValidationResult(is_placeholder=True, reason=f'Matched sentinel pattern: {pattern}')
    return ValidationResult(is_placeholder=False)


**Decision rationale:** The word-count gate is doing more epistemic work than the regex. It is a proxy for semantic density and catches novel placeholder forms that no regex list can enumerate. Combine with type-token ratio (unique_words / total_words) for stronger coverage: a TTR below ~0.4 over 20+ words is a strong signal of low-information content.

**Analogy:** A bouncer checking IDs — not just verifying the card has the right shape, but reading whether the name says 'John Doe' or 'Insert Name Here'. Structural existence is necessary but not sufficient.

**Key insight:** Placeholder detection is an adversarial arms race. The moment you publish your sentinel list, a careless LLM prompted to 'fill in the form' will generate text that evades every pattern while still carrying zero information. Entropy and vocabulary-richness measures create a far more durable signal than pattern matching alone.

---

## Concept 2 — Error-as-Value (Railway-Oriented Programming)

**What it is:** A control-flow pattern where parse failures are encoded as a boolean flag on a returned dataclass rather than raised as exceptions, making error states serializable and forcing explicit handling.

**Implementation pattern:**

python
from dataclasses import dataclass, field
from typing import Any
import json

@dataclass
class ParseResult:
    _parse_failed: bool = False
    error_code: str | None = None
    error_message: str | None = None
    data: dict[str, Any] = field(default_factory=dict)

    def is_ok(self) -> bool:
        return not self._parse_failed

def parse_payload(raw: str) -> ParseResult:
    try:
        parsed = json.loads(raw)
        if 'content' not in parsed:
            return ParseResult(_parse_failed=True, error_code='MISSING_FIELD',
                               error_message='Required field "content" absent')
        return ParseResult(data=parsed)
    except json.JSONDecodeError as e:
        return ParseResult(_parse_failed=True, error_code='INVALID_JSON', error_message=str(e))

def enrich(result: ParseResult) -> ParseResult:
    if not result.is_ok():
        return result  # pass failure downstream unchanged — cannot slip through silently
    enriched = {**result.data, 'word_count': len(result.data['content'].split())}
    return ParseResult(data=enriched)


**Standard error codes to define upfront:** INVALID_JSON, MISSING_FIELD, TYPE_MISMATCH, PLACEHOLDER_DETECTED, SCHEMA_VERSION_MISMATCH.

**Decision rationale:** With exceptions, success is the unmarked case — you write for the happy path and failures interrupt. With Result types, both outcomes are equally first-class. Teams using Result types handle more edge cases because the type system does not allow looking away from failures.

**Analogy:** A medical chart traveling with a patient through every department. If the ER marks 'allergy to penicillin', every downstream department sees that flag and must actively decide how to respond. Exceptions are more like the ER doctor shouting and then leaving — the chart-based approach means information travels inescapably.

**Key insight:** Error-as-Value inverts the default behavior of failure. The deepest benefit is not ergonomics — it is that it makes every failure mode a first-class design decision rather than an afterthought.

---

## Concept 3 — Parse-Don't-Validate Boundary Pattern

**What it is:** An architectural principle concentrating all input validation in a single ingestion-boundary function, so downstream business logic receives a proven-valid typed object and never needs defensive checks.

**Implementation pattern:**

python
from dataclasses import dataclass
from typing import Any

@dataclass(frozen=True)
class ValidPayload:
    content: str
    source: str
    word_count: int

class ValidationError(Exception):
    def __init__(self, field: str, reason: str):
        self.field = field
        self.reason = reason
        super().__init__(f'{field}: {reason}')

def validate_payload(raw: dict[str, Any]) -> ValidPayload:
    """The ONE place where untrusted data becomes trusted data."""
    content = raw.get('content', '')
    if not isinstance(content, str) or len(content.strip()) < 20:
        raise ValidationError('content', 'Must be a non-empty string of at least 20 characters')
    source = raw.get('source', '')
    if not isinstance(source, str) or not source:
        raise ValidationError('source', 'Must be a non-empty string')
    return ValidPayload(content=content.strip(), source=source.strip(), word_count=len(content.split()))

# Business logic below — NO defensive checks anywhere
def summarize(payload: ValidPayload) -> str:
    return f'Source: {payload.source} | Words: {payload.word_count}'


**Decision rationale:** When validation is scattered, a security audit must trace every function that touches user input. When it is concentrated at one boundary, the audit reduces to a single question: is validate_payload correct and complete? This gives the pattern compounding value in security-critical systems.

**Analogy:** A restaurant where a single prep cook inspects all ingredients at the loading dock versus one where every chef individually checks freshness. In the first model, trust is rebuilt from scratch at every station. In the second, once ingredients pass inspection, every downstream chef can cook confidently.

**Key insight:** The real payoff is not cleaner code — it is that it makes the attack surface of a system legible. A missed validation check in a scattered model is a bug; in a boundary model, it is detectable as a gap in a single function.

---

## Concept 4 — Structured Clarification Response

**What it is:** A machine-readable JSON error envelope returned in place of null or an HTTP exception when input is insufficient, enabling agentic orchestrators to detect the failure mode and re-route automatically.

**Required envelope fields:**

| Field | Type | Purpose |
|---|---|---|
| status | string | Always 'clarification_required' |
| message | string | Human-readable summary |
| action_required | string | Explicit instruction for the consumer |
| concepts | array | Per-field failure details |

**Per-field concept object:**

| Field | Type | Purpose |
|---|---|---|
| field | string | The failing input field name |
| issue | string | What is wrong |
| example | string | A corrective example value |

**Implementation pattern:**

python
from dataclasses import dataclass, asdict
import json

@dataclass
class ClarificationConcept:
    field: str
    issue: str
    example: str

@dataclass
class ClarificationResponse:
    status: str
    message: str
    action_required: str
    concepts: list[ClarificationConcept]

def build_clarification(issues: list[ClarificationConcept]) -> dict:
    return asdict(ClarificationResponse(
        status='clarification_required',
        message='The submitted payload could not be processed due to insufficient input.',
        action_required='Please resubmit with the fields described in `concepts` corrected.',
        concepts=issues,
    ))


**HTTP status recommendation:** Return HTTP 422 Unprocessable Entity alongside the JSON body. This ensures both naive consumers (checking only HTTP status) and smart consumers (parsing the JSON body) detect the failure correctly.

**Decision rationale:** Without structured clarification responses, every agentic orchestrator must implement its own heuristics to interpret ambiguous failure states. With a machine-readable envelope, error-handling logic lives in one place (the producing system) rather than being duplicated inconsistently across every consumer. This is the error-handling equivalent of Parse-Don't-Validate.

**Analogy:** A vending machine that displays 'Item B4 sold out — try B3 or insert more coins for C1' versus one that silently eats your dollar. The structured response gives the consumer exactly enough information to take the next correct action without involving a human.

---

## Concept 5 — Markdown AST as Feature Source

**What it is:** The practice of parsing Markdown into an Abstract Syntax Tree to extract structural metadata and convert formatting signals into multiplicative TF-IDF weight modifiers.

**Weight table:**

| Source | Multiplier | Rationale |
|---|---|---|
| H1 / H2 headings | 3.0 | Highest author-signaled salience |
| Bold terms | 2.0 | Explicit emphasis |
| Inline / block code | 1.5 | Technical identifier salience |
| Body text | 1.0 | Baseline |

**Implementation pattern:**

python
import re
from collections import defaultdict
from typing import NamedTuple

class WeightedTerm(NamedTuple):
    term: str
    weight: float
    source: str

def parse_markdown_to_weighted_terms(md: str) -> list[WeightedTerm]:
    weights: dict[str, list[tuple[float, str]]] = defaultdict(list)

    for m in re.finditer(r'^#{1,2}\s+(.+)$', md, re.MULTILINE):
        for word in re.findall(r'\b\w{3,}\b', m.group(1).lower()):
            weights[word].append((3.0, 'heading'))

    for m in re.finditer(r'\*{2}(.+?)\*{2}|__(.+?)__', md):
        text = m.group(1) or m.group(2)
        for word in re.findall(r'\b\w{3,}\b', text.lower()):
            weights[word].append((2.0, 'bold'))

    for m in re.finditer(r'[\s\S]*?|`[^`]+`', md):
        for word in re.findall(r'\b\w{3,}\b', m.group().lower()):
            weights[word].append((1.5, 'code'))

    plain = re.sub(r'#{1,6}\s|\*{1,2}|_+|`+|\[|\]|\(.*?\)', '', md)
    for word in re.findall(r'\b\w{3,}\b', plain.lower()):
        weights[word].append((1.0, 'body'))

    results = []
    for term, entries in weights.items():
        max_weight = max(w for w, _ in entries)
        source = next(s for w, s in entries if w == max_weight)
        results.append(WeightedTerm(term=term, weight=max_weight, source=source))
    return sorted(results, key=lambda x: x.weight, reverse=True)


**Edge case — heading-dense documents:** Documents with many short headings and little body text will have heading terms dominate regardless of actual content importance. Cap the heading multiplier's contribution per term or require a minimum body-text word count before applying structural weights.

**Decision rationale:** Markdown formatting is lossy compression of the author's attention model. Parsing the AST decompresses embedded salience judgments for free. Markdown documents are, in a precise sense, richer information sources than equivalent plain-text of the same length — the formatting is data, not decoration.

**Analogy:** Reading a newspaper after someone has removed all headlines, bold text, and captions into an undifferentiated wall of text. You can still extract facts, but you have thrown away the editor's entire curation layer.

---

## Concept 6 — Domain-Aware TF-IDF Scoring

**What it is:** A modification of standard TF-IDF that substitutes an in-domain reference corpus for a general-web IDF baseline, preventing penalization of high-frequency foundational domain terms.

**The problem with general-web IDF:** Standard TF-IDF assumes rare words are more informative. In specialized domains, the most critical terms ('jurisdiction' in law, 'gradient' in ML, 'authentication' in security) are common because they are fundamental. A general-web IDF baseline treats this as uninformativeness and suppresses them.

**Implementation pattern:**

python
import math
from collections import Counter

def compute_tfidf(
    document: str,
    domain_corpus: list[str],
    top_n: int = 10,
) -> list[tuple[str, float]]:
    doc_words = document.lower().split()
    tf = Counter(doc_words)
    total = len(doc_words)
    tf_scores = {w: c / total for w, c in tf.items()}

    N = len(domain_corpus)
    df: Counter = Counter()
    for doc in domain_corpus:
        df.update(set(doc.lower().split()))
    # Smoothed IDF: log((N+1)/(df+1)) + 1
    idf = {word: math.log((N + 1) / (freq + 1)) + 1 for word, freq in df.items()}

    scores = {
        word: tf_scores[word] * idf.get(word, math.log(N + 1) + 1)
        for word in tf_scores
        if len(word) > 3
    }
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]


**Corpus construction guidance:** Minimum viable domain corpus is 50-100 representative documents. Larger is better but diminishing returns set in around 500 documents for IDF stability. Refresh the corpus quarterly in fast-moving domains (e.g., ML engineering, regulatory compliance).

**Decision rationale:** A term's frequency in a domain corpus reflects its conceptual centrality, not its uninformativeness. The domain-aware IDF re-calibrates the algorithm's assumption to match domain reality rather than general-web statistics.

---

## Concept 7 — Output Schema as Interface Contract

**What it is:** A schema-first discipline in which the JSON output structure is defined and versioned before any extractor logic is written, decoupling downstream consumers from the specific model or library producing the output.

**Canonical output schema:**


{
  "concept_id": "string (required)",
  "label": "string (required)",
  "definitions": {
    "technical": "string (required)",
    "plain_language": "string (required)"
  },
  "code": "string (optional)",
  "analogy": "string (optional)",
  "insight": "string (optional)",
  "schema_version": "string (required, semver)"
}


**Versioning strategy:** Use semantic versioning on the schema itself. Increment PATCH for additive optional fields. Increment MINOR for new required fields with defaults. Increment MAJOR for breaking changes to required field names or types. Include schema_version in every output record.

**Decision rationale:** Defining the schema before writing extraction logic forces clarity about what information the system actually needs to produce. It also means the extractor (an LLM prompt, a regex pipeline, a fine-tuned model) is a swappable implementation detail — consumers depend on the shape of output, not the tool that produced it.

**Key insight:** Schema-first design shifts the primary artifact of a system from its implementation to its contract. In agentic pipelines where models change frequently, this is the difference between a brittle system that breaks on every model update and a stable system where model changes are internal refactors.

---

## Taxonomy Index

**Input Boundary Enforcement** → Concepts 1, 3
**Failure State Propagation** → Concepts 2, 4
**Structural Signal Extraction** → Concepts 5, 6
**Schema-Driven Contract Design** → Concepts 3, 7
**Semantic Content Verification** → Concepts 1, 6

---

## Integration Checklist

- [ ] Placeholder detector runs before JSON parsing — not after
- [ ] All parse failures return ParseResult with _parse_failed=True — no bare exceptions escape the parse layer
- [ ] validate_payload is the only function that accepts raw dict input — all others accept ValidPayload
- [ ] Clarification responses include all three required fields: status, action_required, concepts array
- [ ] HTTP 422 accompanies clarification JSON body
- [ ] Markdown weight multipliers are applied before TF-IDF scoring, not after
- [ ] Domain corpus is versioned alongside the scoring code
- [ ] Output schema version is included in every output record
- [ ] Schema is defined in a shared location imported by both producer and consumer

---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed — AI Agent Markdown Forge
