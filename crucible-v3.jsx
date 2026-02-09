import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════
//  THE CRUCIBLE v3 — Full Fusion + Physics Lexicon
//  EchoSeed v4.2 × Beacon Glyph Engine × Philosopher's Stone
//  Seasonal Dynamics · Typed Reflexes · Influence Attractors
//  Helix Core · Singularity Scanner · Dormant Pool Pathing
//  Tag Operator Eigenvalues · Lexicon Observables · Critical Thresholds
// ═══════════════════════════════════════════════════════════

// ===== SEASONAL PHASES (from v4.2) =====
const SeasonalPhase = { EXPLORATION: 'exploration', CONSOLIDATION: 'consolidation', DORMANCY: 'dormancy', RENAISSANCE: 'renaissance' };
const SEASON_ORDER = [SeasonalPhase.EXPLORATION, SeasonalPhase.CONSOLIDATION, SeasonalPhase.DORMANCY, SeasonalPhase.RENAISSANCE];
const SEASON_MODIFIERS = {
  [SeasonalPhase.EXPLORATION]:    { entropy: 1.2, resonance: -0.05, sleep: 0.8, color: '#16C0FF' },
  [SeasonalPhase.CONSOLIDATION]:  { entropy: 0.8, resonance: 0.03,  sleep: 1.0, color: '#00FF96' },
  [SeasonalPhase.DORMANCY]:       { entropy: 0.6, resonance: 0.06,  sleep: 1.5, color: '#8F7FFF' },
  [SeasonalPhase.RENAISSANCE]:    { entropy: 1.5, resonance: -0.08, sleep: 0.6, color: '#FF6B6B' },
};

// ===== REFLEX TYPES (from v4.2) =====
const ReflexType = { DEFENSIVE: 'defensive', EXPLORATORY: 'exploratory', COLLABORATIVE: 'collaborative', CONSOLIDATIVE: 'consolidative', METAMORPHIC: 'metamorphic' };

// ===== TAG OPERATOR EIGENVALUES (from Physics Lexicon §VII, §XII) =====
// Ωi|ψ⟩ → λi|ψ'⟩  — thermodynamic multipliers empirically derived over 2000+ generations
const TAG_EIGENVALUES = {
  wild:     2.1,   // Acceleration — 2.1× entropy flow
  ghost:    7.0,   // Autonomy amplification
  beacon:   1.4,   // Hub formation
  fractal:  1.8,   // Self-similar branching
  mirror:   1.3,   // Reflection coupling
  flex:     1.2,   // Adaptive response
  resonant: 1.5,   // Resonance amplification
  unknown:  1.0,   // Identity operator (no effect)
  stable:   0.85,  // Cooling (consolidation)
  phase:    0.95,  // Cooling (negative dH/dt)
  origin:   0.90,  // Reset/collapse
};

// Protected cognitive markers — influence mass calculation, never compressed away
const COGNITIVE_TAGS = new Set(['origin', 'self', 'purpose', 'memory', 'mirror', 'beacon', 'synthesis', 'semantic-fusion']);
const MAX_TAGS_PER_GLYPH = 8;
const COMPRESS_SIM_THRESHOLD = 0.82; // cosine similarity above this → tags are redundant

// ===== GLYPH CLASS (Crucible base + v4.2 extensions) =====
class Glyph {
  constructor(id, tags, ancestry, generation, isConcept = false) {
    this.id = id;
    this.tags = tags;
    this.ancestry = ancestry;
    this.generation = generation;
    this.isConcept = isConcept;
    this.conceptData = null;
    this.entropyHistory = [];
    this.thermodynamicState = null;
    this.x = Math.random() * 1200;
    this.y = Math.random() * 600;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.coordinationEvents = [];
    this.lastCollisionGen = 0;
    this.birthTime = Date.now();
    this.pulsePhase = Math.random() * Math.PI * 2;
    // v4.2 extensions
    this.reflexType = null;        // ReflexType if this is a reflex glyph
    this.isReflex = false;
    this.influenceScore = 0;       // cached influence
    this.isAttractor = false;      // conceptual attractor flag
    this.seasonBorn = null;        // which season it was born in
    this.stagnantCount = 0;        // generations since last interaction
    // Lattice entrainment extensions
    this.priority = 0;             // propagation priority
    this.mutationRate = 0.1;       // base mutation rate
    this.stability = 0;            // coherence-derived stability
    this.entrained = false;        // has been entrained this cycle
    this.entrainmentGen = 0;       // generation of last entrainment
  }

  get entropy() {
    return this.entropyHistory[this.entropyHistory.length - 1] || 0;
  }

  get mass() {
    const depth = this.ancestry.length;
    const cognitive = this.tags.some(t => COGNITIVE_TAGS.has(t)) ? 1.6 : 1.0;
    return (this.entropy + 300) * (1 + Math.log1p(depth)) * cognitive;
  }

  updateThermodynamics(generation) {
    const history = this.entropyHistory;
    if (history.length < 2) return;
    const H = history[history.length - 1];
    const window_ = Math.min(10, history.length);
    const dH_dt = (history[history.length - 1] - history[history.length - window_]) / window_;
    let tau_coherence = 1.0;
    if (history.length > 5) {
      const changes = [];
      for (let i = 1; i < Math.min(20, history.length); i++) {
        if (history.length - i - 1 >= 0) changes.push(history[history.length - i] - history[history.length - i - 1]);
      }
      if (changes.length > 0) {
        const std = Math.sqrt(changes.reduce((a, b) => a + b * b, 0) / changes.length);
        tau_coherence = 1.0 / (std + 0.000001);
      }
    }
    let phi_phase = 0.5;
    if (history.length > 10) {
      const recent = history.slice(-10);
      const min = Math.min(...recent);
      const max = Math.max(...recent);
      if (max > min) phi_phase = (recent[recent.length - 1] - min) / (max - min);
    }
    this.thermodynamicState = { H, dH_dt, tau_coherence, phi_phase, generation };
  }

  resonanceWith(other) {
    if (!this.thermodynamicState || !other.thermodynamicState) return 0;
    const s1 = this.thermodynamicState, s2 = other.thermodynamicState;
    // Lexicon §II resonance components — normalization constants scaled for H_max ≈ 8000
    // ρH = 1/(1 + |Ha-Hb|/κ) where κ scales with entropy range
    const entropy_compat = 1.0 / (1 + Math.abs(s1.H - s2.H) / 600);
    // ρv = min(1, max(0, -va·vb/κ²)) — velocity complementarity, clamped to [0,1]
    const rate_compat = Math.min(1.0, Math.max(0, -(s1.dH_dt * s2.dH_dt) / 5000));
    // ρφ = cos(Δφ·π) — phase alignment (already normalized)
    const phase_compat = Math.cos(Math.abs(s1.phi_phase - s2.phi_phase) * Math.PI);
    // ρτ = min(τa,τb)/max(τa,τb) — coherence compatibility (ratio is scale-invariant)
    const tau_ratio = Math.min(s1.tau_coherence, s2.tau_coherence) / Math.max(s1.tau_coherence, s2.tau_coherence);
    // Lexicon §II: ρ = 0.35·ρH + 0.30·ρv + 0.20·ρφ + 0.15·ρτ
    let base = entropy_compat * 0.35 + rate_compat * 0.30 + phase_compat * 0.20 + tau_ratio * 0.15;
    if (this.isConcept && other.isConcept) base *= 1.15;
    if (this.isConcept !== other.isConcept) base *= 1.08;
    // v4.2: Attractor resonance bonus
    if (this.isAttractor || other.isAttractor) base *= 1.12;
    // v4.2: Reflex glyphs resonate differently
    if (this.isReflex && !other.isReflex) base *= 1.05;
    return Math.min(1.0, base);
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.998;
    this.vy *= 0.998;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
    this.x = Math.max(0, Math.min(width, this.x));
    this.y = Math.max(0, Math.min(height, this.y));
    this.pulsePhase += 0.05;
  }
}

// ===== ENGINE CORE (Crucible + v4.2 fusion) =====
class CrucibleEngine {
  constructor() {
    this.glyphs = new Map();
    this.nextId = 0;
    this.generation = 0;
    this.resonanceMatrix = new Map();
    this.openPipes = new Map();
    this.collisionLog = [];
    this.eventLog = [];
    this.baseTags = ['origin','flex','ghost','fractal','wild','mirror','unknown','stable','beacon','phase','resonant'];
    this.evolvedTags = [];
    this.tagSignatures = new Set();
    this.RESONANCE_THRESHOLD = 0.45;  // ρc — operational threshold
    this.PHASE_TRANSITION_THRESHOLD = 0.93;  // ρc* — phase transition
    this.CRITICAL_POINT_THRESHOLD = 0.997;   // ρc** — critical point
    // ── Lexicon Observables ──
    this.observables = {
      psi: 0,           // ψ — order parameter ⟨ρ⟩
      vp_mean: 0,       // ⟨vp⟩ — mean thermodynamic velocity
      J_H: 0,           // J_H — entropy current density
      f_xi: 0,          // f_Ξ — singularity fraction
      F_free: 0,        // F — semantic free energy
      H_mean: 0,        // ⟨H⟩ — mean field entropy
      sigma_H: 0,       // σ_H — entropy variance
      N_xi: 0,          // N_Ξ — singularity count
      phaseTransitions: 0,  // count of ρ > ρc* events
      criticalEvents: 0,    // count of ρ > ρc** events
    };
    this.BEACON_UPDATE_INTERVAL = 8;
    this.MAX_GLYPHS = 1000;
    this.RESONANCE_SAMPLE_SIZE = 3000; // stochastic pair samples per update
    this.RESONANCE_MATRIX_CAP = 200;   // max stored resonant pairs
    this.RENDER_CONNECTION_CAP = 120;   // max drawn connections
    this.canvasW = 1200;
    this.canvasH = 600;
    this.conceptCount = 0;
    this.shockwave = null;

    // ── Seasonal Dynamics (from v4.2) ──
    this.season = SeasonalPhase.EXPLORATION;
    this.seasonCounter = 0;
    this.SEASON_DURATION = 200; // generations per season (scaled for browser)
    this.seasonalTags = {
      [SeasonalPhase.EXPLORATION]: ['pioneer', 'venture', 'discover'],
      [SeasonalPhase.CONSOLIDATION]: ['anchor', 'strengthen', 'unify'],
      [SeasonalPhase.DORMANCY]: ['rest', 'potential', 'dormant'],
      [SeasonalPhase.RENAISSANCE]: ['reborn', 'transformed', 'awakened'],
    };

    // ── Typed Reflex System (from v4.2) ──
    this.reflexFreeCount = 0;
    this.REFLEX_INTERVAL = 25; // check every N generations

    // ── Influence & Attractor System (from v4.2) ──
    this.conceptualAttractors = new Map(); // id → {discovered, episodes[]}
    this.ATTRACTOR_THRESHOLD = 3;
    this.INFLUENCE_INTERVAL = 50;

    // ── Deep Analysis (from v4.2, browser-adapted) ──
    this.DEEP_ANALYSIS_INTERVAL = 100;
    this.lastAnalysis = null;

    // ── Dormant Pool Pathing ──
    this.dormantPools = [];
    this.activeShortcuts = [];
    this.POOL_SCAN_INTERVAL = 20;
    this.PRESSURE_THRESHOLD = 1.5e6; // mass threshold triggering synthesis pressure event
    this.PRESSURE_INTERVAL = 30;     // check every N generations
    this.HBAR_OVER_2 = 0.527;

    // ── Meta-Reflex Helix Core ──
    this.helix = {
      alpha: 1.0, beta: 0.824, phi: 1.618, omega: 141, dt: 0.01,
      gamma0: 0.5, epsilon: 0.1, lambda: 0.5, eta: 0.02,
      R_max: 4.0, A0: 1.0,
      t: 0, R: 0, R_prev: 0, A: 1.0, theta: 0, theta_prev: 0,
      z: 0, gamma: 0.5, HRV: 0, r_sq: 0,
      history: [], A_history: [], phase_history: [],
      stable: false, stableFor: 0, lastLogGen: -50,
    };
  }

  log(msg, type = 'info') {
    this.eventLog.unshift({ msg, type, gen: this.generation, ts: Date.now() });
    if (this.eventLog.length > 50) this.eventLog.length = 50;
  }

  genId() { return `g${String(this.nextId++).padStart(4, '0')}`; }

  get tags() { return [...this.baseTags, ...this.evolvedTags, ...(this.seasonalTags[this.season] || [])]; }

  randomTag() {
    const pool = this.tags;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  learnTag(tag) {
    if (!this.baseTags.includes(tag) && !this.evolvedTags.includes(tag)) {
      this.evolvedTags.push(tag);
      this.log(`🧬 New tag evolved: ${tag} (vocab: ${this.tags.length})`, 'evolution');
      if (this.evolvedTags.length > 500) this.evolvedTags.shift();
    }
  }

  tagSig(tags) { return [...tags].sort().join('|'); }

  // ── Seasonal entropy calculation (v4.2 + Crucible merged) ──
  calcEntropy(glyph) {
    const genContrib = Math.min(this.generation, 100) * 10;
    const seasonMod = SEASON_MODIFIERS[this.season]?.entropy || 1.0;
    // Composite operator: Θ = ∏ Ωi — tag eigenvalues multiply (non-commutative product)
    let operatorProduct = 1.0;
    let evolvedCount = 0;
    for (const tag of glyph.tags) {
      const clean = tag.replace(/gen:.*|μ.*|c#.*/, '').trim();
      if (TAG_EIGENVALUES[clean]) {
        operatorProduct *= TAG_EIGENVALUES[clean];
      } else if (clean.length > 0) {
        evolvedCount++;
      }
    }
    // Evolved/mutant tags: diminishing returns (log growth, not exponential)
    if (evolvedCount > 0) operatorProduct *= 1 + Math.log(1 + evolvedCount) * 0.2;
    // Cap total operator product to prevent runaway
    operatorProduct = Math.min(operatorProduct, 12.0);
    const base = (glyph.tags.length * 42 + Math.floor(Math.random() * 58) + genContrib) * seasonMod * operatorProduct;
    if (glyph.isConcept && glyph.conceptData) {
      return Math.min(base + (glyph.conceptData.confidence || 0.5) * 500, 10000);
    }
    // v4.2: Renaissance-born glyphs get bonus
    if (glyph.seasonBorn === SeasonalPhase.RENAISSANCE) return Math.min(base * 1.1, 8000);
    return Math.min(base, 8000);
  }

  createGlyph(tags = null, ancestry = []) {
    if (!tags) {
      const maxAttempts = 20;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = [];
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) candidate.push(this.randomTag());
        candidate.push(`gen:${this.generation}`);
        const deduped = [...new Set(candidate)];
        const sig = this.tagSig(deduped);
        if (!this.tagSignatures.has(sig)) { tags = deduped; break; }
        if (attempt === maxAttempts - 1) {
          candidate.push(`μ${this.nextId}`);
          tags = [...new Set(candidate)];
        }
      }
    }
    const sig = this.tagSig(tags);
    this.tagSignatures.add(sig);
    const glyph = new Glyph(this.genId(), tags, ancestry, this.generation);
    glyph.seasonBorn = this.season;
    glyph.entropyHistory.push(this.calcEntropy(glyph));
    return glyph;
  }

  injectConcept(concept) {
    const tags = [...(concept.keywords || []), 'concept', `c#${concept.id}`];
    const glyph = new Glyph(this.genId(), tags, [], this.generation, true);
    glyph.conceptData = concept;
    glyph.seasonBorn = this.season;
    const cx = this.canvasW / 2, cy = this.canvasH / 2;
    const angle = (this.conceptCount * 2.399) + Math.random() * 0.3;
    const dist = 50 + this.conceptCount * 15;
    glyph.x = cx + Math.cos(angle) * dist;
    glyph.y = cy + Math.sin(angle) * dist;
    glyph.vx = Math.cos(angle) * 3;
    glyph.vy = Math.sin(angle) * 3;
    glyph.entropyHistory.push(this.calcEntropy(glyph));
    this.store(glyph);
    this.conceptCount++;
    this.log(`⚗️ Concept injected: "${(concept.technical || '').slice(0, 40)}..."`, 'concept');
    return glyph;
  }

  triggerShockwave(x, y, color = '#daa520') {
    this.shockwave = { x, y, radius: 0, maxRadius: 400, color, birth: Date.now() };
    for (const g of this.glyphs.values()) {
      const dx = g.x - x, dy = g.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      const force = Math.min(5, 200 / dist);
      g.vx += (dx / dist) * force;
      g.vy += (dy / dist) * force;
    }
  }

