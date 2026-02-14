# Multi-Agent Framework

> Trigger when a task is too complex, long, or multifaceted for a single model instance — requiring parallel workstreams, specialized sub-roles (planner, executor, reviewer), or context that exceeds a single agent's capacity. Also trigger when designing or debugging distributed AI pipelines, orchestration logic, inter-agent communication protocols, or stateful multi-step autonomous workflows.

## Overview

This skill covers the full architecture and operational logic of multi-agent systems: how to decompose goals into dependency-ordered subtask graphs, design an orchestration layer that schedules and routes without becoming a bottleneck, establish inter-agent communication protocols that match failure tolerance requirements, manage shared state across agent lifecycles, and harness emergent collective behavior. The goal is not just to run multiple agents — it is to produce system-level outputs that surpass what any individual agent could achieve through specialization-induced error cancellation and coordinated parallelism.

## When to Use

- The task has distinct cognitive phases (planning, execution, verification) that benefit from specialized agents rather than one generalist agent attempting all phases sequentially.
- The goal can be partitioned into parallel workstreams with clear dependency ordering, where serialization would waste time or capacity.
- A single model's context window, rate limits, or capability profile is insufficient to handle the full task end-to-end.
- The workflow requires a critic or reviewer agent to catch errors the generator agent cannot reliably self-detect.
- You are designing, debugging, or optimizing a pipeline where agents must hand off state, results, or instructions to one another across lifecycles.
- The task involves irreversible or high-stakes actions requiring autonomy-level controls (e.g., gating certain agent steps behind human approval).

## Core Workflow

1. Define the goal and identify natural decomposition boundaries — separate cognitive modes (plan, execute, verify), parallel workstreams, and dependency ordering before writing any agent code.
2. Design the task graph using topological structure: group subtasks into parallel execution waves, ensure each subtask is scoped to a single agent's capability profile, and flag tasks with irreversible effects for lower autonomy ceilings.
3. Implement the orchestration layer as a stateless router — it resolves dependencies, schedules agents, and routes messages, but pushes all state into agents or a shared store so the orchestrator itself is not a single point of failure.
4. Choose the communication pattern per task type: synchronous calls for tight, latency-sensitive handoffs; async message queues for decoupled parallel workstreams; shared blackboard/store for emergent coordination across many agents. Match the pattern to the failure mode you can tolerate.
5. Implement state and context management so every agent receives the minimum necessary context (task description + resolved dependency outputs) without redundant full-history replay, preserving coherence without token bloat.
6. Set autonomy levels per agent action based on reversibility: irreversible actions (send email, delete record, make purchase) require lower autonomy ceilings and explicit escalation paths regardless of the agent's general competence.
7. Test the system's failure modes by communication pattern — inject message drops, ordering violations, and write contention to surface bugs that masquerade as logic errors but are actually protocol mismatches.
8. Evaluate emergent output quality against single-agent baseline: if the multi-agent system is not producing meaningfully superior results, the decomposition granularity or specialization boundaries are likely wrong.

## Key Patterns

### Specialization-Induced Error Cancellation
Assign planning, execution, and review to separate agents with distinct prompts and personas. A single agent asked to generate and verify its own work produces correlated errors. Separate agents break that correlation structurally — the reviewer's blind spots do not overlap with the generator's, so systematic mistakes are exposed rather than reinforced.

### Stateless Orchestrator Pattern
The orchestrator should be a pure router: receive task, resolve dependencies, dispatch to agent, collect result, route to next agent. All persistent state lives in agents or a shared store. This allows the orchestrator to be horizontally scaled or replaced mid-run without task loss, eliminating the centralized chokepoint that destroys multi-agent parallelism.

### Topological Execution Waves
After decomposition, sort subtasks into waves using topological ordering. All tasks in a wave have their dependencies satisfied and can execute in parallel. This converts a linear task list into a parallel execution plan without circular dependency risk. Each wave completes before the next begins, preserving logical coherence.

