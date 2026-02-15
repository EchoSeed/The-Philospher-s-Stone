# Multi-Agent Framework

> Trigger when a task is too complex, long, or multifaceted for a single model instance — requiring parallel workstreams, specialized sub-roles (planner, executor, reviewer), or context exceeding a single agent's capacity. Also trigger when designing or debugging distributed AI pipelines, orchestration logic, inter-agent communication protocols, or stateful multi-step autonomous workflows.

## Overview

This skill covers the full architecture and operational logic of multi-agent systems: decomposing goals into dependency-ordered subtask graphs, designing a stateless orchestration layer that schedules and routes without becoming a bottleneck, establishing inter-agent communication protocols matched to failure-tolerance requirements, managing shared state across agent lifecycles, and harnessing emergent collective behavior. The goal is not merely to run multiple agents in parallel — it is to produce system-level outputs that surpass what any individual agent could achieve through specialization-induced error cancellation and coordinated parallelism. The system's power derives from agents with non-overlapping blind spots structurally exposing each other's mistakes, governed by autonomy ceilings calibrated per action reversibility and all persistent state externalized to shared stores.

## When to Use

- The task has distinct cognitive phases (planning, execution, verification) that benefit from specialized agents rather than one generalist agent attempting all phases sequentially
- The goal can be partitioned into parallel workstreams with clear dependency ordering, where serialization would waste time or capacity
- A single model's context window, rate limits, or capability profile is insufficient to handle the full task end-to-end
- The workflow requires a critic or reviewer agent to catch errors the generator agent cannot reliably self-detect (specialization-induced error cancellation)
- You are designing, debugging, or optimizing a pipeline where agents must hand off state, results, or instructions to one another across lifecycles
- The task involves irreversible or high-stakes actions requiring autonomy-level controls — gating certain agent steps behind human approval regardless of agent competence

## Core Workflow

1. Define the goal and identify natural cognitive phase boundaries — separate planning, execution, and review into distinct agent roles with non-overlapping prompts and reasoning styles
2. Decompose the goal into a dependency-ordered directed acyclic graph (DAG) of subtasks, scoping each node to a single agent's capability profile; validate for cycles before any agent is invoked
3. Run topological sort on the DAG to produce parallel execution waves — tasks in each wave share no dependencies and can run concurrently; maximize average wave width as the concrete parallelism target
4. Design the orchestration layer as a stateless dependency-resolving router: it receives tasks, checks the shared store for completed dependencies, schedules ready agents, and routes outputs — it persists nothing internally
5. Select inter-agent communication patterns per failure-tolerance requirements: synchronous RPC for tight coupling, async message queues for decoupling (with correlation IDs for traceability), or shared blackboard for emergent coordination
6. Externalize all state to a shared store using explicit context-passing contracts — each agent receives only the resolved outputs of its declared dependencies, not full pipeline history, to prevent token bloat
7. Calibrate autonomy ceilings per action reversibility: high autonomy (0.8–1.0) for read-only or easily undone actions; very low autonomy (0.0–0.2) with mandatory human escalation gates for irreversible external actions
8. Aggregate outputs using logic that surfaces disagreements rather than averaging them away — genuine emergence requires non-overlapping error distributions and meaningful aggregation, not just agent count

## Key Patterns

### Stateless Orchestrator
The orchestration layer must function as a pure dependency-resolving router — holding zero task state internally. All persistent state (task history, in-flight results, agent outputs) lives in an external shared store. This eliminates the orchestrator as a single point of failure, enables horizontal scaling, and permits mid-run replacement without task loss. If your orchestrator crashes and you lose work, it has accumulated state it should not hold.