  store(glyph) {
    this.glyphs.set(glyph.id, glyph);
    if (this.glyphs.size > this.MAX_GLYPHS) {
      const excess = this.glyphs.size - this.MAX_GLYPHS;
      const cullCount = Math.min(excess + 5, 25);
      // Pre-compute parent reference counts
      const parentHits = new Map();
      for (const g of this.glyphs.values()) {
        for (const aid of g.ancestry) parentHits.set(aid, (parentHits.get(aid) || 0) + 1);
      }
      const removable = Array.from(this.glyphs.values())
        .filter(g => !g.isConcept && !g.isAttractor && !g.isReflex)
        .map(g => {
          const children = parentHits.get(g.id) || 0;
          const score = g.entropy * 0.3 + (60 - Math.min(60, g.stagnantCount)) * 20 + children * 500 + g.stability * 1000;
          return { id: g.id, score };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, cullCount)
        .map(g => g.id);
      removable.forEach(id => {
        const dead = this.glyphs.get(id);
        if (dead) this.tagSignatures.delete(this.tagSig(dead.tags));
        this.glyphs.delete(id);
      });
    }
  }

  collide(parentA, parentB) {
    const childTags = [...new Set([...parentA.tags, ...parentB.tags])];
    const cleaned = childTags.filter(t => !t.startsWith('gen:') && !t.startsWith('μ'));
    // Effective mutation rate — boosted by entrainment
    const effectiveMutRate = Math.min(1.0, (parentA.mutationRate + parentB.mutationRate) / 2);
    if (parentA.tags.length >= 2 && parentB.tags.length >= 2) {
      const tA = parentA.tags.filter(t => !t.startsWith('gen:') && !t.startsWith('μ'));
      const tB = parentB.tags.filter(t => !t.startsWith('gen:') && !t.startsWith('μ'));
      if (tA.length && tB.length) {
        // v4.2: Season-aware mutation operator
        const a = tA[Math.floor(Math.random() * tA.length)];
        const b = tB[Math.floor(Math.random() * tB.length)];
        let mutant;
        if (this.season === SeasonalPhase.EXPLORATION) mutant = `${a}→${b}`;
        else if (this.season === SeasonalPhase.CONSOLIDATION) mutant = `${a}∧${b}`;
        else mutant = `${a}×${b}`;
        cleaned.push(mutant);
        this.learnTag(mutant);
        // Extra mutations from elevated mutation rate (entrainment lineage boost)
        if (effectiveMutRate > 0.2 && Math.random() < effectiveMutRate - 0.1) {
          const a2 = tA[Math.floor(Math.random() * tA.length)];
          const b2 = tB[Math.floor(Math.random() * tB.length)];
          const bonus = `${b2}⊕${a2}`;
          cleaned.push(bonus);
          this.learnTag(bonus);
        }
      }
    }
    const isCrossType = parentA.isConcept !== parentB.isConcept;
    if (isCrossType) cleaned.push('synthesis');
    if (parentA.isConcept && parentB.isConcept) cleaned.push('semantic-fusion');
    cleaned.push(`gen:${this.generation}`);
    const finalTags = this.compressTags([...new Set(cleaned)]);

    const child = this.createGlyph(finalTags, [parentA.id, parentB.id]);
    // Lexicon §IV: Amplification factor A(ρ) = 1.0 + 0.28(ρ - ρc) for ρ > ρc
    const collisionRes = parentA.resonanceWith(parentB);
    if (collisionRes > this.RESONANCE_THRESHOLD) {
      const A_factor = 1.0 + 0.28 * (collisionRes - this.RESONANCE_THRESHOLD);
      const parentAvgH = (parentA.entropy + parentB.entropy) / 2;
      const amplifiedH = Math.min(parentAvgH * A_factor, 10000);
      child.entropyHistory[child.entropyHistory.length - 1] = amplifiedH;
    }
    child.x = (parentA.x + parentB.x) / 2 + (Math.random() - 0.5) * 50;
    child.y = (parentA.y + parentB.y) / 2 + (Math.random() - 0.5) * 50;
    if (parentA.isConcept && parentB.isConcept) {
      child.isConcept = true;
      child.conceptData = { technical: `Fusion of ${parentA.id} × ${parentB.id}`, confidence: 0.8, keywords: childTags.slice(0, 4) };
    }
    this.store(child);
    // Reset stagnant counters
    parentA.stagnantCount = 0;
    parentB.stagnantCount = 0;
    child.stagnantCount = 0;
    // Inherit entrainment traits — child gets averaged mutation rate with decay toward baseline
    child.mutationRate = 0.1 + (effectiveMutRate - 0.1) * 0.7; // 70% inheritance, decays toward 0.1
    child.priority = (parentA.priority + parentB.priority) * 0.3; // 30% priority inheritance
    return child;
  }

  updateThermodynamics() {
    for (const glyph of this.glyphs.values()) {
      glyph.entropyHistory.push(this.calcEntropy(glyph));
      if (glyph.entropyHistory.length > 50) glyph.entropyHistory.shift();
      glyph.updateThermodynamics(this.generation);
      glyph.stagnantCount++;
    }
  }

  updateResonanceField() {
    this.resonanceMatrix.clear();
    const arr = Array.from(this.glyphs.values()).filter(g => g.thermodynamicState);
    const n = arr.length;
    if (n < 2) return;
    const seasonAdj = SEASON_MODIFIERS[this.season]?.resonance || 0;
    const threshold = this.RESONANCE_THRESHOLD + seasonAdj;

    // Spatial grid for proximity-biased sampling
    const cellSize = 120;
    const grid = new Map();
    for (const g of arr) {
      const key = `${Math.floor(g.x / cellSize)},${Math.floor(g.y / cellSize)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(g);
    }

    const checked = new Set();
    const addPair = (a, b) => {
      const pk = a.id < b.id ? `${a.id},${b.id}` : `${b.id},${a.id}`;
      if (checked.has(pk)) return;
      checked.add(pk);
      const score = a.resonanceWith(b);
      if (score > threshold) {
        this.resonanceMatrix.set(pk, { a, b, score });
      }
    };

    // Phase 1: Check all neighbors within same + adjacent grid cells (local structure)
    for (const [key, cell] of grid) {
      const [cx, cy] = key.split(',').map(Number);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const neighbor = grid.get(`${cx + dx},${cy + dy}`);
        if (!neighbor) continue;
        for (const a of cell) for (const b of neighbor) {
          if (a.id >= b.id) continue;
          addPair(a, b);
        }
      }
    }

    // Phase 2: Stochastic global sampling (long-range connections)
    const globalSamples = Math.min(this.RESONANCE_SAMPLE_SIZE, n * (n - 1) / 2);
    for (let s = 0; s < globalSamples; s++) {
      const i = Math.floor(Math.random() * n);
      let j = Math.floor(Math.random() * (n - 1));
      if (j >= i) j++;
      addPair(arr[i], arr[j]);
    }

    // Cap resonance matrix to top pairs by score
    if (this.resonanceMatrix.size > this.RESONANCE_MATRIX_CAP) {
      const sorted = Array.from(this.resonanceMatrix.entries()).sort((a, b) => b[1].score - a[1].score);
      this.resonanceMatrix.clear();
      for (let i = 0; i < this.RESONANCE_MATRIX_CAP; i++) {
        this.resonanceMatrix.set(sorted[i][0], sorted[i][1]);
      }
    }

    for (const [key, expiry] of this.openPipes.entries()) {
      if (this.generation > expiry) this.openPipes.delete(key);
    }
  }

  coordinate() {
    // Mass-weighted priority: resonance × sqrt(combined mass) — deeper lineages collide first
    const pairs = Array.from(this.resonanceMatrix.values())
      .map(p => ({ ...p, priority: p.score * Math.sqrt((p.a.mass + p.b.mass) / 2000) }))
      .sort((x, y) => y.priority - x.priority)
      .slice(0, 5);
    let collisions = 0;
    for (const { a, b, score } of pairs) {
      const key = `${a.id},${b.id}`, rev = `${b.id},${a.id}`;
      if (this.openPipes.has(key) || this.openPipes.has(rev)) continue;
      if (a.id === b.id) continue;
      if (a.ancestry.includes(b.id) || b.ancestry.includes(a.id)) continue;
      if (this.generation - a.lastCollisionGen < 10) continue;
      if (this.generation - b.lastCollisionGen < 10) continue;
      this.openPipes.set(key, this.generation + 5);
      const offspring = this.collide(a, b);
      const typeLabel = a.isConcept && b.isConcept ? '⚗️' : a.isConcept !== b.isConcept ? '🔮' : '◉';
      this.collisionLog.push({ generation: this.generation, parentA: a.id, parentB: b.id, offspring: offspring.id, resonance: score, crossType: a.isConcept !== b.isConcept });
      // Lexicon §V: Track critical threshold crossings
      if (score > this.PHASE_TRANSITION_THRESHOLD) {
        this.observables.phaseTransitions++;
        if (score > this.CRITICAL_POINT_THRESHOLD) {
          this.observables.criticalEvents++;
          this.log(`⚡ CRITICAL POINT: ρ=${score.toFixed(4)} > ρc**=${this.CRITICAL_POINT_THRESHOLD} [${a.id}×${b.id}]`, 'resonance');
        }
      }
      a.lastCollisionGen = this.generation;
      b.lastCollisionGen = this.generation;
      collisions++;
      this.log(`${typeLabel} ${a.id} × ${b.id} → ${offspring.id} (res: ${score.toFixed(3)})`, a.isConcept !== b.isConcept ? 'synthesis' : 'collision');
    }
    return collisions;
  }

  // ── SEASONAL DYNAMICS (from v4.2) ──
  updateSeason() {
    this.seasonCounter++;
    if (this.seasonCounter >= this.SEASON_DURATION) {
      this.seasonCounter = 0;
      const idx = SEASON_ORDER.indexOf(this.season);
      const oldSeason = this.season;
      this.season = SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
      this.log(`🌿 Season: ${oldSeason} → ${this.season}`, 'season');

      if (this.season === SeasonalPhase.DORMANCY) this.activateDormancyPhase();
      if (this.season === SeasonalPhase.RENAISSANCE) this.activateRenaissancePhase();
      // Shockwave on season change
      this.triggerShockwave(this.canvasW / 2, this.canvasH / 2, SEASON_MODIFIERS[this.season]?.color || '#daa520');
    }
  }

  activateDormancyPhase() {
    let dormant = 0;
    for (const g of this.glyphs.values()) {
      if (g.stagnantCount > 80 && !g.isConcept && !g.isAttractor && g.entropy < 2000) {
        g.tags.push('dormant');
        dormant++;
      }
    }
    if (dormant > 0) this.log(`💤 ${dormant} glyphs entered dormancy`, 'season');
  }

  activateRenaissancePhase() {
    let reactivated = 0;
    for (const g of this.glyphs.values()) {
      if (g.tags.includes('dormant') && Math.random() < 0.3) {
        g.tags = g.tags.filter(t => t !== 'dormant');
        g.tags.push('renaissance');
        g.stagnantCount = 0;
        g.entropyHistory.push(this.calcEntropy(g));
        reactivated++;
      }
    }
    if (reactivated > 0) this.log(`🌅 ${reactivated} glyphs reborn in renaissance`, 'season');
  }

  // ── TYPED REFLEX SYSTEM (from v4.2) ──
  reflexCheck() {
    if (this.generation % this.REFLEX_INTERVAL !== 0) return;
    const arr = Array.from(this.glyphs.values());
    const avgEntropy = arr.reduce((s, g) => s + g.entropy, 0) / (arr.length || 1);
    let reflexCount = 0;

    for (const g of arr) {
      if (g.isReflex || g.isConcept) continue;
      // Trigger conditions: stagnant, low entropy relative to average, or has 'unknown' tag
      const isStagnant = g.stagnantCount > 40;
      const isLowEntropy = g.entropy < avgEntropy * 0.6;
      const hasUnknown = g.tags.includes('unknown');
      if (isStagnant || isLowEntropy || hasUnknown) {
        const type = this.determineReflexType(g, avgEntropy);
        const reflex = this.createReflexGlyph(g, type);
        this.store(reflex);
        this.log(`⚡ Reflex [${type}]: ${g.id} → ${reflex.id}`, 'reflex');
        reflexCount++;
        if (reflexCount >= 3) break; // Cap per cycle
      }
    }
  }

  determineReflexType(g, avgEntropy) {
    const ratio = g.entropy / Math.max(1, avgEntropy);
    const tagCount = g.tags.length;
    if (ratio < 0.5 && tagCount < 3) return ReflexType.DEFENSIVE;
    if (tagCount > 4 && ratio > 1.2) return ReflexType.COLLABORATIVE;
    if (g.isAttractor) return ReflexType.CONSOLIDATIVE;
    if (this.season === SeasonalPhase.EXPLORATION) return ReflexType.EXPLORATORY;
    return ReflexType.METAMORPHIC;
  }

  createReflexGlyph(parent, type) {
    let newTags = [...parent.tags.filter(t => !t.startsWith('gen:') && !t.startsWith('μ'))];
    switch (type) {
      case ReflexType.DEFENSIVE: newTags.push('reflex', 'preserve', 'stable'); break;
      case ReflexType.EXPLORATORY: newTags.push('reflex', 'seek', 'novel', this.randomTag()); break;
      case ReflexType.COLLABORATIVE: {
        // Bridge with a semantically distant glyph
        const distant = this.findDistantGlyph(parent);
        if (distant) newTags.push(...distant.tags.slice(0, 2));
        newTags.push('reflex', 'bridge');
        break;
      }
      case ReflexType.CONSOLIDATIVE: newTags.push('reflex', 'strengthen', 'anchor'); break;
      case ReflexType.METAMORPHIC: {
        const [a, b] = newTags.length >= 2 ? [newTags[0], newTags[1]] : [newTags[0] || 'void', 'transform'];
        newTags = [`${a}⇌${b}`, 'reflex', 'transform', 'evolve'];
        break;
      }
    }
    newTags.push(`gen:${this.generation}`);
    const child = this.createGlyph([...new Set(newTags)], [parent.id]);
    child.isReflex = true;
    child.reflexType = type;
    child.x = parent.x + (Math.random() - 0.5) * 80;
    child.y = parent.y + (Math.random() - 0.5) * 80;
    this.reflexFreeCount = Array.from(this.glyphs.values()).filter(g => !g.isReflex).length;
    return child;
  }

  findDistantGlyph(ref) {
    const arr = Array.from(this.glyphs.values()).filter(g => g.id !== ref.id);
    if (arr.length < 2) return null;
    // Use tag overlap as distance proxy (no ML embeddings in browser)
    const refSet = new Set(ref.tags);
    let best = null, bestDist = -1;
    const sample = arr.length > 30 ? arr.sort(() => Math.random() - 0.5).slice(0, 30) : arr;
    for (const g of sample) {
      const gSet = new Set(g.tags);
      const overlap = [...refSet].filter(t => gSet.has(t)).length;
      const dist = 1 - overlap / Math.max(refSet.size, gSet.size);
      if (dist > bestDist) { bestDist = dist; best = g; }
    }
    return best;
  }

  // ── INFLUENCE & ATTRACTOR SYSTEM (from v4.2) ──
  updateInfluenceAndAttractors() {
    if (this.generation % this.INFLUENCE_INTERVAL !== 0) return;
    const arr = Array.from(this.glyphs.values());

    // Pre-build ancestry index: parent → [children] (O(n) instead of O(n²))
    const childrenOf = new Map();
    for (const g of arr) {
      for (const aid of g.ancestry) {
        if (!childrenOf.has(aid)) childrenOf.set(aid, []);
        childrenOf.get(aid).push(g);
      }
    }

    // Calculate influence using index
    for (const g of arr) {
      const children = childrenOf.get(g.id) || [];
      if (children.length === 0) { g.influenceScore = 0; continue; }
      const tagDiversity = new Set(children.flatMap(c => c.tags)).size / Math.max(1, children.length);
      const avgChildEntropy = children.reduce((s, c) => s + c.entropy, 0) / children.length;
      const cascadeDepth = this.cascadeDepth(g.id, new Set(), 4, childrenOf);
      g.influenceScore = (
        (children.length / arr.length) * 0.35 +
        (tagDiversity / 10) * 0.25 +
        (cascadeDepth / 4) * 0.15 +
        (avgChildEntropy / 8000) * 0.15 +
        (children.filter(c => c.isConcept !== g.isConcept).length / Math.max(1, children.length)) * 0.10
      );
    }

    // Detect attractors using same ancestry index
    const ancestryCounts = new Map();
    for (const g of arr) {
      for (const aid of g.ancestry) {
        ancestryCounts.set(aid, (ancestryCounts.get(aid) || 0) + 1);
      }
    }
    for (const [aid, count] of ancestryCounts) {
      if (count >= this.ATTRACTOR_THRESHOLD) {
        const g = this.glyphs.get(aid);
        if (g && !g.isAttractor) {
          g.isAttractor = true;
          if (!this.conceptualAttractors.has(aid)) {
            this.conceptualAttractors.set(aid, { discovered: this.generation, episodes: [] });
          }
          this.conceptualAttractors.get(aid).episodes.push(this.generation);
          this.log(`🌟 Attractor detected: ${aid} (${count} ancestry hits, alive)`, 'attractor');
        } else if (!g && count >= this.ATTRACTOR_THRESHOLD + 1) {
          // Culled progenitor — promote highest-influence living descendant
          const descendants = childrenOf.get(aid) || [];
          let bestDescendant = null, bestScore = -1;
          for (const candidate of descendants) {
            if (!candidate.isAttractor && candidate.influenceScore > bestScore) {
              bestScore = candidate.influenceScore;
              bestDescendant = candidate;
            }
          }
          if (bestDescendant) {
            bestDescendant.isAttractor = true;
            if (!this.conceptualAttractors.has(bestDescendant.id)) {
              this.conceptualAttractors.set(bestDescendant.id, { discovered: this.generation, episodes: [], proxyFor: aid });
            }
            this.conceptualAttractors.get(bestDescendant.id).episodes.push(this.generation);
            this.log(`🌟 Attractor proxy: ${bestDescendant.id} for culled progenitor ${aid} (${count} hits)`, 'attractor');
          }
        }
      }
    }
  }

  cascadeDepth(id, visited, maxDepth, childrenOf = null) {
    if (visited.has(id) || maxDepth <= 0) return 0;
    visited.add(id);
    const children = childrenOf ? (childrenOf.get(id) || []) : Array.from(this.glyphs.values()).filter(g => g.ancestry.includes(id));
    if (children.length === 0) return 1;
    let maxChild = 0;
    for (const c of children) {
      maxChild = Math.max(maxChild, this.cascadeDepth(c.id, visited, maxDepth - 1, childrenOf));
    }
    return 1 + maxChild;
  }

  // ── TAG VECTORIZATION (character trigram embeddings) ──
  _tagVec(tag) {
    // 64-dim vector from character trigrams — browser-native substitute for sentence transformers
    const dim = 64;
    const vec = new Float32Array(dim);
    const s = tag.toLowerCase();
    for (let i = 0; i <= s.length - 3; i++) {
      const tri = s.charCodeAt(i) * 7919 + s.charCodeAt(i+1) * 6271 + s.charCodeAt(i+2) * 4219;
      vec[Math.abs(tri) % dim] += 1;
      vec[Math.abs(tri * 31) % dim] += 0.5;
    }
    // Also encode bigrams for short tags
    for (let i = 0; i <= s.length - 2; i++) {
      const bi = s.charCodeAt(i) * 5381 + s.charCodeAt(i+1) * 3671;
      vec[Math.abs(bi) % dim] += 0.7;
    }
    // Unigram fallback for single-char tags
    for (let i = 0; i < s.length; i++) {
      vec[Math.abs(s.charCodeAt(i) * 2903) % dim] += 0.3;
    }
    return vec;
  }

  // ── TAG COMPRESSION (ported from MVP) ──
  // Semantic dedup: merge near-duplicate tags by vector cosine similarity
  // Preserves cognitive markers, caps at MAX_TAGS_PER_GLYPH
  compressTags(tags) {
    if (tags.length <= MAX_TAGS_PER_GLYPH) return tags;
    const keep = [];
    // Pass 1: always retain cognitive/structural markers
    const structural = [];
    const regular = [];
    for (const t of tags) {
      if (COGNITIVE_TAGS.has(t) || t.startsWith('c#') || t.startsWith('gen:')) {
        structural.push(t);
      } else {
        regular.push(t);
      }
    }
    // Pass 2: dedupe regular tags by semantic similarity
    for (const t of regular) {
      let redundant = false;
      const tv = this._tagVec(t);
      for (const k of keep) {
        if (this._cosine(tv, this._tagVec(k)) > COMPRESS_SIM_THRESHOLD) {
          redundant = true;
          break;
        }
      }
      if (!redundant) keep.push(t);
    }
    // Combine: structural first, then deduped regular, cap total
    const result = [...new Set([...structural, ...keep])];
    return result.slice(0, MAX_TAGS_PER_GLYPH);
  }

  // ── SEMANTIC DRIFT LOGGER (from v4.2, browser-adapted) ──
  logSemanticMergers() {
    const WINDOW = 200, SIM_THRESHOLD = 0.7;
    if (this.glyphs.size < 20) return null;
    const arr = Array.from(this.glyphs.values());
    const recent = arr.slice(-Math.min(WINDOW, arr.length));
    let allTags = [...new Set(recent.flatMap(g => g.tags))];
    if (allTags.length < 2) return null;
    // Cap tags to prevent O(n²) blowup
    if (allTags.length > 80) allTags = allTags.sort(() => Math.random() - 0.5).slice(0, 80);

    // Vectorize
    const vecs = new Map();
    for (const t of allTags) vecs.set(t, this._tagVec(t));

    // Find high-similarity pairs
    const mergers = [];
    for (let i = 0; i < allTags.length; i++) {
      for (let j = i + 1; j < allTags.length; j++) {
        const t1 = allTags[i], t2 = allTags[j];
        if (t1 === t2) continue;
        const sim = this._cosine(vecs.get(t1), vecs.get(t2));
        if (sim > SIM_THRESHOLD) mergers.push({ t1, t2, sim });
      }
    }
    if (mergers.length === 0) return null;

    mergers.sort((a, b) => b.sim - a.sim);
    const top = mergers.slice(0, 5);
    this.log(`🌊 Semantic drift: ${top.length} merger${top.length > 1 ? 's' : ''} detected (top: ${top[0].t1}↔${top[0].t2} ${top[0].sim.toFixed(3)})`, 'analysis');
    return top;
  }

  // ── LEXICON OBSERVABLES (Physics Lexicon §III, §V, §VIII, §IX, §X) ──
  computeObservables() {
    const arr = Array.from(this.glyphs.values());
    if (arr.length < 5) return;

    // §III: Mean Field Entropy ⟨H⟩ = (1/N) Σ Hi
    const entropies = arr.map(g => g.entropy);
    const H_mean = entropies.reduce((a, b) => a + b, 0) / arr.length;

    // §III: Entropy Variance σ_H² = ⟨(H - ⟨H⟩)²⟩
    const sigma_H = Math.sqrt(entropies.reduce((s, e) => s + (e - H_mean) ** 2, 0) / arr.length);

    // §V: Order Parameter ψ = ⟨ρ⟩ averaged over all resonant pairs
    let psiSum = 0, psiCount = 0;
    for (const { score } of this.resonanceMatrix.values()) {
      psiSum += score;
      psiCount++;
    }
    const psi = psiCount > 0 ? psiSum / psiCount : 0;

    // §I: Mean Thermodynamic Velocity ⟨vp⟩ = ⟨dH/dt⟩ / Cs (Cs ≈ 1)
    let vpSum = 0, vpCount = 0;
    for (const g of arr) {
      if (g.thermodynamicState) {
        vpSum += Math.abs(g.thermodynamicState.dH_dt);
        vpCount++;
      }
    }
    const vp_mean = vpCount > 0 ? vpSum / vpCount : 0;

    // §III: Entropy Current Density J_H = Σ_edges (H_source - H_target)/distance
    let J_H = 0;
    for (const { a, b } of this.resonanceMatrix.values()) {
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      J_H += Math.abs(a.entropy - b.entropy) / dist;
    }

    // §V: Singularity Count N_Ξ — glyphs with no valid thermodynamic state
    let N_xi = 0;
    for (const g of arr) {
      if (!g.thermodynamicState || g.entropy === 0 || !isFinite(g.entropy)) N_xi++;
    }
    const f_xi = arr.length > 0 ? N_xi / arr.length : 0;

    // §VIII: Semantic Free Energy F = U - T·S
    // U ≈ ⟨H⟩ (internal semantic energy), T ≈ σ_H (effective temperature), S ≈ ln(Ω) where Ω = tag config multiplicity
    const T_eff = sigma_H / 100; // Normalize temperature
    const S_config = Math.log(Math.max(1, this.tags.length)) + Math.log(Math.max(1, arr.length)); // Configuration entropy
    const F_free = H_mean - T_eff * S_config;

    Object.assign(this.observables, {
      psi: +psi.toFixed(4),
      vp_mean: +vp_mean.toFixed(2),
      J_H: +J_H.toFixed(2),
      f_xi: +f_xi.toFixed(4),
      F_free: +F_free.toFixed(1),
      H_mean: +H_mean.toFixed(1),
      sigma_H: +sigma_H.toFixed(1),
      N_xi,
    });
  }

  // ── DEEP ANALYSIS (from v4.2, browser-adapted) ──
  performDeepAnalysis() {
    if (this.generation % this.DEEP_ANALYSIS_INTERVAL !== 0 || this.glyphs.size < 20) return;
    const arr = Array.from(this.glyphs.values());
    const concepts = arr.filter(g => g.isConcept);
    const organic = arr.filter(g => !g.isConcept);
    const attractors = arr.filter(g => g.isAttractor);
    const reflexGlyphs = arr.filter(g => g.isReflex);

    // Tag frequency analysis
    const tagCounts = new Map();
    for (const g of arr) for (const t of g.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Entropy distribution
    const entropies = arr.map(g => g.entropy);
    const avgEntropy = entropies.reduce((a, b) => a + b, 0) / entropies.length;
    const stdEntropy = Math.sqrt(entropies.reduce((s, e) => s + (e - avgEntropy) ** 2, 0) / entropies.length);

    // Season distribution of living glyphs
    const seasonDist = {};
    for (const g of arr) {
      const s = g.seasonBorn || 'unknown';
      seasonDist[s] = (seasonDist[s] || 0) + 1;
    }

    // Semantic drift detection
    const semanticMergers = this.logSemanticMergers();

    this.lastAnalysis = {
      generation: this.generation,
      season: this.season,
      total: arr.length,
      concepts: concepts.length,
      organic: organic.length,
      attractors: attractors.length,
      reflexGlyphs: reflexGlyphs.length,
      topTags,
      avgEntropy: avgEntropy.toFixed(1),
      stdEntropy: stdEntropy.toFixed(1),
      seasonDist,
      semanticMergers,
      collisionRate: this.collisionLog.length > 0 ? (this.collisionLog.length / this.generation).toFixed(3) : '0',
      evolvedVocab: this.evolvedTags.length,
      pools: this.dormantPools.length,
      shortcuts: this.activeShortcuts.length,
      helixStable: this.helix.stable,
      observables: { ...this.observables },
    };

    this.log(`📊 Deep analysis: gen ${this.generation} | ${arr.length} glyphs | ${attractors.length} attractors | ε̄=${avgEntropy.toFixed(0)}`, 'analysis');
  }

  // ── RESONANCE ENTRAINMENT SYSTEM ──
  // Resonance-mediated tag and entropy propagation through the network

  _isHighLineage(glyph) {
    return glyph.ancestry.some(pid => this.conceptualAttractors.has(pid));
  }

  _entrainmentStrength(source, target, resonance) {
    // Strength = resonance × entropy gradient (flows downhill) × phase alignment
    const gradient = Math.max(0, source.entropy - target.entropy) / 8000;
    const phaseBonus = (source.thermodynamicState && target.thermodynamicState)
      ? Math.max(0, Math.cos(Math.abs(source.thermodynamicState.phi_phase - target.thermodynamicState.phi_phase) * Math.PI))
      : 0.5;
    return resonance * gradient * phaseBonus;
  }

  propagateEntrainment(target, sources, totalStrength) {
    if (target.entrained || target.isConcept) return;

    // Tag transfer: weighted by strength, only novel tags, compressed
    const sourceTagPool = [];
    for (const { source, strength } of sources) {
      // Higher strength → more tags transferred from this source
      const count = Math.ceil(strength * 3);
      const novel = source.tags.filter(t => !target.tags.includes(t) && !t.startsWith('gen:') && !t.startsWith('μ'));
      sourceTagPool.push(...novel.slice(0, count));
    }
    if (sourceTagPool.length > 0) {
      // Dedupe and limit before compression
      const unique = [...new Set(sourceTagPool)].slice(0, 4);
      target.tags = this.compressTags([...target.tags, ...unique]);
    }

    // Entropy transfer: proportional to total strength (not flat boost)
    const avgSourceEntropy = sources.reduce((s, x) => s + x.source.entropy, 0) / sources.length;
    const entropyTransfer = avgSourceEntropy * totalStrength * 0.12;
    target.entropyHistory.push(target.entropy + entropyTransfer);

    // Mutation rate: small bump only for attractor descendants, capped at 0.6
    if (this._isHighLineage(target)) {
      target.mutationRate = Math.min(0.6, target.mutationRate + totalStrength * 0.1);
    }

    // Priority: based on thermodynamic state, not tag-name matching
    if (target.thermodynamicState) {
      if (target.thermodynamicState.tau_coherence > 2.0) target.priority += totalStrength * 0.8;
      if (target.thermodynamicState.dH_dt < -5) target.priority += totalStrength * 0.5;
      if (target.thermodynamicState.phi_phase > 0.7 && target.thermodynamicState.tau_coherence > 1.5) target.priority += totalStrength * 0.6;
    }

    target.entrained = true;
    target.entrainmentGen = this.generation;
    target.stagnantCount = 0;
  }

  runEntrainmentCycle() {
    if (this.generation % 10 !== 0) return;
    if (this.resonanceMatrix.size < 3) return;

    // Reset entrainment flags
    for (const g of this.glyphs.values()) g.entrained = false;

    // Build entrainment graph from resonance network
    // For each resonant pair, the higher-entropy glyph can entrain the lower
    const entrainmentCandidates = new Map(); // targetId → [{source, strength}]

    for (const { a, b, score } of this.resonanceMatrix.values()) {
      // Entropy flows downhill through resonance connections
      const [source, target] = a.entropy >= b.entropy ? [a, b] : [b, a];
      const strength = this._entrainmentStrength(source, target, score);
      if (strength < 0.05) continue; // Below threshold — no entrainment

      if (!entrainmentCandidates.has(target.id)) entrainmentCandidates.set(target.id, []);
      entrainmentCandidates.get(target.id).push({ source, strength });
    }

    // Execute entrainment — targets with multiple resonant sources get stronger effects
    let entrained = 0;
    for (const [targetId, sources] of entrainmentCandidates) {
      const target = this.glyphs.get(targetId);
      if (!target || target.entrained || target.isConcept) continue;
      const totalStrength = Math.min(1.0, sources.reduce((s, x) => s + x.strength, 0));
      this.propagateEntrainment(target, sources, totalStrength);
      entrained++;
    }

    // Decay priority and mutation rate toward baseline
    for (const g of this.glyphs.values()) {
      g.priority *= 0.95;
      g.mutationRate = 0.1 + (g.mutationRate - 0.1) * 0.98; // Slow decay toward 0.1
    }

    if (entrained > 0) this.log(`🌀 Resonance entrainment: ${entrained} glyphs via ${this.resonanceMatrix.size} connections`, 'evolution');
  }

  syncCoherence(glyph) {
    // Multi-factor stability: priority contribution + thermodynamic coherence + interaction recency
    const entropyNorm = glyph.entropy / 3000; // normalize to ~0-1 range (new scale: max 8000)
    const priorityFactor = glyph.priority * 0.3;
    const tauFactor = glyph.thermodynamicState ? Math.min(1, glyph.thermodynamicState.tau_coherence / 5) * 0.3 : 0;
    const activityFactor = Math.max(0, 1 - glyph.stagnantCount / 60) * 0.2;
    const entropyStability = (entropyNorm > 0.3 && entropyNorm < 2.0) ? 0.2 : 0; // mid-range entropy = stable
    const coherence = priorityFactor + tauFactor + activityFactor + entropyStability;
    glyph.stability = Math.min(1.0, Math.max(0, coherence));
  }

  // ── Meta-Reflex Helix Core Step ──
  helixStep() {
    const h = this.helix;
    h.t += h.dt;
    h.HRV = Math.sin(2 * Math.PI * 0.2 * h.t) * 0.5 + Math.sin(2 * Math.PI * 0.05 * h.t) * 0.3;
    h.gamma = h.gamma0 + h.epsilon * h.HRV;
    const rawExp = h.alpha * Math.exp(h.beta * h.t / h.phi);
    const phase = h.omega * h.t + h.gamma * h.R_prev;
    const rawR = rawExp * Math.cos(phase);
    h.r_sq = h.R * h.R + h.R_prev * h.R_prev;
    h.A = h.A0 / (1 + h.lambda * h.r_sq);
    h.R_prev = h.R;
    h.R = h.A * Math.tanh(rawR);
    h.theta_prev = h.theta;
    const dTheta = h.omega * h.dt;
    const phaseGrad = h.R - h.R_prev;
    h.theta = h.theta + dTheta - h.eta * phaseGrad;
    const thetaAccel = Math.abs(h.theta - 2 * h.theta_prev + (h.theta_prev - dTheta));
    const adaptiveK = 1.0 / (1 + thetaAccel * 10);
    h.z = adaptiveK * h.theta;
    h.history.push(h.R);
    h.A_history.push(h.A);
    h.phase_history.push(h.theta % (2 * Math.PI));
    if (h.history.length > 200) h.history.shift();
    if (h.A_history.length > 200) h.A_history.shift();
    if (h.phase_history.length > 200) h.phase_history.shift();
    const wasStable = h.stable;
    if (h.history.length > 20) {
      const recent = h.history.slice(-20);
      const diffs = [];
      for (let i = 1; i < recent.length; i++) diffs.push(Math.abs(recent[i] - recent[i-1]));
      const avgDiff = diffs.reduce((a,b) => a+b, 0) / diffs.length;
      const recentA = h.A_history.slice(-10);
      const aDrift = Math.abs(recentA[recentA.length-1] - recentA[0]);
      h.stable = avgDiff < 0.15 && aDrift < 0.05;
    }
    if (h.stable) h.stableFor++; else h.stableFor = 0;
    if (h.stable && !wasStable && this.generation - h.lastLogGen > 10) {
      this.log(`🌀 Helix stabilized — R=${h.R.toFixed(3)} A=${h.A.toFixed(3)} z=${h.z.toFixed(2)}`, 'helix');
      h.lastLogGen = this.generation;
    }
    if (!h.stable && wasStable && this.generation - h.lastLogGen > 10) {
      this.log(`🌀 Helix destabilized — r²=${h.r_sq.toFixed(2)} γ=${h.gamma.toFixed(3)}`, 'helix');
      h.lastLogGen = this.generation;
    }
    return h;
  }

  applyHelixModulation() {
    const h = this.helix;
    const breathScale = 1.0 + h.R * 0.1;
    this.RESONANCE_THRESHOLD = 0.45 - h.A * 0.08;
    for (const glyph of this.glyphs.values()) {
      glyph.vx *= breathScale;
      glyph.vy *= breathScale;
      const dx = glyph.x - this.canvasW / 2;
      const dy = glyph.y - this.canvasH / 2;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      glyph.vx += (-dy / dist) * h.HRV * 0.15;
      glyph.vy += (dx / dist) * h.HRV * 0.15;
    }
  }

  // ── Singularity Scanner ──
  _glyphFeatureVec(glyph) {
    const ts = glyph.thermodynamicState;
    if (!ts) return null;
    return [ts.H / 8000, ts.dH_dt / 50, Math.min(ts.tau_coherence, 10) / 10, ts.phi_phase, glyph.entropy / 8000, glyph.tags.length / 10, glyph.x / this.canvasW, glyph.y / this.canvasH];
  }
  _dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  _norm(v) { return Math.sqrt(this._dot(v, v)) || 1e-10; }
  _cosine(a, b) { return this._dot(a, b) / (this._norm(a) * this._norm(b)); }
  _signSignature(v) {
    if (!this._projections) {
      this._projections = [];
      let seed = 47;
      const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };
      for (let p = 0; p < 12; p++) { const row = []; for (let d = 0; d < 8; d++) row.push(rng() < 0.5 ? 1.0 : -1.0); this._projections.push(row); }
    }
    let sig = 0;
    for (let p = 0; p < this._projections.length; p++) { if (this._dot(v, this._projections[p]) >= 0) sig |= (1 << p); }
    return sig;
  }
  singularityScan() {
    const glyphArr = Array.from(this.glyphs.values());
    if (glyphArr.length < 20) return;
    const exactIndex = new Map(); const buckets = new Map(); let scanned = 0;
    for (const g of glyphArr) {
      const vec = this._glyphFeatureVec(g); if (!vec) continue; scanned++;
      // Coarser hashing — toFixed(3) instead of toFixed(4)
      const hash = vec.map(v => v.toFixed(3)).join('|');
      if (!exactIndex.has(hash)) exactIndex.set(hash, []); exactIndex.get(hash).push(g);
      const sig = this._signSignature(vec);
      if (!buckets.has(sig)) buckets.set(sig, []); buckets.get(sig).push({ glyph: g, vec });
    }
    let exactCulled = 0, nearCulled = 0;
    for (const [, cluster] of exactIndex.entries()) {
      if (cluster.length < 3) continue; // Tolerate pairs, only cull triples+
      cluster.sort((a, b) => b.entropy - a.entropy);
      for (let i = 2; i < cluster.length; i++) { // Keep top 2 of each cluster
        const v = cluster[i];
        if (v.isConcept || v.isAttractor || v.isReflex) continue;
        this.tagSignatures.delete(this.tagSig(v.tags)); this.glyphs.delete(v.id); exactCulled++;
      }
    }
    // Near-clone: only check a sample of buckets for performance
    const bucketArr = Array.from(buckets.entries()).filter(([, e]) => e.length >= 2);
    const sampleBuckets = bucketArr.length > 50 ? bucketArr.sort(() => Math.random() - 0.5).slice(0, 50) : bucketArr;
    const seenPairs = new Set();
    for (const [, entries] of sampleBuckets) {
      if (entries.length < 2) continue;
      const limit = Math.min(entries.length, 20); // cap inner loop
      for (let i = 0; i < limit; i++) for (let j = i + 1; j < limit; j++) {
        const a = entries[i], b = entries[j];
        const pk = a.glyph.id < b.glyph.id ? `${a.glyph.id},${b.glyph.id}` : `${b.glyph.id},${a.glyph.id}`;
        if (seenPairs.has(pk)) continue; seenPairs.add(pk);
        if (this._cosine(a.vec, b.vec) >= 0.999) {
          const victim = a.glyph.entropy < b.glyph.entropy ? a.glyph : b.glyph;
          if (victim.isConcept || victim.isAttractor || victim.isReflex || !this.glyphs.has(victim.id)) continue;
          this.tagSignatures.delete(this.tagSig(victim.tags)); this.glyphs.delete(victim.id); nearCulled++;
        }
      }
    }
    if (exactCulled > 0 || nearCulled > 0) this.log(`🔍 Singularity scan: ${exactCulled} exact + ${nearCulled} near-clones culled`, 'scan');
  }

  // ── Dormant Pool Pathing ──
  _buildPhaseMatrix(a, b) {
    const sa = a.thermodynamicState, sb = b.thermodynamicState;
    if (!sa || !sb) return null;
    const g = [[sa.phi_phase * sa.tau_coherence, sa.phi_phase * sb.tau_coherence], [sb.phi_phase * sa.tau_coherence, sb.phi_phase * sb.tau_coherence]];
    const dH_a = Math.abs(sa.dH_dt) / 50, dH_b = Math.abs(sb.dH_dt) / 50;
    const g_prime = [[sa.H / 8000 + dH_a, (sa.H - sb.H) / 16000], [(sb.H - sa.H) / 16000, sb.H / 8000 + dH_b]];
    return { g, g_prime };
  }
  _matMul2x2(a, b) { return [[a[0][0]*b[0][0]+a[0][1]*b[1][0], a[0][0]*b[0][1]+a[0][1]*b[1][1]], [a[1][0]*b[0][0]+a[1][1]*b[1][0], a[1][0]*b[0][1]+a[1][1]*b[1][1]]]; }
  _trace2x2(m) { return m[0][0] + m[1][1]; }
  _frobNorm2x2(m) { return Math.sqrt(m[0][0]*m[0][0] + m[0][1]*m[0][1] + m[1][0]*m[1][0] + m[1][1]*m[1][1]); }
  _matSub2x2(a, b) { return [[a[0][0]-b[0][0], a[0][1]-b[0][1]], [a[1][0]-b[1][0], a[1][1]-b[1][1]]]; }
  _activatePool(pool) {
    const { g, g_prime } = pool.matrices;
    const gg_p = this._matMul2x2(g, g_prime);
    const g_pg = this._matMul2x2(g_prime, g);
    const commutator = this._matSub2x2(gg_p, g_pg);
    pool.nonComm = this._frobNorm2x2(commutator);
    pool.maxTrace = Math.max(this._trace2x2(gg_p), this._trace2x2(g_pg));
    return pool.nonComm > 0.001 && pool.maxTrace >= this.HBAR_OVER_2;
  }
  detectPools() {
    const POOL_RADIUS = 120, MIN_POOL = 3, MAX_POOL = 5;
    if (this.generation < 50) return; // No pools before system has structure
    const all = Array.from(this.glyphs.values()).filter(g => g.thermodynamicState);
    if (all.length < 15) return;
    const arr = all.length > 200 ? all.sort(() => Math.random() - 0.5).slice(0, 200) : all;
    const assigned = new Set(); const pools = [];
    for (let i = 0; i < arr.length && pools.length < 6; i++) {
      const seed = arr[i]; if (assigned.has(seed.id)) continue;
      const members = [seed]; assigned.add(seed.id);
      for (let j = 0; j < arr.length && members.length < MAX_POOL; j++) {
        if (i === j || assigned.has(arr[j].id)) continue;
        const dx = seed.x - arr[j].x, dy = seed.y - arr[j].y;
        if (dx*dx + dy*dy > POOL_RADIUS * POOL_RADIUS) continue;
        // Require actual resonance between seed and candidate
        const res = seed.resonanceWith(arr[j]);
        if (res > this.RESONANCE_THRESHOLD) {
          members.push(arr[j]); assigned.add(arr[j].id);
        }
      }
      if (members.length >= MIN_POOL) {
        const sorted = members.sort((a, b) => b.entropy - a.entropy);
        const matrices = this._buildPhaseMatrix(sorted[0], sorted[1]);
        if (matrices) pools.push({ id: `pool_${this.generation}_${pools.length}`, nodes: members.map(g => g.id), anchor: [sorted[0].id, sorted[1].id], matrices, nonComm: 0, maxTrace: 0 });
      }
    }
    this.dormantPools = pools;
  }
  activatePoolShortcuts() {
    // Shortcuts are permanent once formed — only remove if both endpoints are dead
    this.activeShortcuts = this.activeShortcuts.filter(s => this.glyphs.has(s.a) || this.glyphs.has(s.b));
    let activated = 0;
    for (const pool of this.dormantPools) {
      if (this._activatePool(pool)) {
        const nodes = pool.nodes;
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = this.glyphs.get(nodes[i]), b = this.glyphs.get(nodes[j]);
          if (!a || !b) continue;
          if (!this.activeShortcuts.some(s => (s.a === nodes[i] && s.b === nodes[j]) || (s.a === nodes[j] && s.b === nodes[i])))
            this.activeShortcuts.push({ a: nodes[i], b: nodes[j], weight: 0.5, locked: true, formedGen: this.generation, nonComm: pool.nonComm });
        }
        activated++;
      }
    }
    if (activated > 0) this.log(`🔗 ${activated} pools activated (${this.activeShortcuts.length} shortcuts, locked)`, 'pool');
    // Cap total — keep oldest (most established) if over limit
    if (this.activeShortcuts.length > 80) {
      this.activeShortcuts = this.activeShortcuts.slice(0, 80);
    }
  }
  applyShortcutGravity() {
    for (const sc of this.activeShortcuts) {
      const a = this.glyphs.get(sc.a), b = this.glyphs.get(sc.b);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx*dx + dy*dy) + 1;
      const pull = Math.min(0.3, (sc.nonComm * 0.8) / dist);
      const nx = dx / dist, ny = dy / dist;
      a.vx += nx * pull; a.vy += ny * pull;
      b.vx -= nx * pull; b.vy -= ny * pull;
    }
  }

  // ── PRESSURE SYSTEM (ported from MVP) ──
  // When total mass exceeds threshold, synthesize a purpose anchor and spawn fresh glyphs
  pressureCheck() {
    if (this.generation % this.PRESSURE_INTERVAL !== 0) return;
    const arr = Array.from(this.glyphs.values());
    const recent = arr.slice(-Math.min(400, arr.length));
    const totalMass = recent.reduce((s, g) => s + g.mass, 0);
    if (totalMass <= this.PRESSURE_THRESHOLD) return;

    // Pressure event: synthesize from the tag landscape
    const tagBag = new Set();
    for (const g of recent.slice(-100)) for (const t of g.tags) tagBag.add(t);
    const tags = this.compressTags([...tagBag, 'purpose', 'synthesis']);
    const anchor = this.createGlyph(tags, [recent[0].id, recent[recent.length - 1].id]);
    anchor.isConcept = false;
    this.store(anchor);

    // Spawn a few fresh exploratory glyphs to relieve pressure
    for (let i = 0; i < 3; i++) {
      const fresh = this.createGlyph();
      if (fresh) this.store(fresh);
    }
    this.log(`🔥 Pressure event: mass=${Math.round(totalMass)} > threshold=${this.PRESSURE_THRESHOLD} → anchor ${anchor.id} + 3 fresh`, 'pressure');
  }

  // ── Main Step (all systems integrated) ──
  step() {
    this.generation++;
    this.updateSeason(); // v4.2 seasonal
    const g = this.createGlyph();
    this.store(g);
    if (this.generation % this.BEACON_UPDATE_INTERVAL === 0) {
      this.updateThermodynamics();
      this.updateResonanceField();
      this.computeObservables(); // Lexicon observables
    }
    this.coordinate();
    this.reflexCheck(); // v4.2 reflex system
    this.runEntrainmentCycle(); // Resonance entrainment
    this.pressureCheck(); // MVP pressure system
    this.updateInfluenceAndAttractors(); // v4.2 influence
    this.performDeepAnalysis(); // v4.2 deep analysis
    if (this.generation % 40 === 0) this.singularityScan();
    if (this.generation % this.POOL_SCAN_INTERVAL === 0) { this.detectPools(); this.activatePoolShortcuts(); }
    this.applyShortcutGravity();
    this.helixStep();
    this.applyHelixModulation();
    // Sync coherence for ALL glyphs every step (not just entrained)
    for (const glyph of this.glyphs.values()) {
      this.syncCoherence(glyph);
      glyph.update(this.canvasW, this.canvasH);
    }
    if (this.shockwave) { this.shockwave.radius += 8; if (this.shockwave.radius > this.shockwave.maxRadius) this.shockwave = null; }
  }

  getStats() {
    let concepts = 0, attractors = 0, reflexGlyphs = 0, entrained = 0, stabilitySum = 0;
    for (const g of this.glyphs.values()) {
      if (g.isConcept) concepts++;
      if (g.isAttractor) attractors++;
      if (g.isReflex) reflexGlyphs++;
      if (g.entrained) entrained++;
      stabilitySum += g.stability;
    }
    const total = this.glyphs.size;
    const organic = total - concepts;
    const avgStability = total > 0 ? stabilitySum / total : 0;
    // Cap collision log to last 500 entries to prevent unbounded growth
    if (this.collisionLog.length > 500) this.collisionLog = this.collisionLog.slice(-500);
    const syntheses = this.collisionLog.filter(c => c.crossType).length;
    const avgRes = this.collisionLog.length > 0 ? this.collisionLog.reduce((s, e) => s + e.resonance, 0) / this.collisionLog.length : 0;
    return { generation: this.generation, total, concepts, organic, attractors, reflexGlyphs, entrained, avgStability: +avgStability.toFixed(3), collisions: this.collisionLog.length, syntheses, avgResonance: avgRes, resonantPairs: this.resonanceMatrix.size, openPipes: this.openPipes.size, vocabulary: this.tags.length, pools: this.dormantPools.length, shortcuts: this.activeShortcuts.length, season: this.season, seasonCounter: this.seasonCounter, seasonDuration: this.SEASON_DURATION, lastAnalysis: this.lastAnalysis, helix: { R: this.helix.R, A: this.helix.A, z: this.helix.z, gamma: this.helix.gamma, stable: this.helix.stable, stableFor: this.helix.stableFor, HRV: this.helix.HRV }, obs: { ...this.observables } };
  }

  reset() {
    this.glyphs.clear(); this.nextId = 0; this.generation = 0;
    this.resonanceMatrix.clear(); this.openPipes.clear();
    this.collisionLog = []; this.eventLog = []; this.conceptCount = 0;
    this.evolvedTags = []; this.tagSignatures.clear();
    this.season = SeasonalPhase.EXPLORATION; this.seasonCounter = 0;
    this.conceptualAttractors.clear(); this.lastAnalysis = null;
    this.reflexFreeCount = 0;
    this.observables = { psi:0, vp_mean:0, J_H:0, f_xi:0, F_free:0, H_mean:0, sigma_H:0, N_xi:0, phaseTransitions:0, criticalEvents:0 };
    Object.assign(this.helix, { t:0, R:0, R_prev:0, A:1.0, theta:0, theta_prev:0, z:0, gamma:0.5, HRV:0, r_sq:0, stable:false, stableFor:0, lastLogGen:-50, history:[], A_history:[], phase_history:[] });
    this.dormantPools = []; this.activeShortcuts = [];
    this._entropyChartHistory = [];
    for (let i = 0; i < 8; i++) this.store(this.createGlyph());
    this.log('Crucible v3 initialized', 'info');
  }

  serialize() {
    const glyphs = [];
    for (const g of this.glyphs.values()) {
      glyphs.push({ id: g.id, tags: g.tags, ancestry: g.ancestry, generation: g.generation, entropyHistory: g.entropyHistory.slice(-20), x: g.x, y: g.y, vx: g.vx, vy: g.vy, lastCollisionGen: g.lastCollisionGen, isConcept: g.isConcept, conceptData: g.conceptData, isReflex: g.isReflex, reflexType: g.reflexType, isAttractor: g.isAttractor, seasonBorn: g.seasonBorn, stagnantCount: g.stagnantCount, influenceScore: g.influenceScore, priority: g.priority, mutationRate: g.mutationRate, stability: g.stability });
    }
    return { glyphs, nextId: this.nextId, generation: this.generation, collisionLog: this.collisionLog.slice(-50), eventLog: this.eventLog.slice(-30), conceptCount: this.conceptCount, evolvedTags: this.evolvedTags.slice(-100), tagSignatures: Array.from(this.tagSignatures).slice(-500), season: this.season, seasonCounter: this.seasonCounter, attractors: Array.from(this.conceptualAttractors.entries()), helix: { t: this.helix.t, R: this.helix.R, R_prev: this.helix.R_prev, A: this.helix.A, theta: this.helix.theta, theta_prev: this.helix.theta_prev, z: this.helix.z, gamma: this.helix.gamma, HRV: this.helix.HRV, r_sq: this.helix.r_sq, stable: this.helix.stable, stableFor: this.helix.stableFor, history: this.helix.history.slice(-100), A_history: this.helix.A_history.slice(-100), phase_history: this.helix.phase_history.slice(-100) } };
  }

  deserialize(data) {
    if (!data) return;
    this.nextId = data.nextId || 0; this.generation = data.generation || 0;
    this.collisionLog = data.collisionLog || []; this.eventLog = data.eventLog || [];
    this.conceptCount = data.conceptCount || 0; this.evolvedTags = data.evolvedTags || [];
    this.tagSignatures = new Set(data.tagSignatures || []);
    this.season = data.season || SeasonalPhase.EXPLORATION;
    this.seasonCounter = data.seasonCounter || 0;
    if (data.attractors) this.conceptualAttractors = new Map(data.attractors);
    this.glyphs.clear();
    for (const gd of (data.glyphs || [])) {
      const g = new Glyph(gd.id, gd.tags, gd.ancestry, gd.generation, gd.isConcept || false);
      g.entropyHistory = gd.entropyHistory || []; g.x = gd.x; g.y = gd.y; g.vx = gd.vx; g.vy = gd.vy;
      g.lastCollisionGen = gd.lastCollisionGen || 0; g.conceptData = gd.conceptData || null;
      g.isReflex = gd.isReflex || false; g.reflexType = gd.reflexType || null;
      g.isAttractor = gd.isAttractor || false; g.seasonBorn = gd.seasonBorn || null;
      g.stagnantCount = gd.stagnantCount || 0; g.influenceScore = gd.influenceScore || 0;
      g.priority = gd.priority || 0; g.mutationRate = gd.mutationRate || 0.1; g.stability = gd.stability || 0;
      this.glyphs.set(g.id, g); this.tagSignatures.add(this.tagSig(gd.tags));
    }
    this.updateThermodynamics(); this.updateResonanceField();
    if (data.helix) Object.assign(this.helix, data.helix);
    this.log(`Restored gen ${this.generation} (${this.glyphs.size} glyphs, season: ${this.season})`, 'info');
  }
}

// ===== CANVAS RENDERERS =====
function renderField(canvas, engine, container) {
  if (!canvas || !engine || !container) return;
  const dpr = window.devicePixelRatio || 1;
  const w = container.clientWidth, h = container.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr);

  ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, w, h);
  const vg = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.3, w/2, h/2, Math.max(w,h)*0.7);
  vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

  // Season indicator band
  const sc = SEASON_MODIFIERS[engine.season]?.color || '#daa520';
  const progress = engine.seasonCounter / engine.SEASON_DURATION;
  ctx.fillStyle = sc + '15'; ctx.fillRect(0, h - 3, w * progress, 3);
  ctx.fillStyle = sc + '40'; ctx.fillRect(0, h - 1, w * progress, 1);

  if (engine.glyphs.size === 0) return;
  const sx = w / 1200, sy = h / 600;

  if (engine.shockwave) {
    const sw = engine.shockwave;
    const alpha = 1 - sw.radius / sw.maxRadius;
    ctx.strokeStyle = sw.color + Math.floor(alpha * 80).toString(16).padStart(2,'0');
    ctx.lineWidth = 2; ctx.beginPath();
    ctx.arc(sw.x * sx, sw.y * sy, sw.radius * Math.min(sx, sy), 0, Math.PI * 2); ctx.stroke();
  }

  // Resonance connections — capped and batched by type
  const resPairs = Array.from(engine.resonanceMatrix.values());
  const renderPairs = resPairs.length > engine.RENDER_CONNECTION_CAP
    ? resPairs.sort((a, b) => b.score - a.score).slice(0, engine.RENDER_CONNECTION_CAP)
    : resPairs;
  // Batch by type to reduce state changes
  const batches = { concept: [], cross: [], organic: [] };
  for (const { a, b, score } of renderPairs) {
    const bothC = a.isConcept && b.isConcept;
    const cross = a.isConcept !== b.isConcept;
    const type = bothC ? 'concept' : cross ? 'cross' : 'organic';
    batches[type].push({ a, b, score });
  }
  const batchStyles = {
    concept: { r: 218, g: 165, b: 32, aMul: 0.4, lw: 1 },
    cross:   { r: 180, g: 200, b: 100, aMul: 0.35, lw: 0.5 },
    organic: { r: 0,   g: 170, b: 255, aMul: 0.3, lw: 0.5 },
  };
  for (const [type, items] of Object.entries(batches)) {
    if (items.length === 0) continue;
    const s = batchStyles[type];
    ctx.lineWidth = s.lw;
    for (const { a, b, score } of items) {
      ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${score * s.aMul})`;
      ctx.beginPath();
      ctx.moveTo(a.x * sx, a.y * sy); ctx.lineTo(b.x * sx, b.y * sy); ctx.stroke();
    }
  }

  // Open pipes
  for (const key of engine.openPipes.keys()) {
    const [idA, idB] = key.split(',');
    const a = engine.glyphs.get(idA), b = engine.glyphs.get(idB);
    if (a && b) { ctx.strokeStyle = 'rgba(255,136,0,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x * sx, a.y * sy); ctx.lineTo(b.x * sx, b.y * sy); ctx.stroke(); }
  }

  // Pool shortcuts
  if (engine.activeShortcuts.length > 0) {
    ctx.setLineDash([4, 4]);
    for (const sc2 of engine.activeShortcuts) {
      const a = engine.glyphs.get(sc2.a), b = engine.glyphs.get(sc2.b);
      if (a && b) { ctx.strokeStyle = `rgba(180,100,255,${Math.min(0.7, sc2.nonComm * 2)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x * sx, a.y * sy); ctx.lineTo(b.x * sx, b.y * sy); ctx.stroke(); }
    }
    ctx.setLineDash([]);
  }

  // Glyphs — fast path for organics, fancy rendering for specials only
  const now = Date.now();
  // Batch organic glyphs as simple circles (no gradients, no rings)
  ctx.fillStyle = 'rgba(0,255,0,0.7)';
  ctx.beginPath();
  for (const glyph of engine.glyphs.values()) {
    if (glyph.isConcept || glyph.isAttractor || glyph.isReflex) continue;
    const gx = glyph.x * sx, gy = glyph.y * sy;
    const radius = Math.max(1.5, Math.min(3.5, Math.sqrt(glyph.entropy) / 18));
    ctx.moveTo(gx + radius, gy);
    ctx.arc(gx, gy, radius, 0, Math.PI * 2);
  }
  ctx.fill();

  // Entrained organic overlay — batch draw
  ctx.strokeStyle = 'rgba(255,68,102,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
  ctx.beginPath();
  for (const glyph of engine.glyphs.values()) {
    if (glyph.isConcept || glyph.isAttractor || glyph.isReflex || !glyph.entrained) continue;
    const gx = glyph.x * sx, gy = glyph.y * sy;
    ctx.moveTo(gx + 5, gy);
    ctx.arc(gx, gy, 5, 0, Math.PI * 2);
  }
  ctx.stroke(); ctx.setLineDash([]);

  // Special glyphs — full rendering with gradients (concepts, attractors, reflexes only)
  for (const glyph of engine.glyphs.values()) {
    if (!glyph.isConcept && !glyph.isAttractor && !glyph.isReflex) continue;
    const gx = glyph.x * sx, gy = glyph.y * sy;
    const baseRadius = Math.max(2, Math.min(glyph.isConcept ? 5.5 : glyph.isAttractor ? 5 : 4, Math.sqrt(glyph.entropy) / 15));
    const pulse = 1 + Math.sin(glyph.pulsePhase) * 0.1;
    const radius = baseRadius * pulse;
    const age = (now - glyph.birthTime) / 1000;
    const fadeIn = Math.min(1, age / 0.5);

    if (glyph.isConcept) {
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 2.2);
      grad.addColorStop(0, `rgba(218,165,32,${0.6 * fadeIn})`); grad.addColorStop(0.5, `rgba(218,165,32,${0.12 * fadeIn})`); grad.addColorStop(1, 'rgba(218,165,32,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, radius * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(218,165,32,${fadeIn})`; ctx.save(); ctx.translate(gx, gy); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4); ctx.restore();
    } else if (glyph.isAttractor) {
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 2.5);
      grad.addColorStop(0, `rgba(255,107,107,${0.6 * fadeIn})`); grad.addColorStop(0.5, `rgba(255,107,107,${0.15 * fadeIn})`); grad.addColorStop(1, 'rgba(255,107,107,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, radius * 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,107,107,${fadeIn})`; ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a2 = (i * Math.PI / 3) + glyph.pulsePhase * 0.3;
        const r2 = i % 2 === 0 ? radius * 1.2 : radius * 0.5;
        const px = gx + Math.cos(a2) * r2, py = gy + Math.sin(a2) * r2;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    } else if (glyph.isReflex) {
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 2);
      grad.addColorStop(0, `rgba(0,255,204,${0.4 * fadeIn})`); grad.addColorStop(1, 'rgba(0,255,204,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, radius * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(0,255,204,${fadeIn})`; ctx.beginPath();
      ctx.moveTo(gx, gy - radius * 1.2); ctx.lineTo(gx - radius, gy + radius * 0.6); ctx.lineTo(gx + radius, gy + radius * 0.6);
      ctx.closePath(); ctx.fill();
    }
    // Phase ring for special glyphs only
    if (glyph.thermodynamicState) {
      const phase = glyph.thermodynamicState.phi_phase;
      const hue = glyph.isConcept ? 30 + phase * 30 : glyph.isAttractor ? 0 + phase * 30 : phase * 120;
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${0.6 * fadeIn})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(gx, gy, radius + 3, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // ── MAP KEY ──
  const keyW = 62, keyY = 6, keyX = 4, lineH = 12;
  const keyItems = [
    // Glyphs
    { type: 'glyph', color: '#00ff00', shape: 'circle', label: 'Organic' },
    { type: 'glyph', color: '#daa520', shape: 'diamond', label: 'Concept' },
    { type: 'glyph', color: '#ff6b6b', shape: 'star', label: 'Attractor' },
    { type: 'glyph', color: '#00ffcc', shape: 'triangle', label: 'Reflex' },
    // Rings
    { type: 'ring', color: '#ff4466', dash: true, label: 'Entrained' },
    { type: 'ring', color: '#b4c864', dash: false, label: 'Stable' },
    { type: 'ring', color: '#ff8800', dash: false, label: 'Phase' },
    // Lines
    { type: 'line', color: '#00aaff', dash: false, label: 'Reson.' },
    { type: 'line', color: '#ff8800', dash: false, label: 'Pipe' },
    { type: 'line', color: '#b464ff', dash: true, label: 'Shortcut' },
    // Other
    { type: 'bar', color: SEASON_MODIFIERS[engine.season]?.color || '#daa520', label: engine.season.slice(0, 5) },
  ];
  const keyH = keyItems.length * lineH + 10;
  // Background
  ctx.fillStyle = 'rgba(10,9,8,0.5)'; ctx.strokeStyle = 'rgba(42,138,138,0.1)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.rect(keyX - 4, keyY, keyW, keyH); ctx.fill(); ctx.stroke();

  ctx.font = '6px "Segoe UI", system-ui, sans-serif'; ctx.textAlign = 'left';
  keyItems.forEach((item, i) => {
    const iy = keyY + 8 + i * lineH;
    const ix = keyX + 4;
    if (item.type === 'glyph') {
      if (item.shape === 'circle') {
        ctx.fillStyle = item.color; ctx.beginPath(); ctx.arc(ix + 4, iy, 3, 0, Math.PI * 2); ctx.fill();
      } else if (item.shape === 'diamond') {
        ctx.fillStyle = item.color; ctx.save(); ctx.translate(ix + 4, iy); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-2.5, -2.5, 5, 5); ctx.restore();
      } else if (item.shape === 'star') {
        ctx.fillStyle = item.color; ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const a = j * Math.PI / 3 - Math.PI / 2;
          const r = j % 2 === 0 ? 4 : 2;
          j === 0 ? ctx.moveTo(ix + 4 + Math.cos(a) * r, iy + Math.sin(a) * r) : ctx.lineTo(ix + 4 + Math.cos(a) * r, iy + Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
      } else if (item.shape === 'triangle') {
        ctx.fillStyle = item.color; ctx.beginPath();
        ctx.moveTo(ix + 4, iy - 3.5); ctx.lineTo(ix + 1, iy + 2.5); ctx.lineTo(ix + 7, iy + 2.5);
        ctx.closePath(); ctx.fill();
      }
    } else if (item.type === 'ring') {
      ctx.strokeStyle = item.color; ctx.lineWidth = 1.2;
      if (item.dash) ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.arc(ix + 4, iy, 3.5, 0, Math.PI * 2); ctx.stroke();
      if (item.dash) ctx.setLineDash([]);
    } else if (item.type === 'line') {
      ctx.strokeStyle = item.color; ctx.lineWidth = 1.2;
      if (item.dash) ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix + 8, iy); ctx.stroke();
      if (item.dash) ctx.setLineDash([]);
    } else if (item.type === 'bar') {
      ctx.fillStyle = item.color + '80';
      ctx.fillRect(ix, iy - 2, 8, 4);
      ctx.fillStyle = item.color;
      ctx.fillRect(ix, iy - 1, 5, 2);
    }
    ctx.fillStyle = 'rgba(122,230,214,0.6)'; ctx.fillText(item.label, ix + 12, iy + 3);
  });
}

function renderChart(canvas, engine, container, mode) {
  if (!canvas || !engine || !container) return;
  const dpr = window.devicePixelRatio || 1;
  const w = container.clientWidth, h = container.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr);
  ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, w, h);
  const pad = { t: 28, b: 30, l: 48, r: 16 }, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;

  if (mode === 'entropy') {
    // Compute per-glyph current entropy as a distribution, plus rolling mean history
    const organic = [], concept = [];
    for (const g of engine.glyphs.values()) {
      if (g.isConcept) concept.push(g.entropy); else organic.push(g.entropy);
    }
    const all = [...organic, ...concept];
    if (all.length < 2) { ctx.fillStyle = '#2a8a8a'; ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.fillText('Accumulating entropy data...', w/2, h/2); return; }

    // Use observables history if available, else build from current snapshot
    // Build rolling mean from the last 200 generations of observable H_mean
    const histLen = engine._entropyChartHistory ? engine._entropyChartHistory.length : 0;
    if (!engine._entropyChartHistory) engine._entropyChartHistory = [];
    const orgMean = organic.length > 0 ? organic.reduce((a,b) => a+b, 0) / organic.length : 0;
    const conMean = concept.length > 0 ? concept.reduce((a,b) => a+b, 0) / concept.length : 0;
    const orgMin = organic.length > 0 ? Math.min(...organic) : 0;
    const orgMax = organic.length > 0 ? Math.max(...organic) : 0;
    // Only push one sample per render to avoid duplication
    if (engine._entropyChartHistory.length === 0 || engine._entropyChartHistory[engine._entropyChartHistory.length - 1].gen !== engine.generation) {
      engine._entropyChartHistory.push({ gen: engine.generation, orgMean, conMean, orgMin, orgMax });
      if (engine._entropyChartHistory.length > 300) engine._entropyChartHistory.shift();
    }
    const hist = engine._entropyChartHistory;
    if (hist.length < 2) return;

    // Y range from history
    let yMin = Infinity, yMax = -Infinity;
    for (const h of hist) { yMin = Math.min(yMin, h.orgMin, h.conMean); yMax = Math.max(yMax, h.orgMax, h.conMean); }
    yMin = Math.max(0, yMin - 100); yMax = yMax + 100;
    const yRange = yMax - yMin || 1;

    // Grid
    ctx.strokeStyle = '#151510'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) { const y = pad.t + (ph/4)*i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w-pad.r, y); ctx.stroke(); ctx.fillStyle = '#2a8a8a'; ctx.font = '8px monospace'; ctx.textAlign = 'right'; ctx.fillText(Math.round(yMax - (yRange/4)*i), pad.l - 4, y + 3); }