### Correlation ID Tracking
Every inter-agent message should carry a correlation ID linking requests to their responses. This enables async communication patterns where the sender does not block, the receiver processes independently, and the response is matched back to the originating request even if other messages arrive in between. Without this, async pipelines become undebuggable.

### Autonomy-Reversibility Calibration
Autonomy level is not a fixed agent property — it is a function of the action's reversibility. Set autonomy ceilings low for irreversible actions (file deletion, external API writes, financial transactions) regardless of the agent's general capability. Set autonomy high for read-only or easily undone actions to maximize throughput. Hardcoding a single autonomy level for all agent actions is an architectural error.

### Communication Pattern as Failure Mode Selector
The choice between synchronous calls, async message queues, and shared blackboards determines which failure modes the system is vulnerable to — not just which it can handle. Sync calls: instant failure propagation, agent blocking. Async queues: decoupled agents, invisible lag and ordering hazards. Shared blackboard: emergent coordination, write-contention races. Choose the pattern whose failure mode you can detect and recover from, not the one that seems simplest.

### Decomposition as First-Class Design Problem
Task decomposition granularity is the largest single determinant of multi-agent performance and is almost always underdesigned. Too fine-grained: coordination overhead dominates compute. Too coarse-grained: parallelism is lost. The advanced pattern is to make decomposition itself an agent call — passing the high-level goal and available agent capabilities to an LLM that produces the optimal subtask graph at runtime, not at design time.

## Edge Cases & Warnings

- ⚠️ Circular dependencies in the task graph will deadlock the orchestrator's dependency resolver — always validate the subtask graph is a DAG before scheduling. Inject cycle detection (raise on empty wave with remaining tasks) as a hard guard.
- ⚠️ Async message queues create invisible ordering hazards: if Agent B receives a message before Agent A's prerequisite result arrives, it may act on stale context. Always attach dependency metadata to messages, not just payloads.
- ⚠️ Shared blackboard state introduces write-contention races when multiple agents attempt to update the same key simultaneously. Use optimistic locking or versioned writes, and treat unexpected overwrites as a signal of decomposition error (two agents should not own the same state key).
- ⚠️ High autonomy agents propagate errors further before detection — a wrong decision early in the pipeline may produce plausible-looking downstream results that mask the root cause. Build in mandatory review checkpoints after any agent action that affects subsequent agents' inputs.
- ⚠️ Emergent collective behavior is not guaranteed — agents that are too similar in capability or prompt design will produce correlated errors just like a single agent. If multi-agent output quality does not exceed single-agent baseline, audit role specialization and prompt differentiation first.
- ⚠️ Orchestrator statefulness is a scaling trap: if the orchestrator stores task history, in-flight state, or agent results in memory, it becomes a single point of failure and cannot be restarted or scaled horizontally. Always externalize state to a shared store from day one.
- ⚠️ Context window pollution across long agent chains: passing full task history to every downstream agent inflates token costs and can exceed context limits. Design context-passing contracts so each agent receives only the outputs of its declared dependencies, not the full pipeline history.

## Quick Reference

- Multi-agent = specialization + orchestration + communication + state. Missing any one produces a distributed monolith, not a true multi-agent system.
- Orchestrator rule: stateless router, not stateful manager. State belongs in agents or a shared store.
- Decompose into a DAG, schedule into topological waves, run each wave in parallel.
- Autonomy ceiling = f(reversibility of action), not f(general agent competence).
- Sync call → instant failure propagation + blocking. Async queue → decoupled + ordering risk. Shared blackboard → emergent coordination + write races. Choose by failure mode, not convenience.
- Always attach correlation IDs to async messages. Always validate no circular dependencies before scheduling.
- Specialization breaks correlated errors. If planner, executor, and reviewer share the same blind spots, they are not truly specialized.
- If multi-agent output does not exceed single-agent baseline, the decomposition granularity or role specialization is wrong — not the agents.
- Emergent collective behavior is a result of good architecture, not a property of having multiple agents. It must be designed for.
- Decomposition granularity is the highest-leverage, most under-designed variable in multi-agent systems. Consider making decomposition itself an agent.

---

## Resources

### 📎 multi-agent-architecture-reference.md
_Complete reference covering system architecture patterns, orchestration design, communication protocols, state management strategies, and annotated code examples for each core concept in the multi-agent framework._

# Multi-Agent Framework — Architecture Reference

## Core Thesis

A multi-agent framework distributes complex tasks across autonomous AI agents, each specialized in distinct capabilities, coordinated through an orchestration layer that decomposes goals, routes communication, and aggregates results. Agents collaborate via structured inter-agent communication protocols and shared state management, allowing the system to maintain coherent context across the full task lifecycle. The interactions among agents give rise to emergent collective behavior, producing outcomes that surpass what any individual agent could achieve in isolation.

---

## Concept Cluster 1: System Architecture & Control

### Multi-Agent Framework (Core Concept)

A distributed architecture where multiple autonomous agents collaborate through defined roles and communication mechanisms to accomplish tasks beyond any single model's capacity.

**Key insight:** The greatest leverage is not parallelism — it is specialization-induced error cancellation. When a planner, executor, and critic are separate agents, each optimized for its own cognitive style, systematic blind spots in one are structurally exposed to a different agent's perspective. A single agent asked to both generate and verify its own work suffers from correlated errors; a multi-agent system breaks that correlation by design.

**Analogy:** A film production crew. The director (orchestrator) doesn't act, light, or edit — but ensures the cinematographer, sound engineer, and editor each know their scene and hand off their work at exactly the right moment. The movie that results is something none of them could have made alone.

python
import asyncio
from dataclasses import dataclass, field
from typing import Callable, Any

@dataclass
class Message:
    sender: str
    content: Any

@dataclass
class Agent:
    name: str
    role: Callable
    inbox: asyncio.Queue = field(default_factory=asyncio.Queue)

    async def run(self, outbox: asyncio.Queue):
        msg = await self.inbox.get()
        result = self.role(msg.content)
        await outbox.put(Message(sender=self.name, content=result))

def planner(task: str) -> dict:
    return {"plan": f"Steps to complete: {task}", "subtasks": [task + " [step 1]", task + " [step 2]"]}

def executor(plan: dict) -> list:
    return [f"Executed: {s}" for s in plan["subtasks"]]

def reviewer(results: list) -> str:
    return "APPROVED: " + " | ".join(results)

async def run_pipeline(task: str):
    relay = asyncio.Queue()
    agents = [Agent("Planner", planner), Agent("Executor", executor), Agent("Reviewer", reviewer)]
    await agents[0].inbox.put(Message("User", task))
    for i, agent in enumerate(agents):
        next_queue = agents[i + 1].inbox if i + 1 < len(agents) else relay
        await agent.run(next_queue)
    final = await relay.get()
    print(f"Final output from {final.sender}: {final.content}")

asyncio.run(run_pipeline("Analyze quarterly sales data"))


---

### Orchestration Layer

The supervisory control mechanism that decomposes high-level goals, schedules agents, routes inter-agent messages, and aggregates outputs into a coherent final result.

**Key insight:** The orchestration layer is simultaneously the single greatest bottleneck and the single greatest point of leverage. Because all task routing flows through it, a naive orchestrator creates a centralized chokepoint that destroys the parallelism multi-agent systems promise. Orchestrators should be stateless routers — pushing state into agents or shared stores so the orchestrator itself can be horizontally scaled or replaced mid-run without task loss.

**Analogy:** An airport hub. Planes (agents) don't decide their own routes in response to every passenger request — a central control tower tracks all aircraft, manages sequencing, prevents collisions, and ensures every flight connects to the right gate at the right time.

python
from dataclasses import dataclass, field
from typing import Callable

@dataclass
class Task:
    id: str
    description: str
    depends_on: list = field(default_factory=list)

@dataclass
class AgentWorker:
    name: str
    skill: str
    execute: Callable

class Orchestrator:
    def __init__(self, agents: list):
        self.agents = {a.skill: a for a in agents}
        self.results = {}

    def _resolve(self, task: Task, all_tasks: dict) -> str:
        for dep_id in task.depends_on:
            if dep_id not in self.results:
                self._resolve(all_tasks[dep_id], all_tasks)
        dep_results = {d: self.results[d] for d in task.depends_on}
        agent = self.agents.get(task.id.split("_")[0])
        if not agent:
            raise ValueError(f"No agent for task {task.id}")
        result = agent.execute(task.description, dep_results)
        self.results[task.id] = result
        print(f"  [{agent.name}] {task.id}: {result}")
        return result

    def run(self, tasks: list) -> dict:
        task_map = {t.id: t for t in tasks}
        print("Orchestrator running...")
        for task in tasks:
            if task.id not in self.results:
                self._resolve(task, task_map)
        return self.results


---

### Task Decomposition

The process of partitioning a complex goal into a dependency-ordered graph of subtasks, each scoped to match specific agent capabilities.

**Key insight:** Task decomposition quality is the single largest determinant of multi-agent system performance, yet it is almost never treated as a first-class design problem. Poor decomposition creates tasks that are too fine-grained (drowning agents in coordination overhead) or too coarse-grained (preventing parallelism). The advanced pattern: make decomposition itself an agent, because the right granularity depends on runtime context, available agent capabilities, and task complexity that cannot be fully anticipated at design time.

**Analogy:** A chef reading a complex recipe before cooking, not during. A skilled chef looks at the full dish, identifies what takes longest, and starts those first — braising meat while chopping vegetables. The sequence isn't obvious from reading top-to-bottom; it requires understanding the dependency structure of the whole before touching a single ingredient.

python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class SubTask:
    id: str
    description: str
    depends_on: list = field(default_factory=list)
    result: Optional[str] = None

class TaskDecomposer:
    def decompose(self, goal: str) -> list:
        # In production: call LLM to generate this graph from 'goal'
        return [
            SubTask("t1", f"Clarify scope of: {goal}"),
            SubTask("t2", "Gather relevant data",         depends_on=["t1"]),
            SubTask("t3", "Perform statistical analysis", depends_on=["t2"]),
            SubTask("t4", "Identify key findings",        depends_on=["t3"]),
            SubTask("t5", "Draft report introduction",    depends_on=["t1"]),  # Parallel with t2-t4
            SubTask("t6", "Compile final report",         depends_on=["t4", "t5"]),
        ]

    def schedule(self, tasks: list) -> list:
        """Topological sort into parallel execution waves."""
        completed, waves = set(), []
        remaining = list(tasks)
        while remaining:
            wave = [t for t in remaining if all(d in completed for d in t.depends_on)]
            if not wave:
                raise ValueError("Circular dependency detected")
            waves.append(wave)
            completed.update(t.id for t in wave)
            remaining = [t for t in remaining if t.id not in completed]
        return waves

decomposer = TaskDecomposer()
tasks = decomposer.decompose("Evaluate customer churn in Q3")
waves = decomposer.schedule(tasks)
print("Execution plan (each wave can run in parallel):")
for i, wave in enumerate(waves):
    print(f"  Wave {i+1}: {[t.id + ': ' + t.description[:30] for t in wave]}")


---

## Concept Cluster 2: Agent Interaction & Communication

### Agent Autonomy

The capacity of an individual agent to independently perceive, reason, and act across a task without requiring step-by-step human or orchestrator intervention.

**Key insight:** Autonomy level is not just an efficiency dial — it is a risk surface control. Higher autonomy compresses latency and scales throughput, but errors propagate further before a human can intercept them. The optimal autonomy level for any agent is a function of the cost asymmetry between the task's reversibility and the cost of human interruption. Irreversible actions (sending emails, making purchases, deleting data) should always carry a lower autonomy ceiling than reversible ones, regardless of the agent's general competence.

