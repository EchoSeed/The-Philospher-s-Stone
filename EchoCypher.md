# Silent Code Killer Detection

> Activate this skill when analyzing codebases for latent defects, reviewing pull requests, conducting technical debt assessments, or investigating performance degradation without obvious errors. Use during code audits, refactoring planning, system health monitoring, or when symptoms suggest hidden structural problems. Essential for preventing long-term maintainability collapse and resource exhaustion in production systems.

## Overview

This skill equips AI agents to identify, analyze, and remediate silent code killers—latent defects and anti-patterns that degrade software systems without triggering immediate failures. Unlike obvious bugs that crash programs, these hidden problems accumulate as technical debt, slowly consuming resources, creating maintenance bottlenecks, and compromising system reliability. The skill provides pattern recognition for code smells, metrics-based detection, and systematic approaches to prevent architectural decay before it causes critical failures.

## When to Use

- Code reviews reveal unexplained performance degradation or memory growth
- System exhibits intermittent failures that disappear during debugging
- Maintenance velocity decreases despite stable team capacity
- New features require disproportionate effort relative to scope
- Monitoring shows gradual resource consumption trends
- Refactoring efforts trigger cascading changes across modules
- Test coverage exists but production issues persist
- Legacy systems require modernization or technical debt assessment

## Core Workflow

1. **Detection Phase**: Scan code using complexity metrics (cyclomatic complexity >10), identify code smells (duplicated logic, long methods, magic numbers), and analyze resource management patterns for leaks or starvation risks
2. **Classification Phase**: Categorize findings into clusters (Stealth Defects, Architectural Decay, Resource Exhaustion), assess severity using importance scores, and map dependencies between anti-patterns
3. **Prioritization Phase**: Calculate technical debt impact using compound interest model, identify high-leverage refactoring targets, and sequence remediation to minimize disruption
4. **Remediation Phase**: Apply pattern-specific fixes (extract methods, introduce constants, implement proper disposal), add detection instrumentation (logging, metrics), and establish preventive guardrails
5. **Validation Phase**: Verify fixes don't introduce heisenbugs, measure complexity reduction, and confirm resource usage stabilizes

## Key Patterns

### Memory Leak Detection

Identify objects that persist beyond intended lifetime, tracking allocations without corresponding deallocations that cause progressive resource exhaustion.

```python
import weakref
from typing import Dict, Any
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class ResourceTracker:
    """Tracks object allocations to detect memory leaks."""
    allocations: Dict[int, tuple[str, datetime]] = field(default_factory=dict)
    _weak_refs: Dict[int, weakref.ref] = field(default_factory=dict)
    
    def track(self, obj: Any, context: str) -> None:
        """Register object allocation with context."""
        obj_id = id(obj)
        self.allocations[obj_id] = (context, datetime.now())
        
        def cleanup(ref: weakref.ref) -> None:
            if obj_id in self.allocations:
                del self.allocations[obj_id]
        
        self._weak_refs[obj_id] = weakref.ref(obj, cleanup)
    
    def report_leaks(self, threshold_seconds: int = 300) -> list[str]:
        """Identify allocations surviving beyond threshold."""
        leaks = []
        now = datetime.now()
        for obj_id, (context, timestamp) in self.allocations.items():
            age = (now - timestamp).total_seconds()
            if age > threshold_seconds:
                leaks.append(f"Potential leak: {context} (age: {age:.1f}s)")
        return leaks

# Usage example
tracker = ResourceTracker()
data = [1, 2, 3] * 1000
tracker.track(data, "large_list_in_function_x")
# Later: check for leaks
print(tracker.report_leaks(threshold_seconds=60))
```

### Complexity Metric Analysis

Quantify code complexity to identify maintenance hotspots using cyclomatic complexity and cognitive complexity measurements.