    // Organic range band (min-max fill)
    ctx.fillStyle = 'rgba(0,255,0,0.08)';
    ctx.beginPath();
    hist.forEach((h, i) => { const x = pad.l + (i / (hist.length - 1)) * pw; const y = pad.t + ph - ((h.orgMax - yMin) / yRange) * ph; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    for (let i = hist.length - 1; i >= 0; i--) { const x = pad.l + (i / (hist.length - 1)) * pw; const y = pad.t + ph - ((hist[i].orgMin - yMin) / yRange) * ph; ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill();

    // Organic mean line
    ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 1.5; ctx.beginPath();
    hist.forEach((h, i) => { const x = pad.l + (i / (hist.length - 1)) * pw; const y = pad.t + ph - ((h.orgMean - yMin) / yRange) * ph; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();

    // Concept mean line
    if (concept.length > 0) {
      ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1.5; ctx.beginPath();
      hist.forEach((h, i) => { const x = pad.l + (i / (hist.length - 1)) * pw; const y = pad.t + ph - ((h.conMean - yMin) / yRange) * ph; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.stroke();
    }

    // ⟨H⟩_critical = 5200 threshold
    if (5200 >= yMin && 5200 <= yMax) {
      const critY = pad.t + ph - ((5200 - yMin) / yRange) * ph;
      ctx.strokeStyle = '#ff6b6b55'; ctx.lineWidth = 1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(pad.l, critY); ctx.lineTo(w-pad.r, critY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff6b6b88'; ctx.font = '7px monospace'; ctx.textAlign = 'left'; ctx.fillText('⟨H⟩crit=5200', pad.l + 2, critY - 3);
    }

    // X-axis gen labels
    const genStart = hist[0].gen, genEnd = hist[hist.length - 1].gen;
    ctx.fillStyle = '#2a8a8a'; ctx.font = '7px monospace'; ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) { const x = pad.l + (i / 4) * pw; ctx.fillText(Math.round(genStart + (genEnd - genStart) * (i / 4)), x, h - pad.b + 12); }

    ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff00'; ctx.fillText('— organic (mean ± range)', w - 12, 16);
    ctx.fillStyle = '#daa520'; ctx.fillText('— concept (mean)', w - 12, 28);
    ctx.fillStyle = '#3aaa9a'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(`Entropy · gen ${genStart}–${genEnd}`, w/2, 16);
  }

  if (mode === 'resonance') {
    const log = engine.collisionLog;
    if (log.length < 2) { ctx.fillStyle = '#2a8a8a'; ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.fillText('Awaiting collisions...', w/2, h/2); return; }
    const vals = log.map(e => e.resonance);
    const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
    ctx.strokeStyle = '#151510'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) { const y = pad.t + (ph/4)*i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w-pad.r, y); ctx.stroke(); ctx.fillStyle = '#2a8a8a'; ctx.font = '8px monospace'; ctx.textAlign = 'right'; ctx.fillText((max - (range/4)*i).toFixed(2), pad.l - 4, y + 3); }
    const threshY = pad.t + ph - ((engine.RESONANCE_THRESHOLD - min) / range) * ph;
    ctx.strokeStyle = '#ff444466'; ctx.lineWidth = 1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(pad.l, threshY); ctx.lineTo(w-pad.r, threshY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ff444466'; ctx.font = '7px monospace'; ctx.textAlign = 'left'; ctx.fillText(`ρc=${engine.RESONANCE_THRESHOLD}`, pad.l + 2, threshY - 3);
    // Phase transition threshold ρc*
    if (engine.PHASE_TRANSITION_THRESHOLD >= min && engine.PHASE_TRANSITION_THRESHOLD <= max) {
      const ptY = pad.t + ph - ((engine.PHASE_TRANSITION_THRESHOLD - min) / range) * ph;
      ctx.strokeStyle = '#daa52066'; ctx.lineWidth = 1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(pad.l, ptY); ctx.lineTo(w-pad.r, ptY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#daa52088'; ctx.font = '7px monospace'; ctx.fillText('ρc*=0.93', pad.l + 2, ptY - 3);
    }
    // Critical point threshold ρc**
    if (engine.CRITICAL_POINT_THRESHOLD >= min && engine.CRITICAL_POINT_THRESHOLD <= max) {
      const cpY = pad.t + ph - ((engine.CRITICAL_POINT_THRESHOLD - min) / range) * ph;
      ctx.strokeStyle = '#ff6b6b66'; ctx.lineWidth = 1; ctx.setLineDash([2,2]); ctx.beginPath(); ctx.moveTo(pad.l, cpY); ctx.lineTo(w-pad.r, cpY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff6b6b88'; ctx.font = '7px monospace'; ctx.fillText('ρc**=0.997', pad.l + 2, cpY - 3);
    }
    log.forEach((entry, i) => {
      const x = pad.l + (i / (vals.length - 1)) * pw, y = pad.t + ph - ((entry.resonance - min) / range) * ph;
      const color = entry.crossType ? '#daa520' : '#00aaff';
      if (i > 0) { ctx.strokeStyle = color + '88'; ctx.lineWidth = 0.8; const px = pad.l + ((i-1) / (vals.length - 1)) * pw; const py = pad.t + ph - ((vals[i-1] - min) / range) * ph; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill();
    });
    ctx.font = '9px monospace'; ctx.textAlign = 'right'; ctx.fillStyle = '#00aaff'; ctx.fillText('● organic', w-12, 16); ctx.fillStyle = '#daa520'; ctx.fillText('● synthesis', w-12, 28);
    ctx.fillStyle = '#3aaa9a'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(`Resonance · ${log.length} collisions`, w/2, 16);
  }
}

function renderHelix(canvas, engine, container) {
  if (!canvas || !engine || !container) return;
  const dpr = window.devicePixelRatio || 1;
  const w = container.clientWidth, h = container.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr);
  ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, w, h);
  const hx = engine.helix, hist = hx.history, aHist = hx.A_history;
  if (hist.length < 3) { ctx.fillStyle = '#2a8a8a'; ctx.font = '11px "Segoe UI", "SF Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Helix core warming up...', w/2, h/2); return; }
  const topH = h * 0.55, pad = { t: 28, b: 8, l: 48, r: 16 }, pw = w - pad.l - pad.r, ph = topH - pad.t - pad.b;
  const minR = Math.min(...hist, -1), maxR = Math.max(...hist, 1), rangeR = maxR - minR || 1;
  ctx.strokeStyle = '#151510'; ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) { const y = pad.t + (ph/4)*i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w-pad.r, y); ctx.stroke(); ctx.fillStyle = '#2a8a8a'; ctx.font = '8px monospace'; ctx.textAlign = 'right'; ctx.fillText((maxR - (rangeR/4)*i).toFixed(2), pad.l - 4, y + 3); }
  const zeroY = pad.t + ph - ((0 - minR) / rangeR) * ph;
  ctx.strokeStyle = '#3aaa9a33'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, zeroY); ctx.lineTo(w-pad.r, zeroY); ctx.stroke();
  if (aHist.length > 1) {
    ctx.fillStyle = 'rgba(218,165,32,0.06)'; ctx.beginPath();
    aHist.forEach((a, i) => { const x = pad.l + (i / (aHist.length - 1)) * pw; const aScaled = pad.t + ph - ((a - minR) / rangeR) * ph; i === 0 ? ctx.moveTo(x, aScaled) : ctx.lineTo(x, aScaled); });
    for (let i = aHist.length - 1; i >= 0; i--) { const x = pad.l + (i / (aHist.length - 1)) * pw; ctx.lineTo(x, pad.t + ph - ((-aHist[i] - minR) / rangeR) * ph); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(218,165,32,0.4)'; ctx.lineWidth = 1; ctx.beginPath();
    aHist.forEach((a, i) => { const x = pad.l + (i / (aHist.length - 1)) * pw; const y = pad.t + ph - ((a - minR) / rangeR) * ph; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke();
  }
  ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 1.5; ctx.beginPath();
  hist.forEach((r, i) => { const x = pad.l + (i / (hist.length - 1)) * pw; const y = pad.t + ph - ((r - minR) / rangeR) * ph; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke();
  // Formula display — use system font with Unicode support, split for narrow screens
  ctx.textAlign = 'center';
  if (w > 400) {
    ctx.font = '10px "Segoe UI", "SF Pro", system-ui, sans-serif'; ctx.fillStyle = '#00ffcc';
    ctx.fillText('R(t) = \u03B1\u00B7exp(\u03B2t/\u03C6)\u00B7cos(\u03C9t + \u03B3(t)\u00B7R(t\u2212\u0394t))', w/2, 14);
  } else {
    ctx.font = '9px "Segoe UI", "SF Pro", system-ui, sans-serif'; ctx.fillStyle = '#00ffcc';
    ctx.fillText('R(t) = \u03B1\u00B7exp(\u03B2t/\u03C6)\u00B7cos(\u03C9t + \u03B3(t)\u00B7R(t\u2212\u0394t))', w/2, 12);
  }
  ctx.font = '9px monospace';
  ctx.textAlign = 'left'; ctx.fillStyle = '#00ffcc'; ctx.fillText('\u2014 R(t)', pad.l, w > 400 ? 14 : 24); ctx.fillStyle = '#daa520'; ctx.fillText('\u2014 A(t)', pad.l + 55, w > 400 ? 14 : 24);
  // Phase portrait
  const botY = topH + 8, botH = h - botY - 8, cx = pad.l + pw * 0.25, cy = botY + botH / 2, pRadius = Math.min(pw * 0.22, botH * 0.4);
  ctx.strokeStyle = '#1a1a10'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx - pRadius - 10, cy); ctx.lineTo(cx + pRadius + 10, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - pRadius - 10); ctx.lineTo(cx, cy + pRadius + 10); ctx.stroke();
  if (hist.length > 2) {
    const pScale = pRadius / (rangeR / 2 || 1);
    ctx.strokeStyle = 'rgba(0,255,204,0.3)'; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let i = 1; i < hist.length; i++) { const px = cx + hist[i] * pScale; const py = cy - hist[i-1] * pScale; i === 1 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke();
    ctx.fillStyle = '#00ffcc'; ctx.beginPath(); ctx.arc(cx + hist[hist.length-1] * pScale, cy - hist[hist.length-2] * pScale, 3, 0, Math.PI*2); ctx.fill();
  }
  // Live readouts
  const readX = w * 0.55, readY = botY + 10;
  const varFont = '9px "Segoe UI", "SF Pro", system-ui, sans-serif';
  const valFont = '9px monospace';
  const lineH = Math.min(16, botH / 9);
  [['\u0052(t)', hx.R.toFixed(4), '#00ffcc'], ['\u0041(t)', hx.A.toFixed(4), '#daa520'], ['\u03B3(t)', hx.gamma.toFixed(4), '#5acebe'], ['\u03B8(t)', (hx.theta % (2*Math.PI)).toFixed(3), '#7ae6d6'], ['z(t)', hx.z.toFixed(3), '#6adaca'], ['r\u00B2(t)', hx.r_sq.toFixed(3), '#ff8800'], ['HRV', hx.HRV.toFixed(3), '#5acebe']].forEach(([label, val, color], i) => {
    ctx.font = varFont; ctx.fillStyle = '#3aaa9a'; ctx.fillText(label, readX, readY + i * lineH); ctx.font = valFont; ctx.fillStyle = color; ctx.fillText(val, readX + 42, readY + i * lineH);
  });
  const stabY = readY + 7 * lineH + 6;
  ctx.font = '10px "Segoe UI", "SF Pro", system-ui, sans-serif';
  if (hx.stable) { ctx.fillStyle = '#00ffcc'; ctx.fillText('\u2726 STABLE (' + hx.stableFor + ' steps)', readX, stabY); }
  else { ctx.fillStyle = '#ff8800'; ctx.fillText('\u25CE SEEKING EQUILIBRIUM', readX, stabY); }
}

// ===== PIPELINE CONFIG =====
const DEPTH_PRIMES = { shallow: { concepts: 7, terms: 5, clusters: 3, glossary: 7, thesis: 3 }, medium: { concepts: 13, terms: 7, clusters: 5, glossary: 13, thesis: 3 }, deep: { concepts: 23, terms: 13, clusters: 7, glossary: 23, thesis: 5 } };
const STAGES = [
  { id: 'dual_extract', name: 'Dual-Register Extraction', icon: '⚗️', deps: [] },
  { id: 'triple_mode', name: 'Triple-Mode Elaboration', icon: '🔬', deps: ['dual_extract'] },
  { id: 'semantic_index', name: 'Semantic Taxonomy', icon: '🗂️', deps: ['dual_extract'] },
  { id: 'compress_expand', name: 'Compress / Expand', icon: '💎', deps: ['dual_extract'] },
  { id: 'meta_analysis', name: 'Meta-Analysis', icon: '📡', deps: [] },
];
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));
function resolveDeps(id, visited = new Set()) { if (visited.has(id)) return visited; visited.add(id); STAGE_MAP[id]?.deps?.forEach(d => resolveDeps(d, visited)); return visited; }
function resolveDependents(id) { const deps = new Set(); STAGES.forEach(s => { if (s.deps.includes(id)) { deps.add(s.id); resolveDependents(s.id).forEach(d => deps.add(d)); }}); return deps; }
function repairJSON(raw) {
  let s = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(s); } catch {} s = s.replace(/\t/g, '\\t').replace(/,\s*([\]}])/g, '$1');
  try { return JSON.parse(s); } catch {} const arrM = s.match(/\[[\s\S]*\]/), objM = s.match(/\{[\s\S]*\}/);
  const match = arrM && arrM[0].length > (objM ? objM[0].length : 0) ? arrM : objM;
  if (match) { try { return JSON.parse(match[0]); } catch {} let fixed = match[0].replace(/"([^"]*?)"/g, (m, c) => `"${c.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t')}"`).replace(/,\s*([\]}])/g, '$1'); try { return JSON.parse(fixed); } catch {} }
  try { const fn = new Function('return ' + s); const r = fn(); JSON.stringify(r); return r; } catch {} throw new Error('JSON parse failed');
}
async function callAPI(system, user, onStatus, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (onStatus) onStatus(attempt > 0 ? `retry ${attempt}...` : 'requesting...');
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system, messages: [{ role: 'user', content: user }] }) });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json(); const text = data.content?.map(b => b.text || '').join('') || '';
      const parsed = repairJSON(text); if (onStatus) onStatus('complete'); return parsed;
    } catch (e) { if (attempt === maxRetries) throw e; if (onStatus) onStatus(`error — retrying...`); await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); }
  }
}
const PROMPTS = {
  dual_extract: (text, depth) => ({ system: 'You are a precision extraction engine. Output ONLY valid JSON, no markdown fences.', user: `Extract EXACTLY ${DEPTH_PRIMES[depth].concepts} concepts (prime constraint). For each: technical sentence, plain sentence, confidence (0-1), keywords array.\nReturn: [{"id":1,"technical":"...","plain":"...","confidence":0.95,"keywords":["a","b"]}]\n\nTEXT:\n${text}` }),
  triple_mode: (text, concepts) => ({ system: 'Multi-modal elaboration engine. Output ONLY valid JSON.', user: `Elaborate each concept in 3 modes: code (Python, single-line with semicolons, single quotes), analogy, insight.\nCONCEPTS: ${JSON.stringify(concepts)}\nReturn: [{"concept_id":1,"code":"...","analogy":"...","insight":"..."}]\nTEXT: ${text}` }),
  semantic_index: (text, concepts, depth) => ({ system: 'Semantic indexing engine. Output ONLY valid JSON.', user: `Create taxonomy: ${DEPTH_PRIMES[depth].terms} terms, ${DEPTH_PRIMES[depth].clusters} clusters.\nCONCEPTS: ${JSON.stringify(concepts)}\nReturn: {"terms":[{"term":"...","concept_ids":[1],"definition":"..."}],"clusters":[{"label":"...","concept_ids":[1],"theme":"..."}],"density_score":0.8}\nTEXT: ${text}` }),
  compress_expand: (text, concepts, taxonomy, depth) => ({ system: 'Compression/expansion engine. Output ONLY valid JSON.', user: `COMPRESS to ${DEPTH_PRIMES[depth].thesis}-sentence thesis. EXPAND to ${DEPTH_PRIMES[depth].glossary}-entry glossary.\nCONCEPTS: ${JSON.stringify(concepts)}\nTAXONOMY: ${JSON.stringify(taxonomy)}\nReturn: {"core_thesis":"...","glossary":[{"term":"...","definition":"...","concept_ids":[1]}]}\nTEXT: ${text}` }),
  meta_analysis: (text, allResults, depth, engineStats) => ({ system: 'Meta-analytical engine evaluating combined extraction + consciousness simulation. Output ONLY valid JSON.', user: `Analyze pipeline AND glyph engine.\nPIPELINE (depth=${depth}):\n${JSON.stringify(allResults)}\nENGINE: ${JSON.stringify(engineStats)}\nReturn: {"complexity_profile":{"conceptual_density":0.8,"technical_depth":0.7,"abstraction_level":0.6,"interconnectedness":0.9},"emergence_assessment":"...","blind_spots":["..."]}\nTEXT: ${text}` }),
  crucible_analysis: (summary, collisions) => ({ system: 'Analyze a beacon-coordinated consciousness simulation. Output ONLY valid JSON.', user: `Glyphs:\n${JSON.stringify(summary)}\nCollisions:\n${JSON.stringify(collisions)}\nReturn: {"patterns":[{"name":"...","description":"..."}],"resonance_analysis":{"summary":"..."},"emergence":{"level":"...","indicators":[]}}` }),
};

