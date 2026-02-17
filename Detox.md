# Hallucination Prevention Architecture

> Deploy this skill when generating responses that require factual accuracy, especially when dealing with specialized knowledge, recent events, or high-stakes domains where incorrect information could cause harm. Activate when users request verifiable claims, citations, or detailed explanations. Essential for medical, legal, financial, or technical contexts where precision matters more than fluency.

## Overview

This skill implements multi-layered defenses against AI-generated misinformation by combining knowledge retrieval, confidence assessment, and external verification. Rather than relying solely on pattern-matching from training data, it supplements parametric memory with real-time fact-checking and uncertainty awareness. The architecture transforms opaque prediction systems into accountable tools that distinguish genuine knowledge from statistical guesswork, preventing fabricated details while maintaining transparency about confidence levels.

## When to Use

- User requests specific facts, dates, statistics, or attributable claims
- Response involves domains outside core training distribution
- High-stakes contexts where errors have serious consequences
- User explicitly requests sources, citations, or verification
- Detecting unusually low internal confidence scores during generation
- Input contains contradictory information or edge-case scenarios
- Task requires recent information beyond knowledge cutoff dates
- Generating content in specialized technical or professional fields

## Core Workflow

1. **Pre-Generation Assessment**: Analyze input for distribution alignment, identify knowledge gaps, and flag high-risk domains requiring external verification before attempting response generation.

2. **Retrieval Augmentation**: Query external databases, knowledge graphs, or document stores to supplement parametric memory with current, verifiable information relevant to the user's request.

3. **Confidence-Filtered Generation**: Produce response while tracking attention patterns and uncertainty estimates, applying thresholds to reject low-confidence claims or flag them for verification.

4. **External Verification**: Cross-reference generated claims against authoritative sources, fact-checking databases, and rule-based ion**: Present results with appropriate confidence indicators, explicit source attribution, and clear acknowledgment of limitations or knowledge boundaries.

## Key Patterns

### Retrieval-First Architecture
When answering factual questions, query external sources before generating responses. Treat retrieved information as primary evidence and parametric knowledge as supplementary context. This inverts the typical generation pattern to prioritize verifiability over fluency.

### Graduated Confidence Responses
Structure outputs in tiers based on certainty: high-confidence claims stated directly with sources, medium-confidence hedged with qualifiers, low-confidence rejected with explicit "I don't know" admissions. Avoid the middle-ground trap of plausible-sounding fabrications.

### Attention Transparency
When generating complex explanations, audit which input tokens received highest attention weights. If attention spreads diffusely or focuses on irrelevant context, this signals potential hallucination risk requiring verification.

### Training Data Quality Gates
Curate input datasets through deduplication, toxicity filtering, and factual verification before training. Reduce memorization of misinformation by removing contradictory sources and prioritizing authoritative references during pre-training phases.

### Out-of-Distribution Alerts
Implement anomaly detection to recognize when queries diverge significantly from training distribution. Surface epistemic uncertainty explicitly rather than generating confident-sounding nonsense about unfamiliar topics.

### Adversarial Stress Testing
Regularly evaluate with intentionally deceptive prompts, contradictory contexts, and edge cases designed to trigger hallucinations. Use failure analysis to strengthen robustness before deployment.

### Ensemble Disagreement Signals
When combining multiple model predictions, treat high variance across ensemble members as uncertainty indicators. Disagreement reveals ambiguity that single-model confidence scores might mask.

## Edge Cases & Warnings

- ⚠️ **Calibration Drift**: Confidence scores may become miscalibrated over time or across domains; periodically validate that 90% confidence actually corresponds to 90% accuracy through held-out test sets.

- ⚠️ **Retrieval Poisoning**: External databases can contain misinformation; verify source authority and cross-reference multiple retrieval results rather than trusting single documents blindly.

- ⚠️ **Over-Abstention**: Excessively conservative thresholds reduce utility; balance false positive prevention with helpful coverage by calibrating rejection rates to task criticality.

- ⚠️ **Attention Misinterpretation**: High attention weights don't always indicate causal reasoning; correlation with hallucination requires careful ablation studies rather than naive weight inspection.

- ⚠️ **Aleatoric vs Epistemic Confusion**: Some uncertainty stems from inherent ambiguity rather than knowledge gaps; distinguish irreducible noise from reducible ignorance to avoid futile verification efforts.

- ⚠️ **Prompt Injection Risks**: Adversarial users may craft inputs that disable safety mechanisms; sandbox verification layers independently from generation to prevent prompt-based bypasses.

- ⚠️ **Ensemble Homogeneity**: Multiple models trained on similar data exhibit correlated failures; ensure ensemble diversity through varied architectures, training procedures, and data sources.

## Quick Reference

- **RAG Pattern**: Retrieve → Ground → Generate → Verify → Attribute
- **Confidence Tiers**: >0.9 (direct claim), 0.7-0.9 (hedged), <0.7 (abstain)
- **Uncertainty Types**: Epistemic (fixable via data) vs Aleatoric (inherent noise)
- **Verification Cascade**: Internal confidence → External retrieval → Fact-checking → Source citation
- **Detection Metrics**: Attention entropy, prediction variance, OOD scores, semantic consistency
- **Failure Modes**: Fabricated details, source misattribution, overconfident extrapolation, context confusion
- **Mitigation Checklist**: Curate training data → Implement retrieval → Add confidence filters → Enable external verification → Test adversarially
- **Calibration Test**: Bin predictions by confidence, measure accuracy per bin, adjust thresholds
- **Ensemble Strategy**: Train 5+ diverse models, flag high-variance predictions, require supermajority agreement

---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed
