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

---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed — AI Agent Markdown Forge
