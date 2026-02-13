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


---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed — AI Agent Markdown Forge
