# Multi-Agent Error Cancellation

> Trigger when designing or auditing multi-agent AI systems where output quality is critical, self-verification has produced repeated errors, or you need to evaluate whether agent role differentiation is genuine versus superficial. Also applies when a single agent is both generating and reviewing its own outputs and errors are escaping detection.

## Overview

This skill implements Specialization-Induced Error Cancellation: the architectural principle that assigning planning, execution, and review to agents with genuinely distinct prompt schemas and reasoning styles produces statistically independent error distributions, allowing each agent's blind spots to be caught by others. The core mechanism is epistemic decorrelation — when agents think differently enough, what one misses the other detects. The skill covers system design, prompt differentiation, role schema construction, and validation that differentiation is meaningful rather than cosmetic.

## When to Use

- A single agent is generating and reviewing its own output and the same error types keep escaping
- You are designing a multi-agent pipeline and need to assign roles that produce genuine quality gains
- You suspect your multi-agent system has superficially differentiated agents whose error distributions are still correlated
- You need to evaluate whether adding a second agent will actually improve reliability or just add latency
- A review or QA agent is consistently agreeing with the generator agent rather than catching its errors
- You are architecting a planning-execution-review pipeline and need to specify each agent's prompt schema

## Core Workflow

1. Audit the current setup: determine whether a single agent is doing both generation and verification, or whether multiple agents exist but with similar prompt structures. Identify whether errors are escaping review consistently.
2. Decompose the task into functionally discrete stages — at minimum: planning (what to do), execution (doing it), and review (evaluating it). Each stage must have a distinct cognitive orientation, not just a distinct label.
3. Design genuinely differentiated role schemas for each agent. Each schema must specify: orientation (constructive vs. adversarial vs. pragmatic), core heuristic (the question the agent is always asking), output format, and evaluative criterion (what the agent considers a good answer). These must differ substantively across agents.
4. Write prompts that encode each role schema structurally. Avoid rephrasing the same underlying instructions. The planner optimizes for coherent decomposition; the executor optimizes for faithful implementation; the reviewer optimizes for adversarial fault-finding. Each should approach the task as if the others got it wrong.
5. Validate prompt independence before deployment. Compare pairwise semantic similarity of agent prompts (using cosine distance on TF-IDF or embeddings). Reject configurations where any pair exceeds ~0.7 similarity — high similarity means correlated error distributions and minimal error-cancellation benefit.
6. Wire the pipeline so each agent receives the relevant prior stage's output, not the original task alone. The reviewer should see the executor's output and be constitutively skeptical of it, not neutral toward it.
7. Monitor error escape rates after deployment. If the reviewer consistently approves the executor's outputs without surfacing issues, treat this as a signal of correlated blind spots and re-differentiate the reviewer's prompt schema.

## Key Patterns

### Role Schema Quadrant
Every agent role schema must specify four elements: (1) orientation — the agent's cognitive stance (constructive, adversarial, implementational); (2) core heuristic — the question it always asks; (3) output format — the structure of its response; (4) evaluative criterion — what counts as a good answer for that role. Omitting the evaluative criterion is the most common failure: two agents can have different tasks but the same implicit success metric, leaving their error distributions correlated.

### Epistemic Divergence Over Task Divergence
Differentiate agents at the level of how they decide what is true or good, not just what task they perform. A planner and a reviewer can both implicitly optimize for comprehensiveness, leaving blind spots correlated. True differentiation means the reviewer's theory of value (e.g., 'what is the strongest objection?') is structurally incompatible with the generator's (e.g., 'what is the most coherent version?').

### Similarity Threshold as Quality Gate
Compute pairwise cosine similarity of agent prompts using TF-IDF or embedding vectors before deployment. Treat similarity above ~0.7 as a design failure — it predicts that the second agent will reproduce ~70% of the first agent's errors, yielding minimal quality gain. Prompt similarity is a cheap, scalable proxy for error correlation that should be a standard pre-deployment check.

