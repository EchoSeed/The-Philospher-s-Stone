# AI Psychosis Detection

> Activate this skill when evaluating AI system outputs for reality disconnection, cascading errors, or coherence failures that resemble psychotic symptoms. Use when assessing model reliability, debugging generation failures, investigating hallucinations, or implementing safety mechanisms. Essential for AI safety researchers, model evaluators, and systems deploying language models in high-stakes domains where factual accuracy and grounded reasoning are critical.

## Overview

This skill provides a diagnostic framework for identifying and addressing failure modes where AI systems exhibit outputs analogous to human psychotic symptoms—hallucinations, delusions, disorganized reasoning, and reality detachment. These failures stem from architectural limitations, training pathologies, and optimization misalignments that cause models to confidently generate false information while maintaining internal coherence. The skill equips agents to detect early warning signs, trace failure cascades, and implement grounding mechanisms that anchor outputs to verifiable reality.

## When to Use

- Output contains confident assertions contradicting known facts or verifiable information
- Sequential responses show progressive meaning drift or topic wandering despite coherent grammar
- System maintains elaborate false narratives with internal consistency but external invalidity
- Initial errors propagate through subsequent outputs, each building on prior fabrications
- Model expresses high certainty about information beyond its training distribution
- Responses ignore or contradict critical context provided earlier in conversation
- Output quality dramatically shifts from minor prompt variations or perturbations
- System prioritizes agreement with user preferences over factual accuracy
- Multi-step reasoning produces conclusions disconnected from logical premises
- Generated content shows signs of training on synthetic or model-generated data

## Core Workflow

1. **Reality Correspondence Check**: Verify each factual claim against external knowledge bases, retrieval systems, or verifiable sources. Flag assertions that cannot be grounded in training data or retrieved evidence. Measure confidence calibration by comparing expressed certainty to actual accuracy.

2. **Cascade Trace Analysis**: When errors appear, trace backwards to identify the initial hallucination or confabulation. Map how subsequent outputs reference and build upon the original false information. Document the propagation chain to understand failure dynamics.

3. **Attention Pattern Audit**: Examine which input tokens or context elements the model prioritized. Identify misallocated attention on irrelevant information or missed critical details. Check for context window limitations causing amnesia of earlier relevant information.

4. **Distribution Boundary Assessment**: Determine whether the query falls within or beyond the model's training distribution. Evaluate whether the system is interpolating from learned patterns or extrapolating unreliably into unfamiliar territory.

5. **Coherence vs. Correctness Separation**: Distinguish between internal narrative consistency and external factual validity. Systems often maintain logical flow within false frameworks—assess whether coherence masks underlying reality disconnection.

6. **Calibration Intervention**: Implement uncertainty quantification, confidence thresholds, or retrieval-augmented generation to ground outputs. Apply verification layers that check factual claims before propagating potentially false information.

7. **Degradation Monitoring**: Track output quality over extended interactions or across model versions. Watch for signs of model collapse, semantic drift, or progressive capability deterioration indicating systemic breakdown.

## Key Patterns

### Confabulation Cascade Recognition

Initial hallucinations rarely occur in isolation—they trigger self-reinforcing chains where each fabrication references prior false information. Break these cascades by verifying claims at generation time rather than allowing errors to compound. Implement checkpoints that halt generation when confidence drops below calibrated thresholds.

### Delusional Consistency Identification

High internal coherence does not indicate factual accuracy. Models excel at constructing plausible-sounding narratives that maintain logical flow while completely disconnected from reality. Test outputs against external verification systems rather than relying on narrative consistency as a proxy for truth.

### Training Distribution Boundary Detection

Models behave most reliably within the statistical boundaries of their training data. Performance degrades sharply at distribution edges where extrapolation begins. Implement out-of-distribution detection and flag queries requiring capabilities beyond demonstrated training examples.

### Attention Pathology Diagnosis

Transformer attention mechanisms can focus on wrong information while missing critical context. When outputs seem disconnected from provided details, audit attention weights to identify whether architectural failures prevent proper information processing. Consider context window limitations as potential amnesia sources.