**Analogy:** The difference between a junior intern who needs sign-off before sending any email, and a seasoned contractor who runs the whole project and only surfaces decisions that genuinely require the client's judgment. The intern isn't less capable per task — they're less trusted to know *which* tasks need escalation.

python
import random
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Environment:
    tasks: list = field(default_factory=lambda: ["fetch_data", "clean_data", "analyze", "report"])
    completed: list = field(default_factory=list)

    def observe(self) -> Optional[str]:
        remaining = [t for t in self.tasks if t not in self.completed]
        return remaining[0] if remaining else None

    def execute(self, action: str) -> str:
        self.completed.append(action)
        return f"Completed: {action}"

@dataclass
class AutonomousAgent:
    name: str
    autonomy_level: float  # 0.0 = fully supervised, 1.0 = fully autonomous

    def decide(self, observation: Optional[str]) -> Optional[str]:
        if observation is None:
            return None
        if random.random() > self.autonomy_level:
            print(f"  [{self.name}] Requesting human approval for: {observation}")
            return None
        return observation

def simulate(autonomy: float, steps: int = 6):
    env = Environment()
    agent = AutonomousAgent("WorkerBot", autonomy_level=autonomy)
    print(f"\nAutonomy level: {autonomy:.0%}")
    for _ in range(steps):
        obs = env.observe()
        if obs is None:
            print("  All tasks done."); break
        action = agent.decide(obs)
        if action:
            print(f"  {env.execute(action)}")

simulate(autonomy=0.3)
simulate(autonomy=0.9)


---

### Inter-Agent Communication

Structured protocols — synchronous calls, async queues, or shared memory — through which agents exchange data and instructions to coordinate work and propagate context.

**Key insight:** The choice of communication pattern determines the failure mode of the entire system. Synchronous calls propagate failures instantly and block agents unnecessarily. Async queues decouple agents but create invisible message lag and ordering hazards. Shared blackboards allow emergent coordination but introduce write-contention races. Most multi-agent bugs are not logic errors — they are communication pattern mismatches disguised as logic errors.

**Analogy:** A well-run hospital's paging system crossed with a nurse handoff note. Doctors don't wander the halls looking for each other — they send structured pages (requests) with patient IDs (correlation IDs), receive acknowledgments, and leave written notes (shared state) so the next shift knows exactly where treatment stands, even if the original doctor is gone.

python
import json
import queue
from dataclasses import dataclass
from typing import Any

@dataclass
class Message:
    sender: str
    recipient: str
    msg_type: str   # 'request' | 'response' | 'broadcast'
    payload: Any
    correlation_id: str

class MessageBus:
    def __init__(self):
        self._queues: dict = {}

    def register(self, agent_name: str):
        self._queues[agent_name] = queue.Queue()

    def send(self, msg: Message):
        print(f"  BUS: {msg.sender} -> {msg.recipient} [{msg.msg_type}] {json.dumps(msg.payload)[:60]}")
        if msg.recipient == "*":  # Broadcast
            for q in self._queues.values():
                q.put(msg)
        else:
            self._queues[msg.recipient].put(msg)

    def receive(self, agent_name: str, timeout: float = 1.0):
        try:
            return self._queues[agent_name].get(timeout=timeout)
        except queue.Empty:
            return None

# Usage
bus = MessageBus()
for name in ["planner", "executor", "reviewer"]:
    bus.register(name)

bus.send(Message("planner", "executor", "request", {"task": "run regression model"}, "corr-001"))
msg = bus.receive("executor")
if msg:
    bus.send(Message("executor", msg.sender, "response", {"result": "R2=0.94, p<0.01"}, msg.correlation_id))
msg = bus.receive("planner")
if msg:
    bus.send(Message("planner", "*", "broadcast", {"summary": f"Task done: {msg.payload['result']}"}, "corr-002"))


---

### State & Context Management

The storage, retrieval, and synchronization of memory, task history, and intermediate outputs across agent lifecycles to ensure coherent, non-redundant task execution.