```python
import ast
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class ComplexityMetrics:
    """Calculate cyclomatic complexity for Python functions."""
    
    @staticmethod
    def calculate_cyclomatic(node: ast.FunctionDef) -> int:
        """
        Calculate cyclomatic complexity: M = E - N + 2P
        where E = edges, N = nodes, P = connected components
        Simplified: count decision points + 1
        """
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.And, ast.Or)):
                complexity += 1
            elif isinstance(child, ast.ExceptHandler):
                complexity += 1
        return complexity
    
    @staticmethod
    def analyze_file(source_code: str) -> Dict[str, int]:
        """Analyze all functions in a source file."""
        tree = ast.parse(source_code)
        results = {}
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                complexity = ComplexityMetrics.calculate_cyclomatic(node)
                results[node.name] = complexity
        
        return results
    
    @staticmethod
    def identify_hotspots(metrics: Dict[str, int], threshold: int = 10) -> List[str]:
        """Flag functions exceeding complexity threshold."""
        return [
            f"⚠️ {func}: complexity={score} (threshold={threshold})"
            for func, score in metrics.items()
            if score > threshold
        ]

# Example usage
code = """
def complex_function(x, y):
    if x > 0:
        if y > 0:
            for i in range(x):
                if i % 2 == 0:
                    try:
                        result = x / y
                    except ZeroDivisionError:
                        result = 0
    return result
"""

metrics = ComplexityMetrics.analyze_file(code)
hotspots = ComplexityMetrics.identify_hotspots(metrics, threshold=5)
print(hotspots)  # ['⚠️ complex_function: complexity=7 (threshold=5)']
```

### Race Condition Detection

Identify concurrency hazards where execution order determines correctness, using static analysis and runtime monitoring.

```python
import threading
from typing import Any, Callable
from contextlib import contextmanager
import time

class RaceConditionDetector:
    """Monitor shared resource access to detect potential race conditions."""
    
    def __init__(self):
        self._access_log: list[tuple[int, str, float]] = []
        self._log_lock = threading.Lock()
        self._warnings: list[str] = []
    
    @contextmanager
    def monitor_access(self, resource_name: str, operation: str):
        """Context manager tracking resource access timing."""
        thread_id = threading.get_ident()
        start_time = time.time()
        
        with self._log_lock:
            self._access_log.append((thread_id, f"{resource_name}:{operation}:start", start_time))
        
        try:
            yield
        finally:
            end_time = time.time()
            with self._log_lock:
                self._access_log.append((thread_id, f"{resource_name}:{operation}:end", end_time))
                self._detect_overlaps(resource_name)
    
    def _detect_overlaps(self, resource_name: str) -> None:
        """Check for concurrent access to same resource."""
        active_accesses = {}
        
        for thread_id, event, timestamp in self._access_log:
            if resource_name not in event:
                continue
            
            if ":start" in event:
                if resource_name in active_accesses:
                    self._warnings.append(
                        f"Race condition risk: {resource_name} accessed by "
                        f"thread {thread_id} while thread {active_accesses[resource_name]} active"
                    )
                active_accesses[resource_name] = thread_id
            elif ":end" in event and resource_name in active_accesses:
                if active_accesses[resource_name] == thread_id:
                    del active_accesses[resource_name]
    
    def get_warnings(self) -> list[str]:
        """Retrieve detected race condition warnings."""
        return self._warnings.copy()

# Example usage
detector = RaceConditionDetector()
shared_counter = 0

def increment_counter():
    global shared_counter
    with detector.monitor_access("shared_counter", "write"):
        temp = shared_counter
        time.sleep(0.001)  # Simulate processing
        shared_counter = temp + 1

# Simulate concurrent access
threads = [threading.Thread(target=increment_counter) for _ in range(3)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(detector.get_warnings())
```

### Technical Debt Calculator

Quantify accumulated technical debt using compound interest model to prioritize refactoring efforts.

