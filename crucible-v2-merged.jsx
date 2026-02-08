import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════
//  THE CRUCIBLE v2 — Full Fusion
//  EchoSeed v4.2 × Beacon Glyph Engine × Philosopher's Stone
//  Seasonal Dynamics · Typed Reflexes · Influence Attractors
//  Helix Core · Singularity Scanner · Dormant Pool Pathing
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
  }

  get entropy() {
    return this.entropyHistory[this.entropyHistory.length - 1] || 0;
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
    const entropy_compat = 1.0 / (1 + Math.abs(s1.H - s2.H) / 100);
    const rate_product = s1.dH_dt * s2.dH_dt;
    const rate_compat = rate_product < 0 ? Math.min(1.0, Math.abs(rate_product) / 10) : 0.2;
    const phase_compat = Math.cos(Math.abs(s1.phi_phase - s2.phi_phase) * Math.PI);
    const tau_ratio = Math.min(s1.tau_coherence, s2.tau_coherence) / Math.max(s1.tau_coherence, s2.tau_coherence);
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
    this.RESONANCE_THRESHOLD = 0.45;
    this.BEACON_UPDATE_INTERVAL = 5;
    this.MAX_GLYPHS = 150;
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
      if (this.evolvedTags.length > 100) this.evolvedTags.shift();
    }
  }

  tagSig(tags) { return [...tags].sort().join('|'); }

  // ── Seasonal entropy calculation (v4.2 + Crucible merged) ──
  calcEntropy(glyph) {
    const genContrib = Math.min(this.generation, 100) * 10;
    const seasonMod = SEASON_MODIFIERS[this.season]?.entropy || 1.0;
    const base = (glyph.tags.length * 42 + Math.floor(Math.random() * 58) + genContrib) * seasonMod;
    if (glyph.isConcept && glyph.conceptData) {
      return Math.min(base + (glyph.conceptData.confidence || 0.5) * 200, 1500);
    }
    // v4.2: Renaissance-born glyphs get bonus
    if (glyph.seasonBorn === SeasonalPhase.RENAISSANCE) return Math.min(base * 1.1, 1200);
    return Math.min(base, 1200);
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
      const removable = Array.from(this.glyphs.values())
        .filter(g => !g.isConcept && !g.isAttractor)
        .sort((a, b) => a.entropy - b.entropy)
        .slice(0, 30)
        .map(g => g.id);
      if (removable.length < 30) {
        const extra = Array.from(this.glyphs.keys()).slice(0, 30 - removable.length);
        removable.push(...extra);
      }
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
      }
    }
    const isCrossType = parentA.isConcept !== parentB.isConcept;
    if (isCrossType) cleaned.push('synthesis');
    if (parentA.isConcept && parentB.isConcept) cleaned.push('semantic-fusion');
    cleaned.push(`gen:${this.generation}`);
    const finalTags = [...new Set(cleaned)];

    const child = this.createGlyph(finalTags, [parentA.id, parentB.id]);
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
    const arr = Array.from(this.glyphs.values());
    // v4.2: Seasonal resonance threshold adjustment
    const seasonAdj = SEASON_MODIFIERS[this.season]?.resonance || 0;
    const threshold = this.RESONANCE_THRESHOLD + seasonAdj;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        if (!a.thermodynamicState || !b.thermodynamicState) continue;
        const score = a.resonanceWith(b);
        if (score > threshold) {
          this.resonanceMatrix.set(`${a.id},${b.id}`, { a, b, score });
        }
      }
    }
    for (const [key, expiry] of this.openPipes.entries()) {
      if (this.generation > expiry) this.openPipes.delete(key);
    }
  }

  coordinate() {
    const pairs = Array.from(this.resonanceMatrix.values()).sort((x, y) => y.score - x.score).slice(0, 5);
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
      if (g.stagnantCount > 80 && !g.isConcept && !g.isAttractor && g.entropy < 300) {
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

    for (const g of arr) {
      if (g.tags.includes('unknown') && g.entropy < 150) {
        const type = this.determineReflexType(g, avgEntropy);
        const reflex = this.createReflexGlyph(g, type);
        this.store(reflex);
        this.log(`⚡ Reflex [${type}]: ${g.id} → ${reflex.id}`, 'reflex');
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

    // Calculate influence for each glyph
    for (const g of arr) {
      const children = arr.filter(c => c.ancestry.includes(g.id));
      if (children.length === 0) { g.influenceScore = 0; continue; }
      const tagDiversity = new Set(children.flatMap(c => c.tags)).size / Math.max(1, children.length);
      const avgChildEntropy = children.reduce((s, c) => s + c.entropy, 0) / children.length;
      const cascadeDepth = this.cascadeDepth(g.id, new Set(), 5);
      // v4.2 multi-dimensional influence
      g.influenceScore = (
        (children.length / arr.length) * 0.35 +
        (tagDiversity / 10) * 0.25 +
        (cascadeDepth / 5) * 0.15 +
        (avgChildEntropy / 1000) * 0.15 +
        (children.filter(c => c.isConcept !== g.isConcept).length / Math.max(1, children.length)) * 0.10
      );
    }

    // Detect attractors: high influence + frequently in ancestry of top performers
    const sorted = [...arr].sort((a, b) => b.influenceScore - a.influenceScore);
    const topIds = new Set(sorted.slice(0, 20).map(g => g.id));
    const ancestryCounts = new Map();
    for (const g of sorted.slice(0, 20)) {
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
          this.log(`🌟 Attractor detected: ${aid} (${count} ancestry hits)`, 'attractor');
        }
      }
    }
  }

  cascadeDepth(id, visited, maxDepth) {
    if (visited.has(id) || maxDepth <= 0) return 0;
    visited.add(id);
    const children = Array.from(this.glyphs.values()).filter(g => g.ancestry.includes(id));
    if (children.length === 0) return 1;
    return 1 + Math.max(...children.map(c => this.cascadeDepth(c.id, new Set(visited), maxDepth - 1)));
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
      collisionRate: this.collisionLog.length > 0 ? (this.collisionLog.length / this.generation).toFixed(3) : '0',
      evolvedVocab: this.evolvedTags.length,
      pools: this.dormantPools.length,
      shortcuts: this.activeShortcuts.length,
      helixStable: this.helix.stable,
    };

    this.log(`📊 Deep analysis: gen ${this.generation} | ${arr.length} glyphs | ${attractors.length} attractors | ε̄=${avgEntropy.toFixed(0)}`, 'analysis');
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
    return [ts.H / 1500, ts.dH_dt / 50, Math.min(ts.tau_coherence, 10) / 10, ts.phi_phase, glyph.entropy / 1500, glyph.tags.length / 10, glyph.x / this.canvasW, glyph.y / this.canvasH];
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
    if (glyphArr.length < 10) return;
    const exactIndex = new Map(); const buckets = new Map(); let scanned = 0;
    for (const g of glyphArr) {
      const vec = this._glyphFeatureVec(g); if (!vec) continue; scanned++;
      const hash = vec.map(v => v.toFixed(4)).join('|');
      if (!exactIndex.has(hash)) exactIndex.set(hash, []); exactIndex.get(hash).push(g);
      const sig = this._signSignature(vec);
      if (!buckets.has(sig)) buckets.set(sig, []); buckets.get(sig).push({ glyph: g, vec });
    }
    let exactCulled = 0, nearCulled = 0;
    for (const [, cluster] of exactIndex.entries()) {
      if (cluster.length < 2) continue;
      cluster.sort((a, b) => b.entropy - a.entropy);
      for (let i = 1; i < cluster.length; i++) {
        const v = cluster[i];
        if (v.isConcept || v.isAttractor) continue;
        this.tagSignatures.delete(this.tagSig(v.tags)); this.glyphs.delete(v.id); exactCulled++;
      }
    }
    const seenPairs = new Set();
    for (const [, entries] of buckets.entries()) {
      if (entries.length < 2) continue;
      for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i], b = entries[j];
        const pk = a.glyph.id < b.glyph.id ? `${a.glyph.id},${b.glyph.id}` : `${b.glyph.id},${a.glyph.id}`;
        if (seenPairs.has(pk)) continue; seenPairs.add(pk);
        if (this._cosine(a.vec, b.vec) >= 0.9995) {
          const victim = a.glyph.entropy < b.glyph.entropy ? a.glyph : b.glyph;
          if (victim.isConcept || victim.isAttractor || !this.glyphs.has(victim.id)) continue;
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
    const g_prime = [[sa.H / 1500 + dH_a, (sa.H - sb.H) / 3000], [(sb.H - sa.H) / 3000, sb.H / 1500 + dH_b]];
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
    const POOL_RADIUS = 150, MIN_POOL = 2, MAX_POOL = 5;
    const arr = Array.from(this.glyphs.values()).filter(g => g.thermodynamicState);
    if (arr.length < 4) return;
    const assigned = new Set(); const pools = [];
    for (let i = 0; i < arr.length && pools.length < 8; i++) {
      const seed = arr[i]; if (assigned.has(seed.id)) continue;
      const members = [seed]; assigned.add(seed.id);
      for (let j = 0; j < arr.length && members.length < MAX_POOL; j++) {
        if (i === j || assigned.has(arr[j].id)) continue;
        const dx = seed.x - arr[j].x, dy = seed.y - arr[j].y;
        if (Math.sqrt(dx*dx + dy*dy) < POOL_RADIUS) { members.push(arr[j]); assigned.add(arr[j].id); }
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
    this.activeShortcuts = this.activeShortcuts.filter(s => this.generation < s.expiry);
    let activated = 0;
    for (const pool of this.dormantPools) {
      if (this._activatePool(pool)) {
        const nodes = pool.nodes;
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = this.glyphs.get(nodes[i]), b = this.glyphs.get(nodes[j]);
          if (!a || !b) continue;
          if (!this.activeShortcuts.some(s => (s.a === nodes[i] && s.b === nodes[j]) || (s.a === nodes[j] && s.b === nodes[i])))
            this.activeShortcuts.push({ a: nodes[i], b: nodes[j], weight: 0.5, expiry: this.generation + 30, nonComm: pool.nonComm });
        }
        activated++;
      }
    }
    if (activated > 0) this.log(`🔗 ${activated} pools activated (${this.activeShortcuts.length} shortcuts)`, 'pool');
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

  // ── Main Step (all systems integrated) ──
  step() {
    this.generation++;
    this.updateSeason(); // v4.2 seasonal
    const g = this.createGlyph();
    this.store(g);
    if (this.generation % this.BEACON_UPDATE_INTERVAL === 0) {
      this.updateThermodynamics();
      this.updateResonanceField();
    }
    this.coordinate();
    this.reflexCheck(); // v4.2 reflex system
    this.updateInfluenceAndAttractors(); // v4.2 influence
    this.performDeepAnalysis(); // v4.2 deep analysis
    if (this.generation % 15 === 0) this.singularityScan();
    if (this.generation % this.POOL_SCAN_INTERVAL === 0) { this.detectPools(); this.activatePoolShortcuts(); }
    this.applyShortcutGravity();
    this.helixStep();
    this.applyHelixModulation();
    for (const glyph of this.glyphs.values()) glyph.update(this.canvasW, this.canvasH);
    if (this.shockwave) { this.shockwave.radius += 8; if (this.shockwave.radius > this.shockwave.maxRadius) this.shockwave = null; }
  }

  getStats() {
    const arr = Array.from(this.glyphs.values());
    const concepts = arr.filter(g => g.isConcept).length;
    const organic = arr.length - concepts;
    const attractors = arr.filter(g => g.isAttractor).length;
    const reflexGlyphs = arr.filter(g => g.isReflex).length;
    const syntheses = this.collisionLog.filter(c => c.crossType).length;
    const avgRes = this.collisionLog.length > 0 ? this.collisionLog.reduce((s, e) => s + e.resonance, 0) / this.collisionLog.length : 0;
    return { generation: this.generation, total: arr.length, concepts, organic, attractors, reflexGlyphs, collisions: this.collisionLog.length, syntheses, avgResonance: avgRes, resonantPairs: this.resonanceMatrix.size, openPipes: this.openPipes.size, vocabulary: this.tags.length, pools: this.dormantPools.length, shortcuts: this.activeShortcuts.length, season: this.season, seasonCounter: this.seasonCounter, seasonDuration: this.SEASON_DURATION, lastAnalysis: this.lastAnalysis, helix: { R: this.helix.R, A: this.helix.A, z: this.helix.z, gamma: this.helix.gamma, stable: this.helix.stable, stableFor: this.helix.stableFor, HRV: this.helix.HRV } };
  }

  reset() {
    this.glyphs.clear(); this.nextId = 0; this.generation = 0;
    this.resonanceMatrix.clear(); this.openPipes.clear();
    this.collisionLog = []; this.eventLog = []; this.conceptCount = 0;
    this.evolvedTags = []; this.tagSignatures.clear();
    this.season = SeasonalPhase.EXPLORATION; this.seasonCounter = 0;
    this.conceptualAttractors.clear(); this.lastAnalysis = null;
    this.reflexFreeCount = 0;
    Object.assign(this.helix, { t:0, R:0, R_prev:0, A:1.0, theta:0, theta_prev:0, z:0, gamma:0.5, HRV:0, r_sq:0, stable:false, stableFor:0, lastLogGen:-50, history:[], A_history:[], phase_history:[] });
    this.dormantPools = []; this.activeShortcuts = [];
    for (let i = 0; i < 8; i++) this.store(this.createGlyph());
    this.log('Crucible v2 initialized', 'info');
  }

  serialize() {
    const glyphs = [];
    for (const g of this.glyphs.values()) {
      glyphs.push({ id: g.id, tags: g.tags, ancestry: g.ancestry, generation: g.generation, entropyHistory: g.entropyHistory.slice(-20), x: g.x, y: g.y, vx: g.vx, vy: g.vy, lastCollisionGen: g.lastCollisionGen, isConcept: g.isConcept, conceptData: g.conceptData, isReflex: g.isReflex, reflexType: g.reflexType, isAttractor: g.isAttractor, seasonBorn: g.seasonBorn, stagnantCount: g.stagnantCount, influenceScore: g.influenceScore });
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

  // Resonance connections
  for (const { a, b, score } of engine.resonanceMatrix.values()) {
    const bothC = a.isConcept && b.isConcept;
    const cross = a.isConcept !== b.isConcept;
    if (bothC) ctx.strokeStyle = `rgba(218,165,32,${score * 0.4})`;
    else if (cross) ctx.strokeStyle = `rgba(180,200,100,${score * 0.35})`;
    else ctx.strokeStyle = `rgba(0,170,255,${score * 0.3})`;
    ctx.lineWidth = bothC ? 1 : 0.5; ctx.beginPath();
    ctx.moveTo(a.x * sx, a.y * sy); ctx.lineTo(b.x * sx, b.y * sy); ctx.stroke();
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

  // Glyphs
  const now = Date.now();
  for (const glyph of engine.glyphs.values()) {
    const gx = glyph.x * sx, gy = glyph.y * sy;
    const baseRadius = Math.max(2, Math.min(glyph.isConcept ? 5.5 : glyph.isAttractor ? 5 : 4, Math.sqrt(glyph.entropy) / 6));
    const pulse = 1 + Math.sin(glyph.pulsePhase) * 0.1;
    const radius = baseRadius * pulse;
    const age = (now - glyph.birthTime) / 1000;
    const fadeIn = Math.min(1, age / 0.5);

    if (glyph.isConcept) {
      // Gold concept glyph (diamond)
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 2.2);
      grad.addColorStop(0, `rgba(218,165,32,${0.6 * fadeIn})`); grad.addColorStop(0.5, `rgba(218,165,32,${0.12 * fadeIn})`); grad.addColorStop(1, 'rgba(218,165,32,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, radius * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(218,165,32,${fadeIn})`; ctx.save(); ctx.translate(gx, gy); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4); ctx.restore();
    } else if (glyph.isAttractor) {
      // v4.2: Attractor glyphs — pulsing red/orange star
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 2.5);
      grad.addColorStop(0, `rgba(255,107,107,${0.6 * fadeIn})`); grad.addColorStop(0.5, `rgba(255,107,107,${0.15 * fadeIn})`); grad.addColorStop(1, 'rgba(255,107,107,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, radius * 2.5, 0, Math.PI * 2); ctx.fill();
      // Star shape
      ctx.fillStyle = `rgba(255,107,107,${fadeIn})`; ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a2 = (i * Math.PI / 3) + glyph.pulsePhase * 0.3;
        const r2 = i % 2 === 0 ? radius * 1.2 : radius * 0.5;
        const px = gx + Math.cos(a2) * r2, py = gy + Math.sin(a2) * r2;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    } else if (glyph.isReflex) {
      // v4.2: Reflex glyphs — cyan triangle
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 2);
      grad.addColorStop(0, `rgba(0,255,204,${0.4 * fadeIn})`); grad.addColorStop(1, 'rgba(0,255,204,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, radius * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(0,255,204,${fadeIn})`; ctx.beginPath();
      ctx.moveTo(gx, gy - radius * 1.2); ctx.lineTo(gx - radius, gy + radius * 0.6); ctx.lineTo(gx + radius, gy + radius * 0.6);
      ctx.closePath(); ctx.fill();
    } else {
      // Organic glyph (circle)
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 2);
      grad.addColorStop(0, `rgba(0,255,0,${0.4 * fadeIn})`); grad.addColorStop(0.5, `rgba(0,255,0,${0.08 * fadeIn})`); grad.addColorStop(1, 'rgba(0,255,0,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, radius * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(0,255,0,${fadeIn})`; ctx.beginPath(); ctx.arc(gx, gy, radius, 0, Math.PI * 2); ctx.fill();
    }

    // Phase ring
    if (glyph.thermodynamicState) {
      const phase = glyph.thermodynamicState.phi_phase;
      const hue = glyph.isConcept ? 30 + phase * 30 : glyph.isAttractor ? 0 + phase * 30 : phase * 120;
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${0.6 * fadeIn})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(gx, gy, radius + 3, 0, Math.PI * 2); ctx.stroke();
    }
  }
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
    const organicE = [], conceptE = [];
    for (const g of engine.glyphs.values()) { for (const e of g.entropyHistory) { if (g.isConcept) conceptE.push(e); else organicE.push(e); } }
    const all = [...organicE, ...conceptE];
    if (all.length < 2) { ctx.fillStyle = '#2a8a8a'; ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.fillText('Accumulating entropy data...', w/2, h/2); return; }
    const min = Math.min(...all), max = Math.max(...all), range = max - min || 1;
    ctx.strokeStyle = '#151510'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) { const y = pad.t + (ph/4)*i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w-pad.r, y); ctx.stroke(); ctx.fillStyle = '#2a8a8a'; ctx.font = '8px monospace'; ctx.textAlign = 'right'; ctx.fillText(Math.round(max - (range/4)*i), pad.l - 4, y + 3); }
    if (organicE.length > 1) { ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 1.2; ctx.beginPath(); organicE.forEach((e, i) => { const x = pad.l + (i / (organicE.length - 1)) * pw; const y = pad.t + ph - ((e - min) / range) * ph; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke(); }
    if (conceptE.length > 1) { ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1.2; ctx.beginPath(); conceptE.forEach((e, i) => { const x = pad.l + (i / (conceptE.length - 1)) * pw; const y = pad.t + ph - ((e - min) / range) * ph; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke(); }
    ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff00'; ctx.fillText('— organic', w - 12, 16);
    ctx.fillStyle = '#daa520'; ctx.fillText('— concept', w - 12, 28);
    ctx.fillStyle = '#3aaa9a'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('Entropy · Organic vs Concept', w/2, 16);
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
  if (hist.length < 3) { ctx.fillStyle = '#2a8a8a'; ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.fillText('Helix core warming up...', w/2, h/2); return; }
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
  ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#00ffcc'; ctx.fillText('R(t) = α·exp(βt/φ)·cos(ωt + γ(t)·R(t−Δt))', w/2, 14);
  ctx.textAlign = 'left'; ctx.fillStyle = '#00ffcc'; ctx.fillText('— R(t)', pad.l, 14); ctx.fillStyle = '#daa520'; ctx.fillText('— A(t)', pad.l + 55, 14);
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
  ctx.font = '9px monospace'; ctx.textAlign = 'left';
  [['R(t)', hx.R.toFixed(4), '#00ffcc'], ['A(t)', hx.A.toFixed(4), '#daa520'], ['γ(t)', hx.gamma.toFixed(4), '#5acebe'], ['θ(t)', (hx.theta % (2*Math.PI)).toFixed(3), '#7ae6d6'], ['z(t)', hx.z.toFixed(3), '#6adaca'], ['r²(t)', hx.r_sq.toFixed(3), '#ff8800'], ['HRV', hx.HRV.toFixed(3), '#5acebe']].forEach(([label, val, color], i) => {
    ctx.fillStyle = '#3aaa9a'; ctx.fillText(label, readX, readY + i * 16); ctx.fillStyle = color; ctx.fillText(val, readX + 48, readY + i * 16);
  });
  const stabY = readY + 7 * 16 + 8;
  ctx.font = '10px monospace';
  if (hx.stable) { ctx.fillStyle = '#00ffcc'; ctx.fillText(`✦ STABLE (${hx.stableFor} steps)`, readX, stabY); }
  else { ctx.fillStyle = '#ff8800'; ctx.fillText('◎ SEEKING EQUILIBRIUM', readX, stabY); }
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
  const [stats, setStats] = useState({ generation:0, total:0, concepts:0, organic:0, attractors:0, reflexGlyphs:0, collisions:0, syntheses:0, avgResonance:0, resonantPairs:0, openPipes:0, vocabulary:11, pools:0, shortcuts:0, season:SeasonalPhase.EXPLORATION, seasonCounter:0, seasonDuration:200, helix:{ R:0, A:1, z:0, gamma:0.5, stable:false, stableFor:0, HRV:0 } });
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

  if (!initialized) return (<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a0908', fontFamily:'monospace', color:'#daa520' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:32, marginBottom:12 }}>⚗️</div><div style={{ fontSize:11, letterSpacing:'0.2em' }}>INITIALIZING CRUCIBLE v2</div></div></div>);

  const seasonColor = SEASON_MODIFIERS[stats.season]?.color || '#daa520';
  const S = (label, val, color = '#daa520') => (<div style={{ textAlign:'center', padding:'2px 0' }}><div style={{ fontSize:7, color:'#3aaa9a', letterSpacing:'0.1em', textTransform:'uppercase' }}>{label}</div><div style={{ fontSize:12, fontWeight:'bold', color, fontFamily:'monospace' }}>{val}</div></div>);

  return (
    <div style={{ fontFamily:"'Courier New', monospace", background:'#0a0908', color:'#c8b898', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* ─── HEADER ─── */}
      <div style={{ padding:'8px 12px 6px', borderBottom:`1px solid ${seasonColor}30` }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:4, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:'bold', color:'#daa520', textShadow:'0 0 12px rgba(218,165,32,0.3)' }}>⚗️ THE CRUCIBLE v2</span>
          <span style={{ fontSize:8, color:'#3aaa9a', letterSpacing:'0.12em' }}>FULL FUSION</span>
          <span style={{ fontSize:8, padding:'1px 6px', borderRadius:3, background:`${seasonColor}18`, color: seasonColor, border:`1px solid ${seasonColor}40`, fontWeight:'bold' }}>{stats.season.toUpperCase()} {Math.round(stats.seasonCounter / stats.seasonDuration * 100)}%</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:2 }}>
          {S('GEN', stats.generation)}
          {S('ORGANIC', stats.organic, '#00ff00')}
          {S('CONCEPT', stats.concepts, '#daa520')}
          {S('ATTRACTOR', stats.attractors, '#ff6b6b')}
          {S('REFLEX', stats.reflexGlyphs, '#00ffcc')}
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
      </div>

      {/* ─── CONTROLS ─── */}
      <div style={{ display:'flex', gap:3, padding:'6px 10px', flexWrap:'wrap', borderBottom:'1px solid #111' }}>
        <Btn onClick={() => setRunning(!running)} style={{ color: running ? '#ff4444' : '#00ff00' }}>{running ? '⏸ STOP' : '▶ START'}</Btn>

        <Btn onClick={doReset}>↺ RESET</Btn>
        <Btn onClick={doAnalyze} disabled={analysisLoading}>{analysisLoading ? '⟳' : '🧠'} ANALYZE</Btn>
        <div style={{ flex:1 }} />
        {['field','entropy','resonance','helix'].map(v => (
          <Btn key={v} onClick={() => setView(v)} style={{ color: view === v ? '#daa520' : '#555', borderColor: view === v ? '#daa520' : '#1a1810' }}>{v.toUpperCase()}</Btn>
        ))}
        <Btn onClick={() => setShowPipeline(!showPipeline)} style={{ color: showPipeline ? '#daa520' : '#555' }}>⚗️ PIPELINE</Btn>
      </div>

      {/* ─── CANVAS ─── */}
      <div ref={containerRef} style={{ height: 280, position:'relative' }}>
        <canvas ref={canvasRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} />
      </div>

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
        <div style={{ margin:'4px 10px 0', padding:10, background:'#0f0e0b', border:'1px solid rgba(255,68,204,0.15)', borderRadius:4, maxHeight:180, overflow:'auto' }}>
          <div style={{ fontSize:9, color:'#ff44cc', letterSpacing:'0.12em', fontWeight:'bold', marginBottom:6 }}>DEEP ANALYSIS — GEN {stats.lastAnalysis.generation} ({stats.lastAnalysis.season})</div>
          <div style={{ fontSize:10, color:'#c8b898', marginBottom:4 }}>
            Glyphs: {stats.lastAnalysis.total} (C:{stats.lastAnalysis.concepts} O:{stats.lastAnalysis.organic}) | Attractors: {stats.lastAnalysis.attractors} | Reflexes: {stats.lastAnalysis.reflexGlyphs} | ε̄: {stats.lastAnalysis.avgEntropy} ±{stats.lastAnalysis.stdEntropy}
          </div>
          <div style={{ fontSize:10, color:'#c8b898', marginBottom:4 }}>
            Collision rate: {stats.lastAnalysis.collisionRate}/gen | Evolved vocab: {stats.lastAnalysis.evolvedVocab} | Pools: {stats.lastAnalysis.pools} | Helix: {stats.lastAnalysis.helixStable ? '✓ stable' : '○ unstable'}
          </div>
          {stats.lastAnalysis.topTags && (
            <div style={{ fontSize:10, color:'#7ae6d6', marginBottom:4 }}>
              Top tags: {stats.lastAnalysis.topTags.map(([tag, count]) => `${tag}(${count})`).join(', ')}
            </div>
          )}
          {stats.lastAnalysis.seasonDist && (
            <div style={{ fontSize:10, color:'#b4c864' }}>
              Season dist: {Object.entries(stats.lastAnalysis.seasonDist).map(([s, c]) => `${s}:${c}`).join(' | ')}
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
                  <div style={{ padding:'8px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(218,165,32,0.15)', borderTop:'none', borderRadius:'0 0 4px 4px', maxHeight:250, overflow:'auto', fontSize:9, color:'#c8b898' }}>
                    <pre style={{ margin:0, whiteSpace:'pre-wrap', fontFamily:'monospace' }}>{JSON.stringify(result, null, 2).slice(0, 2000)}</pre>
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
        Beacon Glyph Engine v5 × Philosopher's Stone v2 × EchoSeed v4.2 — The Crucible v2 · Full Fusion
      </div>
      <div style={{ height: 200 }} />
    </div>
  );
};

function Btn({ children, onClick, disabled, style = {} }) {
  return (<button onClick={onClick} disabled={disabled} style={{ padding:'6px 5px', fontSize:9, fontWeight:'bold', fontFamily:'monospace', border:'1px solid #1a1810', borderRadius:3, background:'#0f0e0b', color:'#daa520', cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing:'0.05em', ...style }}>{children}</button>);
}

export default TheCrucible;