### DAG Validation First
Run cycle detection (Kahn's algorithm) on the task graph before invoking any agent. A cycle is not a runtime error to recover from — it is logically unsolvable by any scheduler. Treat a cyclic graph as malformed input. The diagnostic is simple: if topological sort does not consume all nodes, a cycle exists and the submitted task graph must be rejected and redesigned.

### Wave-Width Optimization
After topological sort, compute the width of each execution wave. A pipeline producing many waves of width one has been over-serialized and might as well be a single-agent chain. Maximizing average wave width — subject to correctness — is the concrete optimization target for task decomposition. This can be computed cheaply on the DAG before any agent is invoked, making it a free pre-flight check.

### Granularity Calibration
Task granularity is the primary performance lever and creates an invisible envelope no amount of agent capability can escape. Too fine: coordination overhead (message passing, context loading, result aggregation) dominates actual work. Too coarse: parallelism gains are forfeited. Measure coordination overhead as a fraction of total wall-clock time — if it exceeds ~20%, tasks are too fine-grained for the communication pattern in use.

### Correlation IDs for Async Traceability
Every asynchronous request must carry a unique correlation ID that is echoed in the response. Without it, async pipelines become undebuggable when messages arrive out of order. Correlation IDs also enable post-mortem causal reconstruction: the full trace of a pipeline run can be reassembled from the shared store by following correlation IDs through the message log.

### Autonomy-Reversibility Calibration
Autonomy ceilings must be set per action, not per agent. An agent that has been flawless all session should still require human approval before deleting a file or writing to an external API — because the calibration is a function of the action's reversibility, not the agent's track record. Read-only queries: high autonomy (0.8–1.0). Irreversible external writes, deletions, financial transactions: very low autonomy (0.0–0.2) with an explicit human escalation gate in the pipeline graph.

### Context-Passing Contracts
Each agent should receive only the resolved outputs of its declared dependencies — never the full pipeline conversation history. Define explicit input/output schemas per agent role and enforce them at the orchestrator routing layer. This prevents token bloat, context window exhaustion, and injection of irrelevant noise into downstream reasoning, which is a subtle but common source of quality degradation in long pipelines.

### Specialization-Induced Error Cancellation
Assign planning, execution, and review to separate agents with genuinely distinct prompts and reasoning styles. When one agent both generates and verifies its own output, it tends to reproduce the same errors in both passes — its blind spots are correlated. A separate reviewer with a different prompt structure has non-overlapping blind spots, making it structurally more likely to catch the generator's systematic errors. This is the core quality argument for multi-agent over single-agent, and it requires meaningful role differentiation, not superficial prompt variation.

## Edge Cases & Warnings

- ⚠️ Cycle introduction during dynamic task expansion: if agents can emit new subtasks at runtime (dynamic DAG expansion), revalidate the full graph after each expansion before scheduling new waves — a runtime-added edge can introduce a cycle into a previously valid graph
- ⚠️ Granularity over-splitting: decomposing into too many fine-grained subtasks causes coordination overhead to dominate compute; monitor coordination overhead as a fraction of wall-clock time and coarsen granularity if it exceeds acceptable thresholds
- ⚠️ Async message ordering hazards: async message queues decouple agents but introduce ordering hazards — a slow agent completing wave N tasks late can deliver results after wave N+1 has already started; always key results to correlation IDs and task IDs, never to arrival order
- ⚠️ Shared blackboard write contention: when multiple agents write to the same shared memory store concurrently, race conditions can corrupt state; use atomic writes, versioned keys, or per-agent namespaced regions to prevent contention
- ⚠️ Context bleed between agents: passing full conversation history rather than resolved dependency outputs injects upstream noise into downstream reasoning; enforce context-passing contracts at the orchestrator layer, not as a convention agents are trusted to follow
- ⚠️ Autonomy ceiling bypass through indirect actions: an agent with low autonomy for direct file deletion may achieve the same effect through a sequence of permitted intermediate actions; autonomy controls must be applied to the effect class of an action, not just its surface-level label
- ⚠️ False emergence through averaging: aggregation logic that averages or majority-votes agent outputs can suppress minority-correct answers and destroy the error-cancellation benefit; use aggregation strategies that surface and preserve disagreements for downstream resolution
- ⚠️ Orchestrator state accumulation drift: over time, orchestrators often accumulate cached task state for performance reasons; audit orchestrator memory footprint regularly to ensure state has not crept back in, which re-introduces the single-point-of-failure risk the pattern was designed to eliminate

## Quick Reference

- Stateless orchestrator: routes and schedules only — all state lives in the external shared store, never inside the orchestrator
- DAG first: validate for cycles before invoking any agent; a cyclic graph is logically unsolvable, not just slow
- Topological sort → execution waves: wave width = parallelism potential; many width-1 waves = over-serialized pipeline
- Granularity diagnostic: measure coordination overhead / total wall-clock time; above ~20% means tasks are too fine-grained
- Async → always use correlation IDs; shared blackboard → guard writes against contention; sync → expect instant failure propagation
- Autonomy ceiling = f(action reversibility), not f(agent competence); irreversible actions always require human escalation gate
- Context-passing contracts: each agent receives only resolved outputs of its declared dependencies, never full pipeline history
- Error cancellation requires genuinely distinct prompts and reasoning styles per role — superficial variation does not break error correlation
- Aggregation must surface disagreements, not average them away — majority voting can suppress the minority-correct answer
- Critical path = longest dependency chain by duration; optimizing it is the highest-leverage scheduling intervention

---

## Resources

### 📎 dag-execution-reference.md
_Complete reference for DAG construction, cycle detection, topological sort, and parallel wave scheduling with annotated Python implementations_

# DAG Execution Reference

## Core Concepts

A Directed Acyclic Graph (DAG) is the formal data structure underlying all multi-agent task scheduling. Nodes represent subtasks; directed edges encode 'must complete before' relationships. The acyclic constraint is not a convenience — it is the formal definition of schedulability. Any cycle makes the graph logically unsolvable by any scheduler.

## Cycle Detection (Kahn's Algorithm)

python
from collections import defaultdict, deque

class DAG:
    def __init__(self):
        self.edges = defaultdict(set)
        self.nodes = set()

    def add_edge(self, from_node: str, to_node: str):
        self.nodes.update([from_node, to_node])
        self.edges[from_node].add(to_node)

    def has_cycle(self) -> bool:
        in_degree = {n: 0 for n in self.nodes}
        for src in self.edges:
            for dst in self.edges[src]:
                in_degree[dst] += 1
        queue = deque(n for n in self.nodes if in_degree[n] == 0)
        visited = 0
        while queue:
            node = queue.popleft()
            visited += 1
            for neighbor in self.edges[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        return visited != len(self.nodes)

    def validate(self):
        if self.has_cycle():
            raise ValueError("DAG contains a cycle — dependency resolution will deadlock")
        print("DAG is valid: no cycles detected")


**Rule:** Run `validate()` before invoking any agent. Treat cycles as malformed input, not runtime errors to recover from.

## Topological Sort → Parallel Execution Waves

python
def topological_waves(tasks: dict[str, list[str]]) -> list[list[str]]:
    """
    tasks: {task_id: [dependency_ids]}
    Returns list of waves; tasks in each wave can run in parallel.
    """
    in_degree = {t: 0 for t in tasks}
    dependents = defaultdict(list)

    for task, deps in tasks.items():
        for dep in deps:
            in_degree[task] += 1
            dependents[dep].append(task)

    waves = []
    ready = deque(t for t, deg in in_degree.items() if deg == 0)

    while ready:
        wave = list(ready)
        waves.append(wave)
        ready.clear()
        for task in wave:
            for dependent in dependents[task]:
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    ready.append(dependent)

    if sum(len(w) for w in waves) != len(tasks):
        raise ValueError("Cycle detected — not all tasks were scheduled")

    return waves

# Example output for article writing pipeline:
# Wave 1 (parallel): ['research']
# Wave 2 (parallel): ['outline']
# Wave 3 (parallel): ['draft_intro', 'draft_body']   <-- parallelism!
# Wave 4 (parallel): ['draft_conc']
# Wave 5 (parallel): ['review']


## Critical Path Computation

The critical path is the longest chain of dependencies by estimated duration. Shortening it is the highest-leverage scheduling optimization.

python
def compute_critical_path(tasks: list, by_id: dict) -> list[str]:
    memo = {}
    def longest(tid):
        if tid in memo:
            return memo[tid]
        task = by_id[tid]
        if not task.depends_on:
            memo[tid] = task.estimated_duration
        else:
            memo[tid] = task.estimated_duration + max(longest(d) for d in task.depends_on)
        return memo[tid]
    for t in tasks:
        longest(t.id)
    critical_end = max(tasks, key=lambda t: memo[t.id])
    path, current = [], critical_end.id
    while current:
        path.append(current)
        task = by_id[current]
        current = max(task.depends_on, key=lambda d: memo[d], default=None) if task.depends_on else None
    return list(reversed(path))


## Wave Width as Parallelism Diagnostic

| Average Wave Width | Interpretation | Action |
|---|---|---|
| > 3 | Good parallelism | Monitor coordination overhead |
| 1–2 | Under-parallelized | Review dependency ordering for unnecessary serialization |
| Mostly 1 | Effectively single-agent chain | Redesign decomposition or reconsider multi-agent approach |

## Dynamic DAG Safety Rule

If agents can emit new subtasks at runtime, revalidate the full graph after each expansion before scheduling new waves. A runtime-added edge can introduce a cycle into a previously valid graph.


### 📎 orchestration-patterns-reference.md
_Stateless orchestrator implementation, inter-agent communication patterns (sync/async/blackboard), and correlation ID usage with code examples_

# Orchestration Patterns Reference

## Stateless Orchestrator Pattern

The orchestrator is a pure dependency-resolving router. It holds zero task state internally. All persistent state lives in an external shared store.

python
import asyncio
from dataclasses import dataclass, field
from typing import Callable

@dataclass
class Task:
    id: str
    agent_fn: Callable
    payload: str
    depends_on: list[str] = field(default_factory=list)

class StatelessOrchestrator:
    """Holds zero task state internally — all state lives in shared_store."""

    async def run(self, tasks: list[Task], shared_store: dict) -> dict:
        pending = {t.id: t for t in tasks}
        while pending:
            ready = [
                t for t in pending.values()
                if all(dep in shared_store for dep in t.depends_on)
            ]
            if not ready:
                raise RuntimeError("Deadlock: no tasks are ready — possible cycle or missing dependency")
            results = await asyncio.gather(
                *[t.agent_fn(shared_store.get(t.depends_on[-1], t.payload))
                  for t in ready]
            )
            for task, result in zip(ready, results):
                shared_store[task.id] = result  # state lives HERE, not in orchestrator
                del pending[task.id]
        return shared_store


**Why stateless?** If the orchestrator crashes, no work is lost — all results are in the shared store. A replacement orchestrator can resume by reading the store and re-evaluating which tasks are pending. This also enables horizontal scaling: run two orchestrators simultaneously without coordination.

## Inter-Agent Communication Patterns

### Pattern 1: Synchronous (RPC-style)

python
def sync_agent_call(payload: str) -> str:
    """Caller blocks until result is returned."""
    return some_agent_function(payload)


**Use when:** Tight coupling is acceptable; failure should propagate immediately; latency of downstream work is bounded by this call.

**Failure mode:** Agent failure propagates instantly and blocks the caller. One slow agent stalls the entire pipeline.

### Pattern 2: Asynchronous Message Queue

python
import asyncio
import uuid

request_queue = asyncio.Queue()
result_store = {}

async def async_producer(payload: str) -> str:
    correlation_id = str(uuid.uuid4())
    await request_queue.put((correlation_id, payload))
    # Caller continues other work; checks result_store later by correlation_id
    return correlation_id

async def async_worker():
    while True:
        correlation_id, payload = await request_queue.get()
        result = f"processed: {payload}"
        result_store[correlation_id] = result
        request_queue.task_done()


**Use when:** Agents should be decoupled; caller can do other work while waiting; high throughput is required.

**Failure mode:** Ordering hazards — results may arrive out of order. Always key results to correlation IDs, never to arrival order. A slow agent completing late can deliver results after downstream waves have already started.

### Pattern 3: Shared Blackboard

python
# Shared namespace-keyed store
blackboard = {}

def agent_write(agent_id: str, key: str, value):
    """Agents write to their own namespace to prevent contention."""
    blackboard[f"{agent_id}:{key}"] = value

def agent_read(agent_id: str, key: str):
    return blackboard.get(f"{agent_id}:{key}")


**Use when:** Agents need to coordinate emergently without explicit message passing; complex state needs to be shared across many consumers.

**Failure mode:** Write contention races when multiple agents write to the same key simultaneously. Use atomic writes, versioned keys, or per-agent namespaced regions.

## Communication Pattern Selection Guide

| Requirement | Recommended Pattern |
|---|---|
| Instant failure propagation needed | Synchronous RPC |
| High throughput, decoupled agents | Async message queue + correlation IDs |
| Emergent coordination, complex shared state | Shared blackboard with namespacing |
| Audit trail required | Async queue (correlation IDs enable full trace reconstruction) |
| Lowest latency for simple pipelines | Synchronous RPC |

## Correlation ID Protocol

Every async request must carry a unique correlation ID echoed in the response.

python
import uuid

def make_request(payload: str) -> tuple[str, dict]:
    correlation_id = str(uuid.uuid4())
    message = {
        "correlation_id": correlation_id,
        "payload": payload,
        "timestamp": ...
    }
    return correlation_id, message

def handle_response(response: dict, pending: dict):
    cid = response["correlation_id"]
    if cid not in pending:
        raise ValueError(f"Unknown correlation_id: {cid}")
    original_request = pending.pop(cid)
    return original_request, response["result"]


**Without correlation IDs:** Async pipelines become undebuggable when messages arrive out of order. Post-mortem causal reconstruction is impossible. Treat missing correlation IDs as a protocol violation, not a warning.


### 📎 autonomy-safety-reference.md
_Autonomy-reversibility calibration framework, human escalation gate design, and context-passing contract patterns for safe multi-agent deployment_

# Autonomy & Safety Reference

## Autonomy-Reversibility Calibration

Autonomy ceilings must be set per action class, not per agent. An agent's track record is irrelevant to whether a specific action requires human oversight — only the action's reversibility matters.

### Autonomy Level Scale

| Autonomy Level | Range | Appropriate For |
|---|---|---|
| Full autonomy | 0.8–1.0 | Read-only queries, in-memory computation, easily undone formatting |
| Supervised autonomy | 0.5–0.8 | Writes to internal/staging systems, reversible external calls |
| Human-in-loop | 0.2–0.5 | External API writes, sending communications, publishing content |
| Human gate required | 0.0–0.2 | File deletion, financial transactions, irreversible data mutations |

### Implementation Pattern

python
from dataclasses import dataclass
from enum import Enum
from typing import Callable, Any

class ActionClass(Enum):
    READ_ONLY = "read_only"
    INTERNAL_WRITE = "internal_write"
    EXTERNAL_WRITE = "external_write"
    IRREVERSIBLE = "irreversible"

AUTONOMY_CEILING = {
    ActionClass.READ_ONLY: 1.0,
    ActionClass.INTERNAL_WRITE: 0.7,
    ActionClass.EXTERNAL_WRITE: 0.3,
    ActionClass.IRREVERSIBLE: 0.1,
}

@dataclass
class AgentAction:
    name: str
    action_class: ActionClass
    execute_fn: Callable
    payload: Any

def execute_with_autonomy_check(
    action: AgentAction,
    agent_confidence: float,
    human_approval_fn: Callable
) -> Any:
    ceiling = AUTONOMY_CEILING[action.action_class]
    if agent_confidence > ceiling:
        # Confidence exceeds what this action class permits — escalate
        approved = human_approval_fn(action)
        if not approved:
            raise PermissionError(f"Human rejected action: {action.name}")
    return action.execute_fn(action.payload)


**Critical rule:** Apply autonomy controls to the effect class of an action, not its surface label. An agent with low autonomy for 'file deletion' that achieves deletion through a sequence of permitted intermediate steps has bypassed the control. Audit effect classes, not action names.

## Human Escalation Gate in Pipeline Graph

Escalation gates should be first-class nodes in the task DAG, not side-channel checks.

python
async def human_escalation_gate(action_description: str, payload: Any) -> bool:
    """
    Blocks pipeline execution until human approves or rejects.
    Returns True if approved, False if rejected.
    In production: sends notification, waits for webhook callback.
    """
    print(f"\n[HUMAN GATE] Action requires approval: {action_description}")
    print(f"Payload: {payload}")
    response = input("Approve? (yes/no): ").strip().lower()
    return response == "yes"

# In the DAG, irreversible actions have an explicit gate dependency:
task_deps = {
    "draft_email":      [],
    "review_email":     ["draft_email"],
    "human_approval":   ["review_email"],   # gate is a DAG node
    "send_email":       ["human_approval"],  # irreversible action blocked by gate
}


## Context-Passing Contracts

Each agent must receive only the resolved outputs of its declared dependencies. Never pass full pipeline history.

python
@dataclass
class AgentContract:
    agent_id: str
    input_keys: list[str]   # keys to read from shared store
    output_key: str         # key to write result to shared store

def resolve_agent_context(contract: AgentContract, shared_store: dict) -> dict:
    """Build the minimal context for an agent from its declared input keys."""
    missing = [k for k in contract.input_keys if k not in shared_store]
    if missing:
        raise ValueError(f"Agent {contract.agent_id} missing dependencies: {missing}")
    return {key: shared_store[key] for key in contract.input_keys}

# Usage:
reviewer_contract = AgentContract(
    agent_id="reviewer",
    input_keys=["draft_output", "original_brief"],  # only what it needs
    output_key="review_output"
)
context = resolve_agent_context(reviewer_contract, shared_store)
# reviewer receives exactly 2 items, not the full 20-step pipeline history


**Why this matters:** Passing full pipeline history to each agent causes token bloat, context window exhaustion, and injection of irrelevant upstream reasoning into downstream agents. Enforce contracts at the orchestrator routing layer — do not rely on agents to self-limit their context consumption.

## Specialization Requirements for Error Cancellation

For specialization-induced error cancellation to function, agents must have genuinely non-overlapping error distributions:

1. **Distinct system prompts** — generator and reviewer prompts must use different framing, not just different task descriptions
2. **Different reasoning styles** — if possible, use different temperatures or sampling strategies per role
3. **Role-specific blind spots** — a reviewer prompted to adversarially challenge the generator's output will catch more errors than one prompted to 'check for mistakes'
4. **Aggregation that preserves disagreements** — when generator and reviewer disagree, surface the disagreement for resolution rather than defaulting to either output

**Anti-pattern:** Using the same base prompt with minor variations for generator and reviewer roles. This produces correlated errors — the reviewer will reproduce the generator's blind spots because it reasons from the same priors.


---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed — AI Agent Markdown Forge