**Key insight:** Context-passing contracts are critical. Each agent should receive only the outputs of its declared dependencies — not the full pipeline history. Full-history replay inflates token costs, can exceed context limits, and introduces irrelevant noise into each agent's reasoning. Design explicit input/output schemas per agent role from the start.

**Principles:**
- Store state externally (shared store, database, or message payload), never inside the orchestrator
- Version or timestamp shared state entries to detect staleness
- Each agent declares its input dependencies and output contract explicitly
- Intermediate outputs are immutable once written — agents append, never overwrite

---

## Concept Cluster 3: Emergent System Capability

### Emergent Collective Behavior

System-level capabilities that arise from agent interactions and exceed what any individual agent could produce alone, making the whole greater than the sum of its parts.

**Key insight:** Emergent collective behavior is not guaranteed by having multiple agents — it must be designed for. Agents that are too similar in capability or prompt design will produce correlated errors just like a single agent. True emergence requires genuine role differentiation: distinct prompts, distinct reasoning styles, and distinct failure modes per agent so that one agent's weaknesses are another's strengths.

**Conditions required for genuine emergence:**
1. Agents have meaningfully different specializations (not just different names)
2. Agents' error distributions are non-overlapping (a reviewer must be capable of catching what a generator misses)
3. Communication protocols preserve intermediate reasoning, not just final outputs
4. The orchestrator aggregates results in a way that surfaces disagreements, not just majorities

---

## Communication Pattern Decision Matrix

| Pattern | Best For | Failure Mode | Recovery Strategy |
|---|---|---|---|
| Synchronous call | Tight dependency, low latency | Instant failure propagation, agent blocking | Circuit breaker, timeout with fallback |
| Async message queue | Parallel workstreams, high throughput | Invisible lag, message ordering violations | Correlation IDs, sequence numbers, idempotent handlers |
| Shared blackboard | Emergent coordination, many-to-many | Write-contention races, stale reads | Versioned writes, optimistic locking, read-your-writes consistency |

---

## Autonomy Level Guidelines

| Action Type | Reversibility | Recommended Autonomy Ceiling |
|---|---|---|
| Read-only operations | Fully reversible | High (0.8–1.0) |
| Draft generation | Easily revised | High (0.7–0.9) |
| Internal state writes | Recoverable | Medium (0.5–0.7) |
| External API writes | Partially reversible | Low (0.2–0.5) |
| Irreversible actions (delete, send, purchase) | Not reversible | Very low (0.0–0.2), human gate required |

---

## Glossary

**Multi-Agent Framework:** A distributed architecture where multiple autonomous agents collaborate through defined roles and communication mechanisms to accomplish tasks beyond any single model's capacity.

**Agent Autonomy:** The capacity of an individual agent to independently perceive, reason, and act across a task without requiring step-by-step human or orchestrator intervention.

**Orchestration Layer:** The supervisory control mechanism that decomposes high-level goals, schedules agents, routes inter-agent messages, and aggregates outputs into a coherent final result.

**Inter-Agent Communication:** Structured protocols — synchronous calls, async queues, or shared memory — through which agents exchange data and instructions to coordinate work and propagate context.

**Task Decomposition:** The process of partitioning a complex goal into a dependency-ordered graph of subtasks, each scoped to match specific agent capabilities.

**Emergent Collective Behavior:** System-level capabilities that arise from agent interactions and exceed what any individual agent could produce alone.

**State & Context Management:** The storage, retrieval, and synchronization of memory, task history, and intermediate outputs across agent lifecycles to ensure coherent, non-redundant task execution.

**Directed Acyclic Graph (DAG):** The data structure used to represent subtask dependencies — nodes are tasks, edges are dependencies, and the acyclic property guarantees no deadlocks.

**Correlation ID:** A unique identifier attached to a request message and carried through to the response, enabling async communication patterns where sender and receiver are decoupled in time.

**Topological Sort:** The algorithm used to convert a DAG of tasks into ordered execution waves where all dependencies of a task are guaranteed to have completed before the task begins.

28,362 chars
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