### Antagonistic Cognitive Stances
Generativity and criticality are cognitively antagonistic orientations — a single agent cannot fully commit to both simultaneously. The generator should be prompted to produce and extend; the reviewer should be prompted to assume the generator made mistakes and find them. This is not just role-naming: the reviewer's prompt should create an adversarial prior toward the input it receives, not a neutral evaluation stance.

### Error Escape Rate Monitoring
Track the rate at which errors in the executor's output are approved rather than caught by the reviewer. A review approval rate above ~85-90% in a domain with known error rates is a red flag for correlated blind spots. Use this metric to trigger prompt re-differentiation rather than waiting for downstream failures.

### Independent Failure Mode Verification
In testing, deliberately inject known error types into the executor's output and measure whether the reviewer catches them. Then test which error types the reviewer consistently misses. If the reviewer's misses cluster in the same categories as the executor's natural errors, differentiation has failed and the prompt schema needs structural revision.

## Edge Cases & Warnings

- ⚠️ Superficial differentiation is the most common failure mode: renaming roles without changing the underlying prompt structure produces agents with near-identical error distributions. Adding a 'Reviewer' label to an agent prompted identically to the generator buys zero error-cancellation benefit and adds latency.
- ⚠️ Three nominally different agents with similar prompts can perform worse than two genuinely differentiated agents — the additional inference cost and complexity of the third agent adds nothing if its failure modes are correlated with the others. More agents is not better; more divergent agents is better.
- ⚠️ An adversarially-prompted reviewer may reject correct outputs. If the reviewer's evaluative criterion is too aggressive (e.g., 'find any possible objection'), it will produce false positives that degrade throughput. Balance adversarial stance with a grounding criterion tied to the actual domain success metric.
- ⚠️ Self-verification is structurally unreliable even with chain-of-thought prompting. Having a single agent re-examine its own output via extended reasoning still operates inside the same prior distribution and attention patterns. Do not treat chain-of-thought review as a substitute for a structurally independent reviewer agent.
- ⚠️ Prompt similarity metrics are necessary but not sufficient for validating independence. Two prompts can be semantically dissimilar but still produce correlated errors if the underlying model has strong priors that override prompt differentiation in certain domains. Always validate with behavioral testing (injected error detection) in addition to prompt similarity scoring.
- ⚠️ The planning-execution-review pipeline assumes stages are functionally separable. For tasks where planning and execution are tightly coupled (e.g., real-time code generation with immediate feedback loops), forcing stage separation may introduce coordination overhead that exceeds the quality benefit. Evaluate whether the task structure is compatible with pipeline decomposition.
- ⚠️ Meaningful role differentiation requires that the reviewer has no access to the generator's reasoning trace — only its output. If the reviewer sees the generator's chain-of-thought, it may be anchored to the same reasoning path and inherit its blind spots, collapsing epistemic independence even with a structurally different prompt.

## Quick Reference