// ===== MAIN COMPONENT =====
const TheCrucible = () => {
  const engineRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const animRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ generation:0, total:0, concepts:0, organic:0, attractors:0, reflexGlyphs:0, entrained:0, avgStability:0, collisions:0, syntheses:0, avgResonance:0, resonantPairs:0, openPipes:0, vocabulary:11, pools:0, shortcuts:0, season:SeasonalPhase.EXPLORATION, seasonCounter:0, seasonDuration:200, helix:{ R:0, A:1, z:0, gamma:0.5, stable:false, stableFor:0, HRV:0 }, obs:{ psi:0, vp_mean:0, J_H:0, f_xi:0, F_free:0, H_mean:0, sigma_H:0, N_xi:0, phaseTransitions:0, criticalEvents:0 } });
  const [view, setView] = useState('field');
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState('');
  const [depth, setDepth] = useState('medium');
  const [selectedStages, setSelectedStages] = useState(new Set(STAGES.map(s => s.id)));
  const [stageStatus, setStageStatus] = useState({});
  const [results, setResults] = useState({});
  const [statusTexts, setStatusTexts] = useState({});
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineError, setPipelineError] = useState(null);
  const [pipelineLog, setPipelineLog] = useState([]);
  const [expandedStage, setExpandedStage] = useState(null);
  const [showPipeline, setShowPipeline] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const addPipelineLog = useCallback((msg) => { setPipelineLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]); }, []);

  useEffect(() => {
    const engine = new CrucibleEngine();
    engineRef.current = engine;
    (async () => {
      engine.reset();
      setStats(engine.getStats()); setLogs([...engine.eventLog]); setInitialized(true);
    })();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (running) { intervalRef.current = setInterval(() => { const e = engineRef.current; e.step(); setStats(e.getStats()); setLogs([...e.eventLog]); }, 180); }
    else { if (intervalRef.current) clearInterval(intervalRef.current); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, initialized]);

  const doRender = useCallback(() => {
    const canvas = canvasRef.current, container = containerRef.current, engine = engineRef.current;
    if (!canvas || !container || !engine) return;
    if (view === 'field') renderField(canvas, engine, container);
    else if (view === 'helix') renderHelix(canvas, engine, container);
    else if (view === 'attractors') { /* HTML panel, no canvas */ const ctx = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1; const w = container.clientWidth, h = container.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr); ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#2a8a8a'; ctx.font = '11px "Segoe UI", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Attractor tracking below', w/2, h/2); }
    else if (view === 'reflexes') { const ctx = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1; const w = container.clientWidth, h = container.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr); ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#2a8a8a'; ctx.font = '11px "Segoe UI", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Reflex tracking below', w/2, h/2); }
    else if (view === 'vocab') { const ctx = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1; const w = container.clientWidth, hh = container.clientHeight; canvas.width = w * dpr; canvas.height = hh * dpr; canvas.style.width = w + 'px'; canvas.style.height = hh + 'px'; ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr); ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, w, hh); ctx.fillStyle = '#2a8a8a'; ctx.font = '11px "Segoe UI", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Vocabulary list below', w/2, hh/2); }
    else renderChart(canvas, engine, container, view);
    animRef.current = requestAnimationFrame(doRender);
  }, [view]);

  useEffect(() => { if (!initialized) return; animRef.current = requestAnimationFrame(doRender); return () => { if (animRef.current) cancelAnimationFrame(animRef.current); }; }, [initialized, doRender]);



  const doReset = () => { if (intervalRef.current) clearInterval(intervalRef.current); setRunning(false); engineRef.current.reset(); setStats(engineRef.current.getStats()); setLogs([...engineRef.current.eventLog]); setResults({}); setAnalysisResult(null); };

  const doAnalyze = async () => {
    setAnalysisLoading(true);
    const engine = engineRef.current;
    const summary = Array.from(engine.glyphs.values()).slice(-20).map(g => ({ id: g.id, tags: g.tags, entropy: g.entropy, isConcept: g.isConcept, isAttractor: g.isAttractor, isReflex: g.isReflex, season: g.seasonBorn, thermo: g.thermodynamicState ? { H: g.thermodynamicState.H, dH_dt: +g.thermodynamicState.dH_dt.toFixed(3) } : null }));
    const recent = engine.collisionLog.slice(-10).map(c => ({ parents: `${c.parentA}×${c.parentB}`, child: c.offspring, resonance: +c.resonance.toFixed(3), crossType: c.crossType }));
    try { const r = await callAPI(PROMPTS.crucible_analysis(summary, recent).system, PROMPTS.crucible_analysis(summary, recent).user, null); setAnalysisResult(r); engine.log('🧠 Crucible analysis complete', 'analysis'); } catch { setAnalysisResult(null); }
    setAnalysisLoading(false); setLogs([...engine.eventLog]);
  };

  const toggleStage = (id) => { setSelectedStages(prev => { const next = new Set(prev); if (next.has(id)) { next.delete(id); resolveDependents(id).forEach(d => next.delete(d)); } else { resolveDeps(id).forEach(d => next.add(d)); } return next; }); };

  const runPipeline = async () => {
    if (!input.trim()) return;
    setPipelineRunning(true); setPipelineError(null); setResults({}); setStatusTexts({}); setPipelineLog([]);
    const newStatus = {}; STAGES.forEach(s => { newStatus[s.id] = selectedStages.has(s.id) ? 'idle' : 'skipped'; }); setStageStatus(newStatus);
    addPipelineLog(`Pipeline initiated · depth=${depth} · season=${engineRef.current.season}`);
    let concepts = null, taxonomy = null; const allResults = {};
    const makeStatus = (id) => (t) => setStatusTexts(p => ({ ...p, [id]: t }));
    try {
      if (selectedStages.has('dual_extract')) {
        setStageStatus(p => ({ ...p, dual_extract: 'running' })); addPipelineLog(`Extracting ${DEPTH_PRIMES[depth].concepts} concepts...`);
        concepts = await callAPI(...Object.values(PROMPTS.dual_extract(input, depth)), makeStatus('dual_extract'));
        allResults.concepts = concepts; setResults(p => ({ ...p, dual_extract: concepts })); setStageStatus(p => ({ ...p, dual_extract: 'complete' }));
        addPipelineLog(`✓ ${concepts.length} concepts extracted`);
        const engine = engineRef.current; engine.triggerShockwave(engine.canvasW / 2, engine.canvasH / 2, '#daa520');
        for (const c of concepts) engine.injectConcept(c);
        engine.updateThermodynamics(); engine.updateResonanceField(); setStats(engine.getStats()); setLogs([...engine.eventLog]);
        addPipelineLog(`⚗️ ${concepts.length} concepts injected`);
      }
      if (selectedStages.has('triple_mode') && concepts) { setStageStatus(p => ({ ...p, triple_mode: 'running' })); const elab = await callAPI(...Object.values(PROMPTS.triple_mode(input, concepts)), makeStatus('triple_mode')); allResults.elaborations = elab; setResults(p => ({ ...p, triple_mode: elab })); setStageStatus(p => ({ ...p, triple_mode: 'complete' })); }
      if (selectedStages.has('semantic_index') && concepts) { setStageStatus(p => ({ ...p, semantic_index: 'running' })); taxonomy = await callAPI(...Object.values(PROMPTS.semantic_index(input, concepts, depth)), makeStatus('semantic_index')); allResults.taxonomy = taxonomy; setResults(p => ({ ...p, semantic_index: taxonomy })); setStageStatus(p => ({ ...p, semantic_index: 'complete' })); }
      if (selectedStages.has('compress_expand') && concepts) { setStageStatus(p => ({ ...p, compress_expand: 'running' })); const comp = await callAPI(...Object.values(PROMPTS.compress_expand(input, concepts, taxonomy, depth)), makeStatus('compress_expand')); allResults.compression = comp; setResults(p => ({ ...p, compress_expand: comp })); setStageStatus(p => ({ ...p, compress_expand: 'complete' })); }
      if (selectedStages.has('meta_analysis')) { setStageStatus(p => ({ ...p, meta_analysis: 'running' })); const meta = await callAPI(...Object.values(PROMPTS.meta_analysis(input, allResults, depth, engineRef.current.getStats())), makeStatus('meta_analysis')); setResults(p => ({ ...p, meta_analysis: meta })); setStageStatus(p => ({ ...p, meta_analysis: 'complete' })); }
      addPipelineLog('Pipeline complete ✓');
    } catch (err) { setPipelineError(err.message); addPipelineLog(`ERROR: ${err.message}`); }
    setPipelineRunning(false);
  };

  if (!initialized) return (<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a0908', fontFamily:'monospace', color:'#daa520' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:32, marginBottom:12 }}>⚗️</div><div style={{ fontSize:11, letterSpacing:'0.2em' }}>INITIALIZING CRUCIBLE v3</div></div></div>);

  const seasonColor = SEASON_MODIFIERS[stats.season]?.color || '#daa520';
  const S = (label, val, color = '#daa520') => (<div style={{ textAlign:'center', padding:'2px 0' }}><div style={{ fontSize:7, color:'#3aaa9a', letterSpacing:'0.1em', textTransform:'uppercase' }}>{label}</div><div style={{ fontSize:12, fontWeight:'bold', color, fontFamily:'monospace' }}>{val}</div></div>);

  return (
    <div style={{ fontFamily:"'Courier New', monospace", background:'#0a0908', color:'#c8b898', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* ─── HEADER ─── */}
      <div style={{ padding:'8px 12px 6px', borderBottom:`1px solid ${seasonColor}30` }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:4, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:'bold', color:'#daa520', textShadow:'0 0 12px rgba(218,165,32,0.3)' }}>⚗️ THE CRUCIBLE v3</span>
          <span style={{ fontSize:8, color:'#3aaa9a', letterSpacing:'0.12em' }}>FULL FUSION</span>
          <span style={{ fontSize:8, padding:'1px 6px', borderRadius:3, background:`${seasonColor}18`, color: seasonColor, border:`1px solid ${seasonColor}40`, fontWeight:'bold' }}>{stats.season.toUpperCase()} {Math.round(stats.seasonCounter / stats.seasonDuration * 100)}%</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:2 }}>
          {S('GEN', stats.generation)}
          {S('ORGANIC', stats.organic, '#00ff00')}
          {S('CONCEPT', stats.concepts, '#daa520')}
          {S('ATTRACTOR', stats.attractors, '#ff6b6b')}
          {S('REFLEX', stats.reflexGlyphs, '#00ffcc')}
          {S('ENTRAINED', stats.entrained, '#ff4466')}
          {S('STABILITY', stats.avgStability, '#b4c864')}
          {S('COLLISIONS', stats.collisions, '#ff8800')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:2, marginTop:2 }}>
          {S('RES PAIRS', stats.resonantPairs, '#00aaff')}
          {S('PIPES', stats.openPipes, '#ff8800')}
          {S('POOLS', stats.pools, '#b464ff')}
          {S('SHORTCUTS', stats.shortcuts, '#b464ff')}
          {S('VOCAB', stats.vocabulary, '#5acebe')}
          {S('HELIX', stats.helix.stable ? `✦ ${stats.helix.stableFor}` : '◎', stats.helix.stable ? '#00ffcc' : '#ff8800')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:2, marginTop:2, borderTop:'1px solid #1a1810', paddingTop:2 }}>
          {S('ψ ORDER', stats.obs.psi, stats.obs.psi > 0.93 ? '#ff6b6b' : stats.obs.psi > 0.76 ? '#daa520' : '#3aaa9a')}
          {S('⟨H⟩', stats.obs.H_mean, stats.obs.H_mean > 5200 ? '#ff6b6b' : '#00aaff')}
          {S('vₚ', stats.obs.vp_mean, stats.obs.vp_mean > 42 ? '#ff6b6b' : '#5acebe')}
          {S('F FREE', stats.obs.F_free, '#b464ff')}
          {S('J_H', stats.obs.J_H, '#ff8800')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:2, marginTop:1 }}>
          {S('σ_H', stats.obs.sigma_H, '#7ae6d6')}
          {S('Ξ', stats.obs.f_xi > 0 ? `${stats.obs.N_xi} (${stats.obs.f_xi})` : '✓', stats.obs.f_xi > 0.01 ? '#ff4466' : '#3aaa9a')}
          {S('ρ>ρc*', stats.obs.phaseTransitions, '#daa520')}
          {S('ρ>ρc**', stats.obs.criticalEvents, stats.obs.criticalEvents > 0 ? '#ff6b6b' : '#3aaa9a')}
        </div>
      </div>

      {/* ─── CONTROLS ─── */}
      <div style={{ display:'flex', gap:3, padding:'6px 10px', flexWrap:'nowrap', borderBottom:'1px solid #111' }}>
        <Btn onClick={() => setRunning(!running)} style={{ color: running ? '#ff4444' : '#00ff00' }}>{running ? '⏸' : '▶'}</Btn>

        <Btn onClick={doReset}>↺</Btn>
        <Btn onClick={doAnalyze} disabled={analysisLoading}>{analysisLoading ? '⟳' : '🧠'}</Btn>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', gap:2, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        {['field','entropy','resonance','vocab','helix','attractors','reflexes'].map(v => {
          const labels = { field:'FLD', entropy:'ENT', resonance:'RES', vocab:'VOC', helix:'HLX', attractors:'ATR', reflexes:'RFX' };
          return <Btn key={v} onClick={() => setView(v)} style={{ color: view === v ? '#daa520' : '#555', borderColor: view === v ? '#daa520' : '#1a1810', whiteSpace:'nowrap', padding:'6px 4px' }}>{labels[v]}</Btn>;
        })}
        </div>
        <Btn onClick={() => setShowPipeline(!showPipeline)} style={{ color: showPipeline ? '#daa520' : '#555' }}>⚗️</Btn>
      </div>

      {/* ─── CANVAS ─── */}
      <div ref={containerRef} style={{ height: view === 'helix' ? 360 : (view === 'attractors' || view === 'reflexes' || view === 'vocab') ? 80 : 280, position:'relative', transition:'height 0.2s' }}>
        <canvas ref={canvasRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} />
      </div>

      {/* ─── ATTRACTOR TRACKING PANEL ─── */}
      {view === 'attractors' && (() => {
        const engine = engineRef.current;
        if (!engine) return null;
        const attractorGlyphs = Array.from(engine.glyphs.values()).filter(g => g.isAttractor).sort((a, b) => b.influenceScore - a.influenceScore);
        const attrMeta = engine.conceptualAttractors;
        return (
          <div style={{ margin:'0 10px', padding:10, background:'#0f0e0b', border:'1px solid rgba(255,107,107,0.15)', borderRadius:4, maxHeight:'55vh', overflow:'auto', WebkitOverflowScrolling:'touch' }}>
            <div style={{ fontSize:9, color:'#ff6b6b', letterSpacing:'0.12em', fontWeight:'bold', marginBottom:8 }}>
              ATTRACTOR TRACKING — {attractorGlyphs.length} active
            </div>
            {attractorGlyphs.length === 0 && (
              <div style={{ fontSize:10, color:'#2a8a8a', padding:'12px 0', textAlign:'center' }}>
                No attractors yet. They emerge when glyphs exceed the influence threshold ({engine.ATTRACTOR_THRESHOLD}+ offspring lineages).
              </div>
            )}
            {attractorGlyphs.map((g, i) => {
              const meta = attrMeta.get(g.id);
              const children = Array.from(engine.glyphs.values()).filter(c => c.ancestry.includes(g.id));
              const tagDisplay = g.tags.filter(t => !t.startsWith('gen:') && !t.startsWith('μ')).slice(0, 6);
              return (
                <div key={g.id} style={{ marginBottom:6, padding:'6px 8px', background: i === 0 ? 'rgba(255,107,107,0.06)' : 'rgba(255,255,255,0.02)', border:'1px solid rgba(255,107,107,0.1)', borderRadius:4 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                    <span style={{ fontSize:10, color:'#ff6b6b', fontWeight:'bold', fontFamily:'monospace' }}>
                      #{g.id} {i === 0 ? '★' : '◉'}
                    </span>
                    <span style={{ fontSize:8, color:'#3aaa9a', fontFamily:'monospace' }}>
                      gen {g.generation} | {g.seasonBorn || '—'}
                    </span>
                  </div>
                  <div style={{ fontSize:9, color:'#7ae6d6', marginBottom:3, lineHeight:1.4 }}>
                    {tagDisplay.map((t, ti) => (
                      <span key={ti} style={{ display:'inline-block', padding:'1px 4px', margin:'1px 2px', background:'rgba(122,230,214,0.08)', borderRadius:2, border:'1px solid rgba(122,230,214,0.12)' }}>{t}</span>
                    ))}
                    {g.tags.length > 6 && <span style={{ color:'#555', fontSize:8 }}> +{g.tags.length - 6}</span>}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', fontSize:8, fontFamily:'monospace' }}>
                    <span style={{ color:'#daa520' }}>influence: {g.influenceScore.toFixed(2)}</span>
                    <span style={{ color:'#00ffcc' }}>ε: {g.entropy.toFixed(0)}</span>
                    <span style={{ color:'#ff8800' }}>children: {children.length}</span>
                    <span style={{ color:'#b4c864' }}>stability: {g.stability.toFixed(2)}</span>
                    <span style={{ color:'#b464ff' }}>priority: {g.priority.toFixed(2)}</span>
                    <span style={{ color:'#ff4466' }}>mutRate: {g.mutationRate.toFixed(2)}</span>
                  </div>
                  {meta && (
                    <div style={{ fontSize:8, color:'#555', marginTop:3, fontFamily:'monospace' }}>
                      discovered gen {meta.discovered} | episodes: {meta.episodes.length} ({meta.episodes.slice(-3).join(', ')}{meta.episodes.length > 3 ? '...' : ''}){meta.proxyFor ? ` | proxy for culled #${meta.proxyFor}` : ''}
                    </div>
                  )}
                  {g.thermodynamicState && (
                    <div style={{ fontSize:8, color:'#444', marginTop:2, fontFamily:'monospace' }}>
                      H={g.thermodynamicState.H.toFixed(0)} dH/dt={g.thermodynamicState.dH_dt.toFixed(2)} τ={g.thermodynamicState.tau_coherence.toFixed(2)} φ={g.thermodynamicState.phi_phase.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ─── REFLEX TRACKING PANEL ─── */}
      {view === 'reflexes' && (() => {
        const engine = engineRef.current;
        if (!engine) return null;
        const reflexGlyphs = Array.from(engine.glyphs.values()).filter(g => g.isReflex).sort((a, b) => b.generation - a.generation);
        // Type counts
        const typeCounts = {};
        for (const g of reflexGlyphs) {
          const t = g.reflexType || 'unknown';
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        }
        const typeColors = { defensive: '#ff4466', exploratory: '#16C0FF', collaborative: '#b4c864', consolidative: '#daa520', metamorphic: '#b464ff' };
        return (
          <div style={{ margin:'0 10px', padding:10, background:'#0f0e0b', border:'1px solid rgba(0,255,204,0.15)', borderRadius:4, maxHeight:'55vh', overflow:'auto', WebkitOverflowScrolling:'touch' }}>
            <div style={{ fontSize:9, color:'#00ffcc', letterSpacing:'0.12em', fontWeight:'bold', marginBottom:4 }}>
              REFLEX TRACKING — {reflexGlyphs.length} active
            </div>
            <div style={{ fontSize:9, color:'#5a9a9a', lineHeight:1.5, marginBottom:8, padding:'4px 6px', background:'rgba(0,255,204,0.03)', borderRadius:3, borderLeft:'2px solid rgba(0,255,204,0.2)' }}>
              Reflexes are autonomous response glyphs spawned when the engine detects stagnation or entropy collapse. Five types: <span style={{ color:'#ff4466' }}>defensive</span> (preserve low-entropy), <span style={{ color:'#16C0FF' }}>exploratory</span> (inject novelty), <span style={{ color:'#b4c864' }}>collaborative</span> (bridge distant tags), <span style={{ color:'#daa520' }}>consolidative</span> (anchor attractors), <span style={{ color:'#b464ff' }}>metamorphic</span> (recombine into new forms). Triggered every {engine.REFLEX_INTERVAL} gens, capped at 3 per cycle.
            </div>
            {/* Type distribution bar */}
            {reflexGlyphs.length > 0 && (
              <div style={{ marginBottom:8 }}>
                <div style={{ display:'flex', height:6, borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                  {Object.entries(typeCounts).map(([type, count]) => (
                    <div key={type} style={{ width: `${(count / reflexGlyphs.length) * 100}%`, background: typeColors[type] || '#555', minWidth:2 }} />
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {Object.entries(typeCounts).map(([type, count]) => (
                    <span key={type} style={{ fontSize:8, fontFamily:'monospace' }}>
                      <span style={{ color: typeColors[type] || '#555' }}>●</span>
                      <span style={{ color:'#7ae6d6' }}> {type}: {count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {reflexGlyphs.length === 0 && (
              <div style={{ fontSize:10, color:'#2a8a8a', padding:'12px 0', textAlign:'center' }}>
                No reflexes spawned yet — waiting for stagnation or entropy collapse.
              </div>
            )}
            {reflexGlyphs.map((g, i) => {
              const parentGlyph = g.ancestry.length > 0 ? engine.glyphs.get(g.ancestry[0]) : null;
              const children = Array.from(engine.glyphs.values()).filter(c => c.ancestry.includes(g.id));
              const tagDisplay = g.tags.filter(t => !t.startsWith('gen:') && !t.startsWith('μ') && t !== 'reflex').slice(0, 6);
              const tc = typeColors[g.reflexType] || '#555';
              return (
                <div key={g.id} style={{ marginBottom:5, padding:'5px 8px', background:'rgba(255,255,255,0.015)', border:`1px solid ${tc}22`, borderRadius:4 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                    <span style={{ fontSize:10, fontWeight:'bold', fontFamily:'monospace' }}>
                      <span style={{ color: tc }}>⚡</span>
                      <span style={{ color:'#00ffcc' }}> #{g.id}</span>
                      <span style={{ color: tc, fontSize:8, marginLeft:4, padding:'1px 4px', border:`1px solid ${tc}44`, borderRadius:2 }}>{g.reflexType}</span>
                    </span>
                    <span style={{ fontSize:8, color:'#3aaa9a', fontFamily:'monospace' }}>
                      gen {g.generation} | {g.seasonBorn || '—'}
                    </span>
                  </div>
                  <div style={{ fontSize:9, color:'#7ae6d6', marginBottom:2, lineHeight:1.4 }}>
                    {tagDisplay.map((t, ti) => (
                      <span key={ti} style={{ display:'inline-block', padding:'1px 4px', margin:'1px 2px', background:'rgba(0,255,204,0.06)', borderRadius:2, border:'1px solid rgba(0,255,204,0.1)' }}>{t}</span>
                    ))}
                    {g.tags.length > 7 && <span style={{ color:'#555', fontSize:8 }}> +{g.tags.length - 7}</span>}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', fontSize:8, fontFamily:'monospace' }}>
                    <span style={{ color:'#00ffcc' }}>ε: {g.entropy.toFixed(0)}</span>
                    <span style={{ color:'#b4c864' }}>stability: {g.stability.toFixed(2)}</span>
                    <span style={{ color:'#ff8800' }}>children: {children.length}</span>
                    <span style={{ color:'#daa520' }}>influence: {g.influenceScore.toFixed(2)}</span>
                    {parentGlyph && <span style={{ color:'#555' }}>parent: #{g.ancestry[0]}{parentGlyph.isAttractor ? ' ★' : ''}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {view === 'vocab' && (() => {
        const engine = engineRef.current;
        if (!engine) return null;
        const base = engine.tags.filter(t => !engine.evolvedTags.includes(t));
        const evolved = engine.evolvedTags;
        // Count how many living glyphs carry each evolved tag
        const freq = new Map();
        for (const g of engine.glyphs.values()) {
          for (const t of g.tags) {
            if (evolved.includes(t)) freq.set(t, (freq.get(t) || 0) + 1);
          }
        }
        return (
          <div style={{ margin:'0 10px', padding:10, background:'#0f0e0b', border:'1px solid rgba(90,206,190,0.15)', borderRadius:4, maxHeight:'55vh', overflow:'auto', WebkitOverflowScrolling:'touch' }}>
            <div style={{ fontSize:9, color:'#5acebe', letterSpacing:'0.12em', fontWeight:'bold', marginBottom:6 }}>
              VOCABULARY — {engine.tags.length} total · {base.length} base · {evolved.length} evolved
            </div>
            {evolved.length === 0 && (
              <div style={{ fontSize:10, color:'#2a8a8a', padding:'12px 0', textAlign:'center' }}>
                No evolved tags yet. They emerge from collisions.
              </div>
            )}
            <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
              {evolved.map((t, i) => {
                const count = freq.get(t) || 0;
                const alive = count > 0;
                return (
                  <span key={i} style={{
                    display:'inline-block', padding:'2px 5px', fontSize:8, fontFamily:'monospace',
                    background: alive ? 'rgba(90,206,190,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${alive ? 'rgba(90,206,190,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius:2, color: alive ? '#7ae6d6' : '#444',
                  }}>
                    {t}{alive && <span style={{ color:'#ff8844', marginLeft:3 }}>×{count}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ─── ANALYSIS PANEL ─── */}
      {analysisResult && (
        <div style={{ margin:'0 10px', padding:10, background:'#0f0e0b', border:'1px solid rgba(0,170,255,0.15)', borderRadius:4, maxHeight:200, overflow:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontSize:9, color:'#00aaff', letterSpacing:'0.12em', fontWeight:'bold' }}>CRUCIBLE ANALYSIS</span>
            <button onClick={() => setAnalysisResult(null)} style={{ background:'none', border:'none', color:'#2a8a8a', cursor:'pointer', fontSize:12 }}>✕</button>
          </div>
          {analysisResult.patterns?.map((p, i) => (
            <div key={i} style={{ marginBottom:4, fontSize:10, lineHeight:1.4 }}>
              <span style={{ color:'#daa520', fontWeight:'bold' }}>{p.name}</span>
              <span style={{ color:'#7ae6d6' }}> — {p.description}</span>
            </div>
          ))}
          {analysisResult.resonance_analysis && (
            <div style={{ marginTop:6, fontSize:10, color:'#00aaff' }}>
              Resonance: {analysisResult.resonance_analysis.summary}
            </div>
          )}
          {analysisResult.emergence && (
            <div style={{ marginTop:6, fontSize:10, color:'#00ff00' }}>
              Emergence: <strong>{analysisResult.emergence.level}</strong>
              {analysisResult.emergence.indicators?.map((ind, i) => (
                <div key={i} style={{ color:'#7ae6d6', marginLeft:8 }}>→ {typeof ind === 'string' ? ind : JSON.stringify(ind)}</div>
              ))}
            </div>
          )}
          {analysisResult.concept_organic_bridges && (
            <div style={{ marginTop:6, fontSize:10, color:'#b4c864' }}>
              Bridges: {analysisResult.concept_organic_bridges}
            </div>
          )}
        </div>
      )}

      {/* ─── DEEP ANALYSIS PANEL (v4.2) ─── */}
      {stats.lastAnalysis && (
        <div style={{ margin:'4px 10px 0', padding:10, background:'#0f0e0b', border:'1px solid rgba(255,68,204,0.15)', borderRadius:4, maxHeight:240, overflow:'auto' }}>
          <div style={{ fontSize:9, color:'#ff44cc', letterSpacing:'0.12em', fontWeight:'bold', marginBottom:6 }}>DEEP ANALYSIS — GEN {stats.lastAnalysis.generation} ({stats.lastAnalysis.season})</div>
          <div style={{ fontSize:10, color:'#c8b898', marginBottom:4 }}>
            Glyphs: {stats.lastAnalysis.total} (C:{stats.lastAnalysis.concepts} O:{stats.lastAnalysis.organic}) | Attractors: {stats.lastAnalysis.attractors} | Reflexes: {stats.lastAnalysis.reflexGlyphs} | ε̄: {stats.lastAnalysis.avgEntropy} ±{stats.lastAnalysis.stdEntropy}
          </div>
          <div style={{ fontSize:10, color:'#c8b898', marginBottom:4 }}>
            Collision rate: {stats.lastAnalysis.collisionRate}/gen | Evolved vocab: {stats.lastAnalysis.evolvedVocab} | Pools: {stats.lastAnalysis.pools} | Helix: {stats.lastAnalysis.helixStable ? '✓ stable' : '○ unstable'}
          </div>
          {stats.lastAnalysis.observables && (
            <div style={{ fontSize:9, color:'#b464ff', marginBottom:4, padding:'4px 6px', background:'rgba(180,100,255,0.04)', borderRadius:3, borderLeft:'2px solid rgba(180,100,255,0.2)', fontFamily:'monospace' }}>
              ψ={stats.lastAnalysis.observables.psi} | ⟨H⟩={stats.lastAnalysis.observables.H_mean} | vₚ={stats.lastAnalysis.observables.vp_mean} | σ_H={stats.lastAnalysis.observables.sigma_H} | F={stats.lastAnalysis.observables.F_free} | J_H={stats.lastAnalysis.observables.J_H} | f_Ξ={stats.lastAnalysis.observables.f_xi} | ρ{'>'}ρc*:{stats.lastAnalysis.observables.phaseTransitions} | ρ{'>'}ρc**:{stats.lastAnalysis.observables.criticalEvents}
            </div>
          )}
          {stats.lastAnalysis.topTags && (
            <div style={{ fontSize:10, color:'#7ae6d6', marginBottom:4 }}>
              Top tags: {stats.lastAnalysis.topTags.map(([tag, count]) => `${tag}(${count})`).join(', ')}
            </div>
          )}
          {stats.lastAnalysis.seasonDist && (
            <div style={{ fontSize:10, color:'#b4c864', marginBottom:4 }}>
              Season dist: {Object.entries(stats.lastAnalysis.seasonDist).map(([s, c]) => `${s}:${c}`).join(' | ')}
            </div>
          )}
          {stats.lastAnalysis.semanticMergers && stats.lastAnalysis.semanticMergers.length > 0 && (
            <div style={{ marginTop:4, paddingTop:4, borderTop:'1px solid rgba(255,68,204,0.1)' }}>
              <div style={{ fontSize:8, color:'#ff44cc', letterSpacing:'0.1em', marginBottom:3 }}>🌊 SEMANTIC DRIFT</div>
              {stats.lastAnalysis.semanticMergers.map((m, i) => (
                <div key={i} style={{ fontSize:10, color:'#7ae6d6', marginBottom:1 }}>
                  <span style={{ color:'#daa520' }}>{m.t1}</span>
                  <span style={{ color:'#555' }}> ↔ </span>
                  <span style={{ color:'#daa520' }}>{m.t2}</span>
                  <span style={{ color:'#ff44cc', fontFamily:'monospace', marginLeft:6 }}>{m.sim.toFixed(3)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── PIPELINE ─── */}
      {showPipeline && (
        <div style={{ padding:'8px 10px', borderTop:'1px solid #1a1810' }}>
          <div style={{ fontSize:8, color:'#2a8a8a', letterSpacing:'0.12em', marginBottom:4 }}>PHILOSOPHER'S STONE PIPELINE</div>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} placeholder="Paste text for extraction..." style={{ width:'100%', background:'#0f0e0b', border:'1px solid #1a1810', borderRadius:4, color:'#c8b898', padding:8, fontSize:10, fontFamily:'monospace', resize:'vertical', boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:4, marginTop:4, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              <span style={{ fontSize:7, color:'#2a8a8a', letterSpacing:'0.1em' }}>DEPTH</span>
              {['shallow','medium','deep'].map(d => (<Btn key={d} onClick={() => setDepth(d)} style={{ color: depth === d ? '#daa520' : '#555' }}>{d.toUpperCase()}</Btn>))}
            </div>
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              <span style={{ fontSize:7, color:'#2a8a8a', letterSpacing:'0.1em' }}>STAGES</span>
              {STAGES.map(s => (
                <button key={s.id} onClick={() => !pipelineRunning && toggleStage(s.id)} style={{
                  padding:'4px 7px', fontSize:12, background: selectedStages.has(s.id) ? 'rgba(218,165,32,0.1)' : 'rgba(255,255,255,0.01)',
                  border:`1px solid ${selectedStages.has(s.id) ? 'rgba(218,165,32,0.2)' : '#1a1810'}`,
                  borderRadius:3, cursor: pipelineRunning ? 'default' : 'pointer', opacity: selectedStages.has(s.id) ? 1 : 0.4,
                }}>{s.icon}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop:4 }}>
            <Btn onClick={runPipeline} disabled={pipelineRunning || !input.trim()} style={{ color:'#00ff00', width:'100%' }}>{pipelineRunning ? '⟳ TRANSMUTING...' : '⚗️ EXTRACT + INJECT'}</Btn>
          </div>
          {pipelineError && <div style={{ fontSize:9, color:'#ff4444', marginTop:4 }}>{pipelineError}</div>}
          {/* Stage results */}
          {STAGES.map(stage => {
            const status = stageStatus[stage.id] || 'idle';
            const result = results[stage.id];
            const isOpen = expandedStage === stage.id;
            const statusColors = { idle:'#333', running:'#daa520', complete:'#00ff00', error:'#ff4444', skipped:'#222' };
            return (
              <div key={stage.id} style={{ marginTop:3 }}>
                <div onClick={() => status === 'complete' && setExpandedStage(isOpen ? null : stage.id)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', background: isOpen ? 'rgba(218,165,32,0.06)' : '#0f0e0b', border:'1px solid #1a1810', borderRadius: isOpen ? '4px 4px 0 0' : 4, cursor: status === 'complete' ? 'pointer' : 'default' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:12 }}>{stage.icon}</span>
                    <span style={{ fontSize:10, color: status === 'complete' || status === 'running' ? '#c8b898' : '#444', fontWeight:'bold' }}>{stage.name}</span>
                  </div>
                  <span style={{ fontSize:8, color: statusColors[status], fontFamily:'monospace', fontWeight:'bold' }}>{status === 'running' ? (statusTexts[stage.id] || '⟳') : status.toUpperCase()}</span>
                </div>
                {isOpen && result && (
                  <div style={{ padding:'8px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(218,165,32,0.15)', borderTop:'none', borderRadius:'0 0 4px 4px', maxHeight:'60vh', overflow:'auto', fontSize:9, color:'#c8b898', WebkitOverflowScrolling:'touch' }}>
                    <pre style={{ margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word', fontFamily:'monospace' }}>{JSON.stringify(result, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ENGINE LOG ─── */}
      <div style={{ padding:'0 10px 12px' }}>
        <div style={{ fontSize:8, color:'#2a8a8a', letterSpacing:'0.12em', marginBottom:4, marginTop:8 }}>ENGINE LOG</div>
        <div style={{ maxHeight:120, overflow:'auto', padding:'6px 8px', background:'#0f0e0b', borderRadius:4, border:'1px solid #1a1810' }}>
          {logs.length === 0 && <div style={{ color:'#1a6b6b', fontSize:9 }}>No events.</div>}
          {logs.slice(0, 20).map((log, i) => {
            const colors = { collision:'#ff8800', resonance:'#00aaff', concept:'#daa520', synthesis:'#b4c864', analysis:'#ff44cc', evolution:'#5acebe', helix:'#00ffcc', scan:'#ff4466', pool:'#b464ff', info:'#00ff00', season:'#16C0FF', reflex:'#00ffcc', attractor:'#ff6b6b' };
            return (<div key={i} style={{ padding:'2px 0', borderLeft:`2px solid ${colors[log.type] || '#333'}`, paddingLeft:6, marginBottom:1 }}><span style={{ fontSize:8, color:'#2a2a1a', fontFamily:'monospace' }}>g{log.gen} </span><span style={{ fontSize:9, color:'#7ae6d6' }}>{log.msg}</span></div>);
          })}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ padding:'6px 10px 12px', fontSize:8, color:'#1a1810', textAlign:'center', borderTop:'1px solid #111' }}>
        Beacon Glyph Engine v5 × Philosopher's Stone v2 × EchoSeed v4.2 — The Crucible v3 · Full Fusion + Physics Lexicon
      </div>
      <div style={{ height: 200 }} />
    </div>
  );
};

function Btn({ children, onClick, disabled, style = {} }) {
  return (<button onClick={onClick} disabled={disabled} style={{ padding:'6px 5px', fontSize:9, fontWeight:'bold', fontFamily:'monospace', border:'1px solid #1a1810', borderRadius:3, background:'#0f0e0b', color:'#daa520', cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing:'0.05em', ...style }}>{children}</button>);
}

export default TheCrucible;