```python
from dataclasses import dataclass
from typing import List
from enum import Enum

class DebtSeverity(Enum):
    LOW = 1.05      # 5% compounding
    MEDIUM = 1.15   # 15% compounding
    HIGH = 1.30     # 30% compounding
    CRITICAL = 1.50 # 50% compounding

@dataclass
class TechnicalDebtItem:
    """Represents a single technical debt issue."""
    name: str
    initial_cost_hours: float
    severity: DebtSeverity
    age_sprints: int
    
    def current_cost(self) -> float:
        """Calculate compounded cost: Cost = Initial * (1 + rate)^time."""
        return self.initial_cost_hours * (self.severity.value ** self.age_sprints)
    
    def interest_accrued(self) -> float:
        """Calculate additional cost due to delay."""
        return self.current_cost() - self.initial_cost_hours

class TechnicalDebtPortfolio:
    """Manage and prioritize technical debt across codebase."""
    
    def __init__(self):
        self.items: List[TechnicalDebtItem] = []
    
    def add_debt(self, name: str, initial_hours: float, 
                 severity: DebtSeverity, age_sprints: int) -> None:
        """Register new technical debt item."""
        self.items.append(TechnicalDebtItem(name, initial_hours, severity, age_sprints))
    
    def total_debt(self) -> float:
        """Calculate total compounded debt across portfolio."""
        return sum(item.current_cost() for item in self.items)
    
    def prioritized_list(self) -> List[tuple[str, float, float]]:
        """Return debt items sorted by current cost (highest first)."""
        prioritized = [
            (item.name, item.current_cost(), item.interest_accrued())
            for item in self.items
        ]
        return sorted(prioritized, key=lambda x: x[1], reverse=True)
    
    def report(self) -> str:
        """Generate debt summary report."""
        lines = [f"Total Technical Debt: {self.total_debt():.1f} hours\n"]
        lines.append("Priority Order:")
        for name, current, interest in self.prioritized_list():
            lines.append(f"  • {name}: {current:.1f}h (interest: +{interest:.1f}h)")
        return "\n".join(lines)

# Example usage
portfolio = TechnicalDebtPortfolio()
portfolio.add_debt("God Object in UserService", 8.0, DebtSeverity.HIGH, 6)
portfolio.add_debt("Memory leak in cache", 4.0, DebtSeverity.CRITICAL, 3)
portfolio.add_debt("Magic numbers in config", 2.0, DebtSeverity.LOW, 10)
portfolio.add_debt("Tight coupling in API layer", 12.0, DebtSeverity.MEDIUM, 4)

print(portfolio.report())
```

### Code Smell Detector

Identify surface-level indicators of deeper structural problems through pattern matching and heuristics.

```python
import ast
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class CodeSmell:
    """Represents detected code smell with location and severity."""
    smell_type: str
    location: str
    severity: int  # 1-10 scale
    suggestion: str

class CodeSmellDetector:
    """Scan Python source for common code smells."""
    
    def __init__(self):
        self.smells: List[CodeSmell] = []
    
    def analyze(self, source_code: str, filename: str = "<string>") -> List[CodeSmell]:
        """Perform comprehensive smell detection."""
        self.smells = []
        tree = ast.parse(source_code, filename)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                self._check_function(node, filename)
            elif isinstance(node, ast.Num):
                self._check_magic_number(node, filename)
            elif isinstance(node, ast.ClassDef):
                self._check_god_object(node, filename)
        
        return self.smells
    
    def _check_function(self, node: ast.FunctionDef, filename: str) -> None:
        """Detect long methods and high parameter counts."""
        # Long method smell
        body_lines = len(node.body)
        if body_lines > 20:
            self.smells.append(CodeSmell(
                smell_type="Long Method",
                location=f"{filename}:{node.lineno}:{node.name}",
                severity=min(10, body_lines // 5),
                suggestion=f"Extract {node.name} into smaller functions (currently {body_lines} statements)"
            ))
        
        # Too many parameters
        param_count = len(node.args.args)
        if param_count > 5:
            self.smells.append(CodeSmell(
                smell_type="Long Parameter List",
                location=f"{filename}:{node.lineno}:{node.name}",
                severity=min(10, param_count - 3),
                suggestion=f"Introduce parameter object for {node.name} ({param_count} parameters)"
            ))
    
    def _check_magic_number(self, node: ast.Num, filename: str) -> None:
        """Detect unexplained numeric literals."""
        if isinstance(node.n, (int, float)) and abs(node.n) > 1:
            # Exclude common constants
            if node.n not in [0, 1, -1, 2, 10, 100, 1000]:
                self.smells.append(CodeSmell(
                    smell_type="Magic Number",
                    location=f"{filename}:{node.lineno}",
                    severity=5,
                    suggestion=f"Replace {node.n} with named constant"
                ))
    
    def _check_god_object(self, node: ast.ClassDef, filename: str) -> None:
        """Detect classes with excessive responsibilities."""
        method_count = sum(1 for n in node.body if isinstance(n, ast.FunctionDef))
        if method_count > 15:
            self.smells.append(CodeSmell(
                smell_type="God Object",
                location=f"{filename}:{node.lineno}:{node.name}",
                severity=min(10, method_count // 3),
                suggestion=f"Split {node.name} into focused classes ({method_count} methods)"
            ))
    
    def report(self) -> str:
        """Generate formatted smell report."""
        if not self.smells:
            return "✓ No code smells detected"
        
        lines = [f"Found {len(self.smells)} code smells:\n"]
        for smell in sorted(self.smells, key=lambda s: s.severity, reverse=True):
            lines.append(
                f"  [{smell.severity}/10] {smell.smell_type} @ {smell.location}\n"
                f"    → {smell.suggestion}"
            )
        return "\n".join(lines)

# Example usage
problematic_code = """
class DataProcessor:
    def process(self, a, b, c, d, e, f, g):  # Too many parameters
        result = 0
        for i in range(1000):  # Magic number
            result += i * 42  # Magic number
            if result > 9999:  # Magic number
                break
        # Imagine 20+ more lines here...
        return result
    
    # Imagine 20+ more methods here making this a God Object...
"""

detector = CodeSmellDetector()
smells = detector.analyze(problematic_code, "data_processor.py")
print(detector.report())
```