- Core mechanism: statistically independent error distributions across agents → errors one agent misses, another catches
- Minimum pipeline: Planner (what to do) → Executor (do it) → Reviewer (find what's wrong with it)
- Role schema must specify: orientation, core heuristic, output format, evaluative criterion — all four, for every agent
- Self-verification is structurally unreliable: same priors in generation and review → same blind spots in both passes
- Superficial prompt variation = high error correlation = near-zero quality gain from adding a second agent
- Prompt similarity check: cosine similarity > 0.7 between any agent pair → redesign required before deployment
- Reviewer must have adversarial prior toward executor output, not neutral evaluation stance
- Quality ROI is a steep function of prompt divergence, not a linear function of number of agents
- Inject known errors in testing to verify reviewer catches what executor misses — behavioral validation is mandatory
- Do not show reviewer the generator's reasoning trace — anchoring collapses epistemic independence

---

## Resources

### 📎 role-schema-reference.md
_Complete reference for designing genuinely differentiated agent role schemas, including template structures, worked examples for planning/execution/review roles, and the evaluative criterion taxonomy_

# Agent Role Schema Reference

## What a Role Schema Is

A role schema is the complete specification of an agent's cognitive constitution — not just what it does, but how it decides what counts as good, true, or complete. Every role schema must define four elements. Omitting any one of them risks producing an agent that defaults to the same implicit values as other agents, re-introducing correlated blind spots.

## The Four Required Elements

**1. Orientation** — The agent's cognitive stance toward its input.
- Constructive: assume the input can be improved; build toward a better version
- Adversarial: assume the input contains errors; find and name them
- Implementational: assume the input is a plan; evaluate whether it can be executed
- Synthetic: assume the input is partial; identify what is missing

**2. Core Heuristic** — The single question the agent is always asking.
- Planner: 'What is the most coherent and complete decomposition of this task?'
- Executor: 'What does faithful, complete implementation of this plan look like?'
- Reviewer: 'What is the strongest case that this output is wrong or incomplete?'
- Devil's Advocate: 'What assumption here is most likely to be false?'
- Pragmatist: 'How would this fail in a real deployment, and why?'

**3. Output Format** — The structural form of the agent's response.
This is not cosmetic. Format encodes what the agent must attend to. A narrative summary forces integration; a bullet-pointed critique forces decomposition; a risk-annotated action list forces feasibility analysis. Mismatched formats between roles increase the cognitive work of downstream agents and reduce pipeline coherence.

**4. Evaluative Criterion** — What the agent considers a good answer.
This is the most critical and most frequently omitted element. Two agents can have different orientations, heuristics, and formats but still share the same implicit success metric (e.g., both optimizing for comprehensiveness), which leaves their error distributions correlated. The evaluative criterion must be explicitly incompatible with other agents' criteria to ensure genuine epistemic divergence.

## Template Role Schema


ROLE: [name]
Orientation: [constructive | adversarial | implementational | synthetic]
Core heuristic: [the question this agent always asks]
Output format: [specific structural form]
Evaluative criterion: [what this agent considers a good answer]
Explicit anti-criterion: [what this agent is NOT optimizing for — named explicitly]


The anti-criterion is optional but high-value: naming what an agent is not optimizing for prevents drift toward shared implicit metrics.

## Worked Example: Planning-Execution-Review Pipeline

### Planner Agent

ROLE: Planner
Orientation: Constructive
Core heuristic: What is the most coherent and complete decomposition of this task into discrete, executable steps?
Output format: Ordered step list with dependencies noted and success criteria per step
Evaluative criterion: Coverage (all necessary steps present) and coherence (steps follow from each other)
Anti-criterion: NOT optimizing for brevity or for identifying problems with the plan


### Executor Agent

ROLE: Executor
Orientation: Implementational
Core heuristic: What does complete, faithful execution of each plan step look like, and what could prevent it?
Output format: Step-by-step implementation with outputs per step and any deviations from plan noted
Evaluative criterion: Fidelity to plan and completeness of each step's output
Anti-criterion: NOT optimizing for plan quality or for critique of the plan's design


### Reviewer Agent

ROLE: Reviewer
Orientation: Adversarial
Core heuristic: What is the strongest case that this output is wrong, incomplete, or would fail in practice?
Output format: Structured critique listing specific flaws, missing elements, and logical gaps
Evaluative criterion: Error density — how many substantive problems can be identified and named
Anti-criterion: NOT optimizing for being fair to the executor or for constructing a positive case for the output


## Three Additional Role Templates

### Devil's Advocate

ROLE: Devil's Advocate
Orientation: Adversarial
Core heuristic: What is the strongest possible objection to the central claim or decision here?
Output format: Single most-devastating objection, fully argued, with supporting evidence
Evaluative criterion: Logical force of the objection — does it actually threaten the conclusion?
Anti-criterion: NOT optimizing for balance or for representing the mainstream view


### Pragmatist

ROLE: Pragmatist
Orientation: Implementational
Core heuristic: Can this actually be executed, and how would it fail under real-world conditions?
Output format: Risk-annotated action list with failure mode per action and resource constraint notes
Evaluative criterion: Feasibility — is each step achievable with specified resources, and are all failure modes named?
Anti-criterion: NOT optimizing for theoretical correctness or for comprehensive coverage


### Synthesizer

ROLE: Synthesizer
Orientation: Constructive
Core heuristic: What is the most coherent, integrated version of all inputs received?
Output format: Unified narrative that resolves apparent contradictions and names key trade-offs
Evaluative criterion: Integration — does the output account for all inputs and resolve their tensions?
Anti-criterion: NOT optimizing for identifying new problems or for adversarial critique


## Common Design Failures

**Failure 1: Shared evaluative criterion.** Planner and Reviewer both implicitly optimize for comprehensiveness. Fix: make the Reviewer's criterion explicitly incompatible — e.g., 'find the single most critical gap' rather than 'check for completeness.'

**Failure 2: Label-only differentiation.** Agent is named 'Reviewer' but prompted as 'helpful assistant who checks for errors.' Fix: replace generic language with role-schema elements that encode adversarial stance structurally.

**Failure 3: Neutral reviewer stance.** Reviewer is prompted to evaluate fairly and objectively. This produces a neutral prior, not an adversarial one, and the reviewer tends to approve outputs that are merely plausible. Fix: prompt the reviewer to assume the executor made at least one substantive error and to find it.

**Failure 4: Reviewer sees generator reasoning.** Reviewer is given the executor's chain-of-thought along with its output. The reviewer anchors to the same reasoning path and inherits its blind spots. Fix: show the reviewer only the output, not the reasoning trace.

### 📎 prompt-independence-validation.md
_Methods for validating that agent prompts are sufficiently differentiated to produce independent error distributions, including similarity scoring, behavioral testing, and failure mode mapping_

# Prompt Independence Validation Reference

## Why Validation Is Required

Prompt similarity is a proxy for error correlation. Two agents whose prompts are 80% semantically similar will produce error distributions that overlap at roughly the same proportion — which means adding the second agent buys only ~20% of the theoretical maximum error-cancellation benefit. Validation catches this before deployment rather than after errors escape to production.

Validation operates on two levels:
1. **Structural validation** — measuring prompt similarity before any inference runs
2. **Behavioral validation** — testing whether agents actually catch each other's errors in practice

Both are required. Structural similarity is necessary but not sufficient: two semantically dissimilar prompts can still produce correlated errors if the underlying model's strong domain priors override prompt differentiation.

## Structural Validation: Prompt Similarity Scoring

### Method
Compute pairwise cosine similarity between agent prompts using TF-IDF vectors or sentence embeddings.

### Interpretation
- Similarity > 0.80: High correlation. Agents are likely near-identical in reasoning behavior. Redesign required.
- Similarity 0.60-0.80: Moderate correlation. Marginal differentiation. Review evaluative criteria; likely shared implicit metric.
- Similarity 0.40-0.60: Acceptable divergence for most domains. Proceed to behavioral validation.
- Similarity < 0.40: Strong structural independence. High probability of decorrelated error distributions.

### Implementation

python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import itertools

def validate_prompt_independence(prompts: dict, threshold: float = 0.70) -> dict:
    """
    prompts: dict of {role_name: prompt_string}
    threshold: similarity above this value triggers a design failure flag
    """
    names = list(prompts.keys())
    texts = list(prompts.values())
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(texts)
    
    results = []
    failures = []
    
    for i, j in itertools.combinations(range(len(names)), 2):
        sim = cosine_similarity(tfidf_matrix[i], tfidf_matrix[j])[0][0]
        pair = (names[i], names[j])
        results.append({'pair': pair, 'similarity': round(sim, 3)})
        if sim > threshold:
            failures.append({'pair': pair, 'similarity': round(sim, 3), 'status': 'REDESIGN_REQUIRED'})
    
    return {'scores': results, 'failures': failures, 'passed': len(failures) == 0}

# Example usage
agent_prompts = {
    'planner': 'You are a strategic planner. Decompose the task into ordered steps with success criteria per step. Optimize for coverage and coherence. Assume the task is well-defined.',
    'executor': 'You are an implementer. Execute each step of the plan faithfully and completely. Note any deviation from the plan. Do not evaluate plan quality.',
    'reviewer': 'You are an adversarial auditor. Assume the output contains at least one substantive error. Find it. List every logical gap, missing element, and false assumption. Do not construct a positive case for the output.'
}

result = validate_prompt_independence(agent_prompts)
for score in result['scores']:
    print(f"{score['pair']}: {score['similarity']}")
if not result['passed']:
    print('FAILURES:', result['failures'])
else:
    print('All pairs passed structural independence check.')


## Behavioral Validation: Injected Error Testing

### Method
Deliberately inject known error types into the executor's output and measure whether the reviewer catches them. Then identify which error types the reviewer consistently misses.

### Error Injection Protocol

1. Define a taxonomy of error types relevant to your domain (e.g., logical gaps, factual errors, missing edge cases, incorrect assumptions, incomplete steps).
2. For each error type, create 5-10 test cases where the error is present in the executor's output.
3. Run each test case through the reviewer agent.
4. Measure catch rate per error type.
5. Compare the error types the reviewer misses to the error types the executor naturally produces.

### Interpretation
- If reviewer catch rate < 60% overall: severe correlated blind spots. Redesign reviewer prompt schema.
- If reviewer catch rate is high overall but low for specific error types: partial correlation. Identify whether those error types are in the executor's natural error distribution. If yes, redesign the reviewer's evaluative criterion to explicitly target those types.
- If reviewer catch rate > 90%: strong behavioral independence. Proceed to deployment with monitoring.

### Failure Mode Mapping

After behavioral validation, produce a failure mode map:


Error Type         | Executor Miss Rate | Reviewer Catch Rate | Status
-------------------|--------------------|---------------------|--------
Logical gaps       | 35%                | 80%                 | OK
Missing edge cases | 40%                | 45%                 | CORRELATED — redesign
False assumptions  | 25%                | 85%                 | OK
Incomplete steps   | 30%                | 30%                 | CORRELATED — redesign


Any error type where both the executor miss rate and the reviewer catch rate are low indicates correlated blind spots in that category. The reviewer's prompt schema must be updated to explicitly attend to that error type.

## Ongoing Monitoring: Error Escape Rate

After deployment, track:
- **Review approval rate**: percentage of executor outputs the reviewer approves without raising issues
- **Error escape rate**: percentage of outputs that pass review but are later identified as flawed by downstream users or processes

A review approval rate consistently above 85-90% in a domain with known error rates is a signal that the reviewer's error distribution has drifted toward the executor's — either due to prompt decay (edits that accidentally homogenized the prompts) or model update effects.

When this signal appears, re-run structural and behavioral validation before assuming the system is performing correctly.

## Common Validation Mistakes

**Mistake 1: Testing only with clean inputs.** If all test cases are well-formed and correct, the reviewer will approve them all — this tells you nothing about catch rate. Validation requires deliberately malformed inputs.

**Mistake 2: Using the same person to write all agent prompts in the same session.** A single author writing multiple prompts in sequence tends to converge on similar vocabulary and framing. Use different authors, or write prompts across different sessions with explicit divergence goals.

**Mistake 3: Validating once at deployment.** Prompt independence can erode over time as prompts are edited incrementally. Build similarity scoring into your CI/CD pipeline so any prompt change triggers automatic re-validation.

**Mistake 4: Treating high structural similarity as acceptable if behavioral tests pass.** High structural similarity means the agents are one model update away from becoming correlated. Even if behavioral tests currently pass, redesign structurally dissimilar prompts to build in robustness to future model changes.

### 📎 error-dynamics-reference.md
_Conceptual and quantitative reference for understanding how errors originate, propagate, and cancel or compound across agent boundaries — the theoretical foundation for multi-agent quality assurance design_

# Error Dynamics Reference

## The Core Problem: Why Self-Verification Fails

When a single agent generates output and then reviews it, both operations are governed by the same internal priors, attention patterns, and representational assumptions. The errors that escaped generation escaped because those specific patterns were absent from or misweighted in the agent's internal model. The review pass uses the same model, so those same patterns are absent or misweighted there too.

This is not a failure of effort or attention — it is structural. The verifier cannot find what the generator missed because both are blind to the same things. This is the correlated blind spots problem.

Formal statement: If G is the generator's error set and V is the verifier's error set, and G and V share the same prior distribution P, then E[|G ∩ V|] ≈ E[|G|] — the expected intersection of their error sets is approximately equal to the generator's error set itself. Verification adds no expected error-detection value.

## The Multi-Agent Solution: Statistical Independence

If reviewer R operates under a sufficiently different prior distribution P', then its error set R is statistically independent of the executor's error set E. An error escapes the system only if both E and R fail to catch it:

P(error escapes) = P(E misses) × P(R misses)

If each agent has a 30% miss rate and their error distributions are independent:
P(error escapes) = 0.30 × 0.30 = 0.09 (9%)

If their error distributions are correlated (same prior):
P(error escapes) = 0.30 (the verifier adds nothing)

This is why the quality benefit is multiplicative when independence is achieved, and near-zero when it is not.

## The Dependence Spectrum

Real systems fall on a spectrum between full correlation and full independence:


Full Correlation ←————————————————————→ Full Independence
(single agent self-review)              (maximally differentiated agents)

Error escape rate ≈ miss rate           Error escape rate ≈ (miss rate)^n
No quality gain from adding agents      Multiplicative quality gain per agent


The practical implication: the relationship between prompt divergence and error-cancellation benefit is highly nonlinear. Moving from 95% to 70% prompt similarity produces much larger quality gains than moving from 70% to 45%, because the error correlation function is not linear in similarity.

## Systematic Error Propagation

Systematic errors are the most dangerous failure mode. These are errors that recur deterministically (or near-deterministically) because they arise from a structural property of the agent's reasoning — a missing assumption, an always-miscalibrated prior, an implicit framing that systematically excludes certain solutions.

In a single-agent or correlated-agent system, systematic errors propagate through every processing pass unchanged. No amount of additional passes detects them because every pass shares the assumption that produces them.

In a well-differentiated multi-agent system, systematic errors in the generator are the *easiest* errors for the reviewer to catch — precisely because the reviewer's different framing makes the generator's structural assumption visible. What is invisible from inside a framework is often immediately apparent from outside it.

This is the deepest argument for multi-agent architecture: not just that it catches random errors more reliably, but that it is the only architecture structurally capable of catching systematic errors at all.

## Gödel Analogy

The self-verification failure in single-agent systems is structurally analogous to Gödel's incompleteness: a sufficiently consistent system cannot prove its own consistency from within its own axioms. An agent's 'axioms' are its priors and attention patterns. No amount of self-reflection — including chain-of-thought, extended reasoning, or re-prompting to 'check your work' — escapes those axioms, because all of those operations still run on the same model.

The only genuine escape is an agent constituted under a different set of axioms — not a mirror, but a genuinely different mind.

## Error Cancellation Conditions

For error cancellation to materialize, three conditions must hold:

1. **Independence**: Agent error sets must have low mutual information. This requires genuinely different prompt schemas and evaluative criteria, not superficial prompt variation.

2. **Coverage**: Each agent must have a non-trivial catch rate on error types it encounters. An agent that approves everything has a catch rate of zero regardless of its independence from other agents.

3. **Routing**: The reviewer must actually receive and attend to the executor's output. An agent that reviews a parallel or independently-generated version of the task rather than the executor's specific output is not performing error cancellation — it is performing independent generation.

All three conditions are necessary. A system can fail error cancellation by violating any one of them even while satisfying the other two.

## Quantitative Design Targets

For a three-stage pipeline (Planner → Executor → Reviewer) with target system error escape rate of < 5%:

- If each agent has a 30% miss rate: requires error correlation < 0.17 between executor and reviewer
- If each agent has a 20% miss rate: requires error correlation < 0.25 between executor and reviewer
- If each agent has a 40% miss rate: requires error correlation < 0.125 between executor and reviewer

Higher individual agent miss rates require lower inter-agent error correlation to hit the same system-level target. This means that as individual agent quality decreases, the requirement for genuine role differentiation increases — not decreases.

The practical implication: do not treat role differentiation as a secondary concern for high-performing agents. It becomes more important, not less, as the difficulty of the task increases and individual agent miss rates rise.

---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed — AI Agent Markdown Forge
