# Quick Assistant Design

> Trigger this skill when designing, implementing, or evaluating a lightweight assistant layer optimized for speed and directness. Use it when the goal is rapid task dispatch, minimal-latency responses, or building a first-response layer that intercepts user requests before engaging deeper or slower systems. Also relevant when handling sparse input gracefully or implementing lossless error recovery in parsing pipelines.

## Overview

This skill covers the Gopher pattern: a narrow, fast-response assistant architecture that prioritizes low friction and concise output over depth or generality. It teaches how to structure a dispatch-based agent, how to handle malformed or insufficient input without silent failure, and how to design systems that are honestly bounded — refusing to fabricate confident output from weak input. The core insight is that intelligence layered as fast-narrow plus slow-broad outperforms either approach in isolation.

## When to Use

- You need a first-response agent that routes or handles a known set of tasks with minimal latency
- You are designing an assistant that should degrade gracefully when input is sparse, malformed, or below a meaningful analysis threshold
- You want to implement lossless error handling that preserves raw input alongside failure signals rather than silently dropping bad data
- You are evaluating whether a quick-dispatch pattern is preferable to a general-purpose reasoner for a given latency or scope constraint

## Core Workflow

1. Define the task scope: enumerate the finite set of tasks or queries the assistant will handle, and register a handler for each — this explicit dispatch table is what enables speed
2. Implement a parse-or-fallback layer at the input boundary: if structured parsing fails, preserve the raw input with a failure flag rather than discarding it, enabling downstream recovery or retry
3. Apply a minimum viable content threshold before analysis: check that input meets a floor of substance, and return an honest insufficiency signal with a remediation suggestion if it does not
4. Dispatch to the appropriate handler and return the most concise actionable output possible — avoid elaboration unless the caller explicitly requests depth
5. For unrecognized tasks, return a explicit 'no handler registered' signal rather than a generic error or a fabricated response, keeping the system's boundaries legible

## Key Patterns

### Lossless Error Handling
Always store the raw input alongside a parse failure flag. This means a downstream process, a human reviewer, or a retry loop can recover the original data. Systems that silently drop malformed input force the user to re-supply it from memory — a hidden tax on every failure.

### Explicit Dispatch Table
Register handlers by task name in a dictionary or map. Unknown tasks return a descriptive miss signal, not a generic error. This makes the assistant's capability surface self-documenting and prevents silent fallback to unhelpful defaults.

### Epistemic Honesty via Thresholds
Before running analysis, verify input meets a minimum content threshold (e.g., character or word count). Return an 'insufficient_content' status with a concrete suggestion rather than producing vacuous but confident-sounding output. Trust is built by refusing to overextend.

### First-Response Layering
Position the quick assistant as an interception layer, not a replacement for deeper systems. It handles what it can immediately; anything outside its dispatch table or above its complexity threshold should escalate rather than stall or hallucinate.

### Concise Output as a Contract
The Gopher pattern implies a response style contract: callers expect the minimum necessary output. Violating this by elaborating unrequested degrades the latency advantage that justifies the pattern's existence.

## Edge Cases & Warnings

- ⚠️ Sparse or label-only input (e.g., a two-word title with no body) will pass syntactic parsing but produce meaningless analysis — always enforce a content floor before running substantive logic
- ⚠️ A dispatch table with no fallback handler will surface confusing errors for valid but unregistered tasks — always implement an explicit 'unknown task' response that names the unrecognized input
- ⚠️ Preserving raw input with a failure flag consumes storage; in high-volume pipelines, set a retention policy so lossless recovery does not become unbounded accumulation
- ⚠️ The fast-narrow advantage disappears if the dispatch table grows too large or handlers become complex — monitor handler complexity and escalate heavyweight tasks to a slower, broader system
- ⚠️ Users may interpret an 'insufficient_content' signal as a system error rather than an input quality signal — phrase the response as actionable guidance, not a failure message

## Quick Reference

- Gopher pattern = fast + narrow + honest: dispatch known tasks instantly, reject unknowns explicitly, refuse to analyze insufficient input
- parse_or_fallback: if _parse_failed, return raw — never discard input silently
- Minimum content check before analysis: len(text) < threshold → return status: insufficient_content + suggestion
- Dispatch: handlers.get(task) → call if found, return named miss if not
- Output contract: return only what was asked for — elaboration breaks the latency promise
- Layering principle: Gopher intercepts → handles if in scope → escalates if not — never fabricates

---

## Resources

### 📎 gopher_pattern_reference.md
_Full reference covering the Gopher quick-assistant architecture: dispatch design, input validation, lossless error handling, and the layering principle with annotated code examples._

# Gopher Pattern — Reference Guide

## What Is the Gopher Pattern?

Gopher is a quick-assistant architecture optimized for speed and directness. It functions as a first-response layer: a narrow agent that handles a known set of tasks immediately and escalates everything else rather than attempting to generalize. Its primary design values are low latency, concise output, and honest boundaries.