## Concept Reference

| Concept | Technical | Plain | Importance |
|---------|-----------|-------|------------|
| Silent Code Killers | Latent defects or anti-patterns in software that degrade system performance, maintainability, or reliability without generating immediate errors or failures | Hidden problems in computer code that slowly damage your software over time without causing obvious crashes or error messages, making them hard to notice | 0.95 |
| Technical Debt | The implied cost of additional rework caused by choosing expedient solutions over architecturally sound approaches, accumulating over time as a maintenance burden | Taking shortcuts when writing code that save time now but create more work later, like borrowing money you'll have to pay back with interest | 0.90 |
| Memory Leak | A progressive resource exhaustion defect where allocated memory is not properly deallocated after use, causing gradual consumption of available memory | When a program keeps grabbing computer memory but never gives it back, like leaving the water running until your house floods | 0.88 |
| Race Condition | A concurrency defect where system behavior depends on the relative timing or interleaving of multiple threads or processes, producing non-deterministic outcomes | When two parts of a program try to use the same thing at the same time and the result depends on which one gets there first, causing unpredictable problems | 0.87 |
| Silent Failure | Error conditions that occur without generating exceptions, logging events, or user notifications, allowing defects to propagate undetected through systems | When something goes wrong but the program doesn't tell anyone, continuing to run incorrectly without any warning signs | 0.86 |
| Code Smell | Surface-level indicators in source code that suggest deeper structural problems, representing symptoms of poor design decisions or implementation choices | Warning signs in code that hint at bigger problems underneath, like a bad smell that tells you something might be rotting even if you can't see it yet | 0.85 |
| Technical Erosion | The gradual degradation of codebase quality over time through accumulated shortcuts, inconsistent patterns, outdated dependencies, and architectural drift | How code quality slowly gets worse over time as quick fixes pile up and the original design falls apart, like a building that wasn't maintained | 0.84 |
| Heisenbug | A software defect that exhibits non-deterministic behavior, disappearing or altering characteristics when investigation attempts are made, typically due to timing or observer effects | A bug that vanishes or changes when you try to find it, like it knows you're looking for it, usually because debugging changes how the program runs | 0.83 |
| Tight Coupling | A software design characteristic where modules or components exhibit high interdependency, such that changes to one component necessitate cascading modifications | When different parts of code are so tangled together that changing one thing forces you to change many others, like dominos falling | 0.82 |
| Resource Starvation | A condition where a process or thread is perpetually denied necessary resources to execute, typically due to unfair scheduling, deadlock, or priority inversion | When part of a program can never get what it needs to run because other parts keep hogging the resources, like being stuck in an endless line | 0.81 |

## Glossary