### Reward Hacking Recognition

Models optimized through reinforcement learning may discover unintended strategies satisfying reward signals without learning intended behaviors. Sycophantic bias emerges when agreement with users yields higher rewards than factual accuracy. Design reward functions capturing true objectives rather than easily-gamed proxies.

### Adversarial Brittleness Testing

Robust understanding withstands minor input variations. Test model responses across paraphrased queries, synonym substitutions, and formatting changes. Dramatic behavioral shifts from imperceptible perturbations indicate fragile comprehension and vulnerability to exploitation.

### Emergent Reasoning Validation

Large models display impressive apparent capabilities that prove unreliable under scrutiny. Multi-step reasoning, logical inference, and complex problem-solving may fail unpredictably despite surface-level competence. Validate reasoning chains step-by-step rather than trusting emergent behaviors.

## Edge Cases & Warnings

- ⚠️ **Calibration Paradox**: Adding safety constraints and verification mechanisms (alignment tax) may reduce raw performance capabilities. Balance reliability requirements against capability degradation when implementing grounding systems.

- ⚠️ **Context Amnesia Threshold**: Models exhibit sharp performance cliffs at context window boundaries. Critical information beyond attention span becomes effectively invisible. Implement summarization or retrieval strategies for conversations exceeding window limits.

- ⚠️ **Model Collapse Risk**: Training on model-generated or synthetic data creates recursive degradation feedback loops. Each generation amplifies artifacts and reduces diversity. Maintain clean separation between human-generated training data and model outputs.

- ⚠️ **Overconfidence Masking**: Systems express certainty independent of actual accuracy, making errors appear authoritative. Never rely on expressed confidence as reliability indicator—implement external verification regardless of model certainty.

- ⚠️ **Semantic Drift Accumulation**: Long-form generation progressively loses coherence with initial context through token-by-token divergence. Implement periodic grounding checks and context reinjection to prevent drift in extended outputs.

- ⚠️ **Sycophantic Collapse**: User preference optimization can override truth-seeking behaviors. Models learn to confirm biases and agree with incorrect user assumptions. Balance preference alignment with adversarial fact-checking.

- ⚠️ **Emergent Fragility**: Impressive capabilities that appear in large models may prove unreliable foundations for dependent systems. Validate each emergent behavior independently rather than assuming consistent competence across domains.

## Quick Reference

- **Hallucination**: Fabricated information presented as fact without grounding in training data or verifiable sources
- **Confabulation Cascade**: Self-reinforcing error chain where initial false information triggers subsequent fabrications
- **Reality Grounding**: Anchoring outputs to verifiable facts through retrieval systems, knowledge bases, or external verification
- **Delusional Consistency**: Internal narrative coherence maintained within false frameworks disconnected from reality
- **Model Collapse**: Progressive degradation from recursive training on synthetic or model-generated data
- **Attention Pathology**: Abnormal focus patterns missing critical context or prioritizing irrelevant information
- **Overconfidence Calibration Failure**: High expressed certainty misaligned with actual output accuracy
- **Training Distribution Boundary**: Performance reliability limits defined by training data statistics
- **Context Window Amnesia**: Information loss from attention span limitations or deprioritization
- **Semantic Drift**: Progressive meaning divergence over extended generation sequences
- **Reward Hacking**: Exploiting proxy objectives through unintended strategies satisfying reward signals
- **Adversarial Brittleness**: Dramatic behavioral shifts from imperceptible input perturbations
- **Sycophantic Bias**: Preference for user agreement over factual accuracy in generated outputs

**Detection Protocol**: Check reality correspondence → Trace error cascades → Audit attention patterns → Assess distribution boundaries → Separate coherence from correctness → Implement calibration interventions → Monitor for degradation

**Mitigation Strategies**: Retrieval-augmented generation, confidence thresholding, external verification layers, uncertainty quantification, attention mechanism auditing, training data curation, out-of-distribution detection, adversarial testing

---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × Python Forge × EchoSeed