The name 'Gopher' evokes the stagehand archetype — invisible, fast, already moving before the request is fully spoken.

---

## Core Components

### 1. Dispatch Table

The assistant's capability is defined by an explicit map of task names to handlers.

python
class Gopher:
    def __init__(self, handlers: dict):
        self.handlers = handlers

    def fetch(self, task: str):
        handler = self.handlers.get(task)
        if handler is None:
            return f'No handler registered for: {task}'
        return handler()

assistant = Gopher({
    'summarize': lambda: 'Here is your summary.',
    'translate': lambda: 'Voici votre traduction.',
})


Key rules:
- Every task must be explicitly registered.
- Unknown tasks return a named miss, not a generic error.
- Handlers should be fast and narrow — if a handler grows complex, escalate to a deeper system.

---

### 2. Lossless Error Handling

When input fails to parse, preserve it.

python
def parse_or_fallback(raw_input: dict) -> str:
    if raw_input.get('_parse_failed'):
        return raw_input.get('raw', '')
    return raw_input.get('text', '')


The failure flag (_parse_failed) acts as a sticky note on the payload — it marks the problem without destroying the contents. Downstream processes can retry, escalate, or surface the raw input to a human reviewer.

Antipattern: silently returning an empty string or None on parse failure. This discards the user's input and forces them to re-supply it.

---

### 3. Minimum Content Threshold

Before running analysis, verify the input contains enough substance to analyze.

python
def analyze_text(text: str, min_length: int = 50) -> dict:
    words = text.split()
    if len(text) < min_length:
        return {
            'status': 'insufficient_content',
            'word_count': len(words),
            'suggestion': 'Provide at least one full paragraph for meaningful analysis.'
        }
    return {
        'status': 'ok',
        'word_count': len(words),
        'avg_word_length': sum(len(w) for w in words) / len(words)
    }


The threshold is a form of epistemic honesty: the system refuses to produce plausible-sounding but vacuous output from a two-word input. It returns an actionable suggestion instead.

Analogy: analyzing a label for deep content is like carbon-dating a photocopy — the technique is valid, the substrate contains none of the original material.

---

## The Layering Principle

Gopher does not replace deep systems. It layers in front of them.


User Request
    ↓
[ Gopher Layer ]  ← fast, narrow, explicit dispatch
    ↓ (in scope)       ↓ (out of scope or complex)
  Handle & Return    Escalate to Deep System


This architecture means:
- Common, simple tasks are handled at near-zero latency.
- Complex or unknown tasks are not fabricated — they are forwarded.
- The system's capability surface is always legible to callers.

Intelligence layered as fast-narrow + slow-broad outperforms either approach alone.

---

## Output Contract

The Gopher pattern carries an implicit contract with callers: responses will be the minimum necessary to satisfy the request. Unsolicited elaboration violates this contract and degrades the latency advantage that justifies the pattern.

Guideline: if the caller did not ask for explanation, do not provide it. Return the result, stop.

---

## Taxonomy of Concepts

**Knowledge Access cluster** (Information Retrieval, Query Processing, Conversational Interface): Governs how the assistant surfaces relevant information in response to user queries — the dispatch table is the mechanical expression of this cluster.

**User Interaction cluster** (Conversational Interface, Task Automation, Assistive Technology): Governs how users communicate intent and how the assistant interprets and routes it.

**Efficiency & Delegation cluster** (Task Automation, Query Processing, Assistive Technology): Governs the reduction of user effort — every design decision in the Gopher pattern serves this cluster.

---

## Glossary

- **Gopher**: The named assistant entity; a quick-response agent designed for efficient task handling.
- **Quick Assistant**: The functional role descriptor emphasizing speed and immediacy as primary design values.
- **Rapid Retrieval**: The operational mode of fetching or producing information with minimal latency.
- **First-Response Layer**: An architectural position where the assistant intercepts requests before deeper systems are engaged.
- **Friction Reduction**: The design principle of minimizing steps, delays, or complexity between user intent and output.
- **Concise Output**: A response style that delivers only essential, actionable information without elaboration.
- **Task Execution**: The direct carrying out of a user-specified action or query as the assistant's primary function.

---

## Common Failure Modes

| Failure | Cause | Fix |
|---|---|---|
| Silent input loss | Discarding raw input on parse failure | Use parse_or_fallback, preserve raw with flag |
| Vacuous analysis | Running analysis on label-only input | Enforce minimum content threshold |
| Capability opacity | Generic error on unknown task | Return named miss: 'No handler for: X' |
| Latency regression | Handler complexity growth | Monitor; escalate complex handlers |
| Output bloat | Unsolicited elaboration | Enforce output contract: return result, stop |


---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed — AI Agent Markdown Forge