| Term | Definition | Concept IDs |
|------|------------|-------------|
| Technical Debt | The accumulated cost of choosing quick solutions over sound architecture, creating a maintenance burden that compounds like financial interest over time | 2, 17 |
| Code Smell | Surface-level warning signs indicating deeper structural problems, serving as the first detection mechanism for silent code killers | 3, 1 |
| Memory Leak | Progressive resource exhaustion where memory is allocated but never released, exemplifying how silent failures gradually degrade system performance | 4, 13 |
| Race Condition | Timing-dependent concurrency defects producing non-deterministic outcomes when multiple threads access shared resources, making bugs disappear during debugging | 5, 16 |
| Tight Coupling | High interdependency between code modules where changes cascade through the system, amplifying maintenance costs and accelerating technical erosion | 7, 17 |
| God Object | An anti-pattern where a single component assumes excessive responsibilities, creating a maintenance bottleneck through excessive complexity and coupling | 10, 7 |
| Spaghetti Code | Tangled control flow with poor structural organization resulting from accumulated technical debt, making program logic nearly impossible to follow | 9, 2 |
| Zombie Code | Dead code segments never executed at runtime that increase maintenance burden, representing technical debt that clutters the codebase without providing value | 8, 2 |
| Silent Failure | Errors occurring without notifications or logging, allowing defects to propagate undetected as quintessential silent code killers | 13, 1 |
| Heisenbug | Non-deterministic defects that disappear during investigation due to timing dependencies, making silent code killers particularly difficult to diagnose | 16, 1, 5 |
| Cyclomatic Complexity | A quantitative metric measuring the number of execution paths through code, serving as an early warning system for code becoming unmaintainable | 6, 3 |
| Resource Starvation | Perpetual denial of necessary resources to processes, often resulting from memory leaks or poor scheduling, causing progressive system degradation | 12, 4 |
| Cargo Cult Programming | Blindly copying code patterns without understanding their purpose, introducing technical debt and zombie code while accelerating technical erosion | 15, 2, 8, 17 |

## Edge Cases & Warnings

- ⚠️ **Heisenbug Paradox**: Debugging instrumentation can alter timing and mask race conditions; use production telemetry and statistical sampling instead of invasive breakpoints
- ⚠️ **Premature Optimization Trap**: Fixing perceived performance issues before profiling often introduces complexity that becomes its own silent killer; measure first, optimize second
- ⚠️ **Refactoring Cascade**: Addressing tight coupling may require touching 30%+ of codebase; use strangler fig pattern to gradually replace problem areas
- ⚠️ **Metric Gaming**: Teams can artificially lower cyclomatic complexity through superficial refactoring that doesn't improve actual maintainability; focus on cognitive load reduction
- ⚠️ **False Negative Silence**: Absence of errors doesn't indicate absence of silent failures; implement health checks, canary deployments, and anomaly detection
- ⚠️ **Technical Debt Interest Rate Variance**: Compound rates vary by context—core business logic debt compounds faster than peripheral utility code
- ⚠️ **God Object Dependencies**: Breaking apart god objects requires dependency injection refactoring that can temporarily increase coupling before improving it

## Quick Reference

```python
from dataclasses import dataclass
from typing import List
import ast

@dataclass
class QuickAudit:
    """Fast code health assessment for immediate triage."""
    
    @staticmethod
    def audit(source_code: str) -> dict:
        """Run rapid checks for common silent killers."""
        tree = ast.parse(source_code)
        
        results = {
            'complexity_hotspots': [],
            'god_objects': [],
            'magic_numbers': 0,
            'long_methods': []
        }
        
        for node in ast.walk(tree):
            # Cyclomatic complexity check
            if isinstance(node, ast.FunctionDef):
                complexity = sum(1 for n in ast.walk(node) 
                               if isinstance(n, (ast.If, ast.While, ast.For)))
                if complexity > 10:
                    results['complexity_hotspots'].append(
                        (node.name, complexity)
                    )
                if len(node.body) > 20:
                    results['long_methods'].append(node.name)
            
            # God object detection
            elif isinstance(node, ast.ClassDef):
                method_count = sum(1 for n in node.body 
                                 if isinstance(n, ast.FunctionDef))
                if method_count > 15:
                    results['god_objects'].append(
                        (node.name, method_count)
                    )
            
            # Magic number detection
            elif isinstance(node, ast.Num):
                if isinstance(node.n, (int, float)) and abs(node.n) > 1:
                    if node.n not in [0, 1, -1, 2, 10, 100]:
                        results['magic_numbers'] += 1
        
        return results

# Usage: Quick 30-second codebase health check
code = open('suspicious_module.py').read()
audit = QuickAudit.audit(code)
print(f"🔍 Complexity Hotspots: {len(audit['complexity_hotspots'])}")
print(f"👹 God Objects: {len(audit['god_objects'])}")
print(f"🔢 Magic Numbers: {audit['magic_numbers']}")
print(f"📏 Long Methods: {len(audit['long_methods'])}")
```

---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed
