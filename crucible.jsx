import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════
//  THE CRUCIBLE — Alchemical Consciousness Forge
//  Beacon Glyph Engine × Philosopher's Stone Extraction
// ═══════════════════════════════════════════════════════════

// ===== GLYPH CLASS =====
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
    // Concept-concept resonance bonus (semantic gravity)
    if (this.isConcept && other.isConcept) base *= 1.15;
    // Cross-type resonance bonus (knowledge-emergence bridge)
    if (this.isConcept !== other.isConcept) base *= 1.08;
    return Math.min(1.0, base);
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;
    // Gentle drag
    this.vx *= 0.998;
    this.vy *= 0.998;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
    this.x = Math.max(0, Math.min(width, this.x));
    this.y = Math.max(0, Math.min(height, this.y));
    this.pulsePhase += 0.05;
  }
}

// ===== ENGINE CORE =====
class CrucibleEngine {
  constructor() {
    this.glyphs = new Map();
    this.nextId = 0;
    this.generation = 0;
    this.resonanceMatrix = new Map();
    this.openPipes = new Map();
    this.collisionLog = [];
    this.eventLog = [];
    this.tags = ['origin','flex','ghost','fractal','wild','mirror','unknown','stable','beacon','phase','resonant'];
    this.RESONANCE_THRESHOLD = 0.45;
    this.BEACON_UPDATE_INTERVAL = 5;
    this.MAX_GLYPHS = 200;
    this.canvasW = 1200;
    this.canvasH = 600;
    this.conceptCount = 0;
    this.shockwave = null; // {x, y, radius, maxRadius, color, birth}
  }

  log(msg, type = 'info') {
    this.eventLog.unshift({ msg, type, gen: this.generation, ts: Date.now() });
    if (this.eventLog.length > 50) this.eventLog.length = 50;
  }

  genId() { return `g${String(this.nextId++).padStart(4, '0')}`; }
  randomTag() { return this.tags[Math.floor(Math.random() * this.tags.length)]; }

  calcEntropy(glyph) {
    const base = glyph.tags.length * 42 + Math.floor(Math.random() * 58) + this.generation * 10;
    if (glyph.isConcept && glyph.conceptData) {
      return base + (glyph.conceptData.confidence || 0.5) * 200;
    }
    return base;
  }

  createGlyph(tags = null, ancestry = []) {
    if (!tags) {
      tags = [];
      for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) tags.push(this.randomTag());
      tags = [...new Set(tags)];
    }
    const glyph = new Glyph(this.genId(), tags, ancestry, this.generation);
    glyph.entropyHistory.push(this.calcEntropy(glyph));
    return glyph;
  }

  // Inject extracted concept as a living glyph
  injectConcept(concept) {
    const tags = [...(concept.keywords || []), 'concept', `c#${concept.id}`];
    const glyph = new Glyph(this.genId(), tags, [], this.generation, true);
    glyph.conceptData = concept;
    // Spawn from center with outward burst
    const cx = this.canvasW / 2, cy = this.canvasH / 2;
    const angle = (this.conceptCount * 2.399) + Math.random() * 0.3; // golden angle spiral
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
    // Push all glyphs outward
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
      // Prefer removing non-concept glyphs first
      const removable = Array.from(this.glyphs.values())
        .filter(g => !g.isConcept)
        .slice(0, 50)
        .map(g => g.id);
      if (removable.length < 50) {
        const extra = Array.from(this.glyphs.keys()).slice(0, 50 - removable.length);
        removable.push(...extra);
      }
      removable.forEach(id => this.glyphs.delete(id));
    }
  }

  collide(parentA, parentB) {
    const childTags = [...new Set([...parentA.tags, ...parentB.tags])];
    if (parentA.tags.length >= 2 && parentB.tags.length >= 2) {
      const mutant = `${parentA.tags[Math.floor(Math.random() * parentA.tags.length)]}×${parentB.tags[Math.floor(Math.random() * parentB.tags.length)]}`;
      childTags.push(mutant);
    }
    const isCrossType = parentA.isConcept !== parentB.isConcept;
    if (isCrossType) childTags.push('synthesis');
    if (parentA.isConcept && parentB.isConcept) childTags.push('semantic-fusion');

    const child = this.createGlyph(childTags, [parentA.id, parentB.id]);
    child.x = (parentA.x + parentB.x) / 2 + (Math.random() - 0.5) * 50;
    child.y = (parentA.y + parentB.y) / 2 + (Math.random() - 0.5) * 50;
    // Inherit concept status if both parents are concepts
    if (parentA.isConcept && parentB.isConcept) {
      child.isConcept = true;
      child.conceptData = { technical: `Fusion of ${parentA.id} × ${parentB.id}`, confidence: 0.8, keywords: childTags.slice(0, 4) };
    }
    this.store(child);
    return child;
  }

  updateThermodynamics() {
    for (const glyph of this.glyphs.values()) {
      glyph.entropyHistory.push(this.calcEntropy(glyph));
      if (glyph.entropyHistory.length > 50) glyph.entropyHistory.shift();
      glyph.updateThermodynamics(this.generation);
    }
  }

  updateResonanceField() {
    this.resonanceMatrix.clear();
    const arr = Array.from(this.glyphs.values());
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        if (!a.thermodynamicState || !b.thermodynamicState) continue;
        const score = a.resonanceWith(b);
        if (score > this.RESONANCE_THRESHOLD) {
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

  step() {
    this.generation++;
    const g = this.createGlyph();
    this.store(g);
    if (this.generation % this.BEACON_UPDATE_INTERVAL === 0) {
      this.updateThermodynamics();
      this.updateResonanceField();
    }
    this.coordinate();
    for (const glyph of this.glyphs.values()) glyph.update(this.canvasW, this.canvasH);
    // Advance shockwave
    if (this.shockwave) {
      this.shockwave.radius += 8;
      if (this.shockwave.radius > this.shockwave.maxRadius) this.shockwave = null;
    }
  }

  getStats() {
    const concepts = Array.from(this.glyphs.values()).filter(g => g.isConcept).length;
    const organic = this.glyphs.size - concepts;
    const syntheses = this.collisionLog.filter(c => c.crossType).length;
    const avgRes = this.collisionLog.length > 0 ? this.collisionLog.reduce((s, e) => s + e.resonance, 0) / this.collisionLog.length : 0;
    return { generation: this.generation, total: this.glyphs.size, concepts, organic, collisions: this.collisionLog.length, syntheses, avgResonance: avgRes, resonantPairs: this.resonanceMatrix.size, openPipes: this.openPipes.size };
  }

  reset() {
    this.glyphs.clear(); this.nextId = 0; this.generation = 0;
    this.resonanceMatrix.clear(); this.openPipes.clear();
    this.collisionLog = []; this.eventLog = []; this.conceptCount = 0;
    for (let i = 0; i < 8; i++) this.store(this.createGlyph());
    this.log('Crucible initialized', 'info');
  }

  serialize() {
    const glyphs = [];
    for (const g of this.glyphs.values()) {
      glyphs.push({ id: g.id, tags: g.tags, ancestry: g.ancestry, generation: g.generation, entropyHistory: g.entropyHistory.slice(-20), x: g.x, y: g.y, vx: g.vx, vy: g.vy, lastCollisionGen: g.lastCollisionGen, isConcept: g.isConcept, conceptData: g.conceptData });
    }
    return { glyphs, nextId: this.nextId, generation: this.generation, collisionLog: this.collisionLog.slice(-50), eventLog: this.eventLog.slice(-30), conceptCount: this.conceptCount };
  }

  deserialize(data) {
    if (!data) return;
    this.nextId = data.nextId || 0;
    this.generation = data.generation || 0;
    this.collisionLog = data.collisionLog || [];
    this.eventLog = data.eventLog || [];
    this.conceptCount = data.conceptCount || 0;
    this.glyphs.clear();
    for (const gd of (data.glyphs || [])) {
      const g = new Glyph(gd.id, gd.tags, gd.ancestry, gd.generation, gd.isConcept || false);
      g.entropyHistory = gd.entropyHistory || [];
      g.x = gd.x; g.y = gd.y; g.vx = gd.vx; g.vy = gd.vy;
      g.lastCollisionGen = gd.lastCollisionGen || 0;
      g.conceptData = gd.conceptData || null;
      this.glyphs.set(g.id, g);
    }
    this.updateThermodynamics();
    this.updateResonanceField();
    this.log(`Restored gen ${this.generation} (${this.conceptCount} concepts)`, 'info');
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

  // Background with subtle noise texture
  ctx.fillStyle = '#0a0908';
  ctx.fillRect(0, 0, w, h);
  // Vignette
  const vg = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.3, w/2, h/2, Math.max(w,h)*0.7);
  vg.addColorStop(0, 'transparent');
  vg.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  if (engine.glyphs.size === 0) return;
  const sx = w / 1200, sy = h / 600;

  // Shockwave
  if (engine.shockwave) {
    const sw = engine.shockwave;
    const alpha = 1 - sw.radius / sw.maxRadius;
    ctx.strokeStyle = sw.color + Math.floor(alpha * 80).toString(16).padStart(2,'0');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sw.x * sx, sw.y * sy, sw.radius * Math.min(sx, sy), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Resonance connections
  for (const { a, b, score } of engine.resonanceMatrix.values()) {
    const isCross = a.isConcept !== b.isConcept;
    const bothConcept = a.isConcept && b.isConcept;
    if (bothConcept) ctx.strokeStyle = `rgba(218,165,32,${score * 0.4})`;
    else if (isCross) ctx.strokeStyle = `rgba(180,200,100,${score * 0.35})`;
    else ctx.strokeStyle = `rgba(0,170,255,${score * 0.3})`;
    ctx.lineWidth = bothConcept ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(a.x * sx, a.y * sy);
    ctx.lineTo(b.x * sx, b.y * sy);
    ctx.stroke();
  }

  // Open pipes
  for (const key of engine.openPipes.keys()) {
    const [idA, idB] = key.split(',');
    const a = engine.glyphs.get(idA), b = engine.glyphs.get(idB);
    if (a && b) {
      ctx.strokeStyle = 'rgba(255,136,0,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x * sx, a.y * sy);
      ctx.lineTo(b.x * sx, b.y * sy);
      ctx.stroke();
    }
  }

  // Glyphs
  const now = Date.now();
  for (const glyph of engine.glyphs.values()) {
    const gx = glyph.x * sx, gy = glyph.y * sy;
    const baseRadius = Math.max(2, Math.sqrt(glyph.entropy) / 4);
    const pulse = 1 + Math.sin(glyph.pulsePhase) * 0.15;
    const radius = baseRadius * pulse;
    const age = (now - glyph.birthTime) / 1000;
    const fadeIn = Math.min(1, age / 0.5);

    if (glyph.isConcept) {
      // Gold concept glyph
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 3);
      grad.addColorStop(0, `rgba(218,165,32,${0.7 * fadeIn})`);
      grad.addColorStop(0.4, `rgba(218,165,32,${0.2 * fadeIn})`);
      grad.addColorStop(1, 'rgba(218,165,32,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, radius * 3, 0, Math.PI * 2);
      ctx.fill();
      // Core - diamond shape
      ctx.fillStyle = `rgba(218,165,32,${fadeIn})`;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4);
      ctx.restore();
    } else {
      // Green organic glyph
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius * 2.5);
      grad.addColorStop(0, `rgba(0,255,0,${0.5 * fadeIn})`);
      grad.addColorStop(0.5, `rgba(0,255,0,${0.1 * fadeIn})`);
      grad.addColorStop(1, 'rgba(0,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.fillStyle = `rgba(0,255,0,${fadeIn})`;
      ctx.beginPath();
      ctx.arc(gx, gy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Phase ring
    if (glyph.thermodynamicState) {
      const phase = glyph.thermodynamicState.phi_phase;
      const hue = glyph.isConcept ? 30 + phase * 30 : phase * 120;
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${0.6 * fadeIn})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(gx, gy, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
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

  ctx.fillStyle = '#0a0908';
  ctx.fillRect(0, 0, w, h);

  const pad = { t: 28, b: 30, l: 48, r: 16 };
  const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;

  if (mode === 'entropy') {
    // Separate organic vs concept entropy
    const organicE = [], conceptE = [];
    for (const g of engine.glyphs.values()) {
      for (const e of g.entropyHistory) {
        if (g.isConcept) conceptE.push(e); else organicE.push(e);
      }
    }
    const all = [...organicE, ...conceptE];
    if (all.length < 2) {
      ctx.fillStyle = '#333'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('Accumulating entropy data...', w/2, h/2);
      return;
    }
    const min = Math.min(...all), max = Math.max(...all), range = max - min || 1;

    // Grid
    ctx.strokeStyle = '#151510'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ph/4)*i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w-pad.r, y); ctx.stroke();
      ctx.fillStyle = '#333'; ctx.font = '8px monospace'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(max - (range/4)*i), pad.l - 4, y + 3);
    }

    // Organic line
    if (organicE.length > 1) {
      ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 1.2; ctx.beginPath();
      organicE.forEach((e, i) => {
        const x = pad.l + (i / (organicE.length - 1)) * pw;
        const y = pad.t + ph - ((e - min) / range) * ph;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    // Concept line
    if (conceptE.length > 1) {
      ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1.2; ctx.beginPath();
      conceptE.forEach((e, i) => {
        const x = pad.l + (i / (conceptE.length - 1)) * pw;
        const y = pad.t + ph - ((e - min) / range) * ph;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Legend
    ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff00'; ctx.fillText('— organic', w - 12, 16);
    ctx.fillStyle = '#daa520'; ctx.fillText('— concept', w - 12, 28);
    ctx.fillStyle = '#444'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('Entropy · Organic vs Concept', w/2, 16);
  }

  if (mode === 'resonance') {
    const log = engine.collisionLog;
    if (log.length < 2) {
      ctx.fillStyle = '#333'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('Awaiting collisions...', w/2, h/2);
      return;
    }
    const vals = log.map(e => e.resonance);
    const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;

    ctx.strokeStyle = '#151510'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ph/4)*i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w-pad.r, y); ctx.stroke();
      ctx.fillStyle = '#333'; ctx.font = '8px monospace'; ctx.textAlign = 'right';
      ctx.fillText((max - (range/4)*i).toFixed(2), pad.l - 4, y + 3);
    }

    // Threshold
    const threshY = pad.t + ph - ((engine.RESONANCE_THRESHOLD - min) / range) * ph;
    ctx.strokeStyle = '#ff444466'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pad.l, threshY); ctx.lineTo(w-pad.r, threshY); ctx.stroke();
    ctx.setLineDash([]);

    // Dots + line
    log.forEach((entry, i) => {
      const x = pad.l + (i / (vals.length - 1)) * pw;
      const y = pad.t + ph - ((entry.resonance - min) / range) * ph;
      const color = entry.crossType ? '#daa520' : '#00aaff';
      if (i > 0) {
        ctx.strokeStyle = color + '88'; ctx.lineWidth = 0.8;
        const px = pad.l + ((i-1) / (vals.length - 1)) * pw;
        const py = pad.t + ph - ((vals[i-1] - min) / range) * ph;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      }
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill();
    });

    ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillStyle = '#00aaff'; ctx.fillText('● organic', w-12, 16);
    ctx.fillStyle = '#daa520'; ctx.fillText('● synthesis', w-12, 28);
    ctx.fillStyle = '#444'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`Resonance · ${log.length} collisions`, w/2, 16);
  }
}

// ===== PIPELINE CONFIG =====
const DEPTH_PRIMES = {
  shallow: { concepts: 7, terms: 5, clusters: 3, glossary: 7, thesis: 3 },
  medium:  { concepts: 13, terms: 7, clusters: 5, glossary: 13, thesis: 3 },
  deep:    { concepts: 23, terms: 13, clusters: 7, glossary: 23, thesis: 5 },
};

const STAGES = [
  { id: 'dual_extract', name: 'Dual-Register Extraction', icon: '⚗️', desc: 'Technical + plain-language concepts', deps: [] },
  { id: 'triple_mode', name: 'Triple-Mode Elaboration', icon: '🔬', desc: 'Code, analogies, insights', deps: ['dual_extract'] },
  { id: 'semantic_index', name: 'Semantic Taxonomy', icon: '🗂️', desc: 'Index terms with cross-references', deps: ['dual_extract'] },
  { id: 'compress_expand', name: 'Compress / Expand', icon: '💎', desc: 'Core thesis + expanded glossary', deps: ['dual_extract'] },
  { id: 'meta_analysis', name: 'Meta-Analysis', icon: '📡', desc: 'Complexity mapping + structural insight', deps: [] },
];

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));

function resolveDeps(id, visited = new Set()) {
  if (visited.has(id)) return visited;
  visited.add(id);
  STAGE_MAP[id]?.deps?.forEach(d => resolveDeps(d, visited));
  return visited;
}
function resolveDependents(id) {
  const deps = new Set();
  STAGES.forEach(s => { if (s.deps.includes(id)) { deps.add(s.id); resolveDependents(s.id).forEach(d => deps.add(d)); }});
  return deps;
}

function repairJSON(raw) {
  let s = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(s); } catch {}
  s = s.replace(/\t/g, '\\t').replace(/,\s*([\]}])/g, '$1');
  try { return JSON.parse(s); } catch {}
  const arrM = s.match(/\[[\s\S]*\]/), objM = s.match(/\{[\s\S]*\}/);
  const match = arrM && arrM[0].length > (objM ? objM[0].length : 0) ? arrM : objM;
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
    let fixed = match[0].replace(/"([^"]*?)"/g, (m, c) => {
      return `"${c.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t')}"`;
    }).replace(/,\s*([\]}])/g, '$1');
    try { return JSON.parse(fixed); } catch {}
  }
  try { const fn = new Function('return ' + s); const r = fn(); JSON.stringify(r); return r; } catch {}
  throw new Error('JSON parse failed: ' + raw.slice(0, 200));
}

async function callAPI(system, user, onStatus, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (onStatus) onStatus(attempt > 0 ? `retry ${attempt}...` : 'requesting...');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system, messages: [{ role: 'user', content: user }] }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text = data.content?.map(b => b.text || '').join('') || '';
      const parsed = repairJSON(text);
      if (onStatus) onStatus('complete');
      return parsed;
    } catch (e) {
      if (attempt === maxRetries) throw e;
      if (onStatus) onStatus(`error: ${e.message.slice(0,50)} — retrying...`);
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

const PROMPTS = {
  dual_extract: (text, depth) => ({
    system: 'You are a precision extraction engine. Output ONLY valid JSON, no markdown fences.',
    user: `Extract EXACTLY ${DEPTH_PRIMES[depth].concepts} concepts (prime constraint). For each: technical sentence, plain sentence, confidence (0-1), keywords array.\nReturn: [{"id":1,"technical":"...","plain":"...","confidence":0.95,"keywords":["a","b"]}]\n\nTEXT:\n${text}`
  }),
  triple_mode: (text, concepts) => ({
    system: 'Multi-modal elaboration engine. Output ONLY valid JSON.',
    user: `Elaborate each concept in 3 modes: code (Python, single-line with semicolons, single quotes), analogy, insight.\nCONCEPTS: ${JSON.stringify(concepts)}\nReturn: [{"concept_id":1,"code":"...","analogy":"...","insight":"..."}]\nTEXT: ${text}`
  }),
  semantic_index: (text, concepts, depth) => ({
    system: 'Semantic indexing engine. Output ONLY valid JSON.',
    user: `Create taxonomy: ${DEPTH_PRIMES[depth].terms} terms, ${DEPTH_PRIMES[depth].clusters} clusters.\nCONCEPTS: ${JSON.stringify(concepts)}\nReturn: {"terms":[{"term":"...","concept_ids":[1],"definition":"..."}],"clusters":[{"label":"...","concept_ids":[1],"theme":"..."}],"density_score":0.8}\nTEXT: ${text}`
  }),
  compress_expand: (text, concepts, taxonomy, depth) => ({
    system: 'Compression/expansion engine. Output ONLY valid JSON.',
    user: `COMPRESS to ${DEPTH_PRIMES[depth].thesis}-sentence thesis. EXPAND to ${DEPTH_PRIMES[depth].glossary}-entry glossary (1:1 with concepts).\nCONCEPTS: ${JSON.stringify(concepts)}\nTAXONOMY: ${JSON.stringify(taxonomy)}\nReturn: {"core_thesis":"...","glossary":[{"term":"...","definition":"...","concept_ids":[1],"index_terms":["..."]}],"compression_ratio":"..."}\nTEXT: ${text}`
  }),
  meta_analysis: (text, allResults, depth, engineStats) => ({
    system: 'Meta-analytical engine evaluating combined extraction + consciousness simulation. Output ONLY valid JSON.',
    user: `Analyze this extraction pipeline AND living glyph engine state.\nPIPELINE (depth=${depth}, primes: ${JSON.stringify(DEPTH_PRIMES[depth])}):\n${JSON.stringify(allResults)}\nGLYPH ENGINE: ${JSON.stringify(engineStats)}\nReturn: {"complexity_profile":{"conceptual_density":0.8,"technical_depth":0.7,"abstraction_level":0.6,"interconnectedness":0.9},"extraction_quality":{"score":0.85,"notes":"..."},"information_topology":"...","blind_spots":["..."],"recommended_depth":"...","emergence_assessment":"...","prime_constraints":"..."}\nTEXT: ${text}`
  }),
  crucible_analysis: (engineSummary, recentCollisions) => ({
    system: 'You analyze a beacon-coordinated consciousness simulation using thermodynamic resonance. Glyphs collide when resonance exceeds threshold. Concept-glyphs (gold) are injected from text extraction. Organic glyphs (green) emerge naturally. Cross-type collisions produce syntheses. Output ONLY valid JSON.',
    user: `Glyphs:\n${JSON.stringify(engineSummary)}\nCollisions:\n${JSON.stringify(recentCollisions)}\nReturn: {"patterns":[{"name":"...","description":"..."}],"resonance_analysis":{"summary":"...","notable_pairs":[]},"emergence":{"level":"...","indicators":[]},"concept_organic_bridges":"..."}`
  }),
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
  const [stats, setStats] = useState({ generation:0, total:0, concepts:0, organic:0, collisions:0, syntheses:0, avgResonance:0, resonantPairs:0, openPipes:0 });
  const [view, setView] = useState('field'); // field, entropy, resonance
  const [logs, setLogs] = useState([]);

  // Pipeline state
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
  const [showPipeline, setShowPipeline] = useState(false);

  // Analysis
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const addPipelineLog = useCallback((msg) => {
    setPipelineLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  // Init engine
  useEffect(() => {
    const engine = new CrucibleEngine();
    engineRef.current = engine;
    (async () => {
      try {
        const r = await window.storage.get('crucible-v1');
        if (r?.value) engine.deserialize(JSON.parse(r.value));
      } catch {}
      if (engine.glyphs.size === 0) engine.reset();
      setStats(engine.getStats());
      setLogs([...engine.eventLog]);
      setInitialized(true);
    })();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Run loop
  useEffect(() => {
    if (!initialized) return;
    if (running) {
      intervalRef.current = setInterval(() => {
        const e = engineRef.current;
        e.step();
        setStats(e.getStats());
        setLogs([...e.eventLog]);
      }, 180);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, initialized]);

  // Render loop (separate from sim for smoother visuals)
  const doRender = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const engine = engineRef.current;
    if (!canvas || !container || !engine) return;
    if (view === 'field') renderField(canvas, engine, container);
    else renderChart(canvas, engine, container, view);
    animRef.current = requestAnimationFrame(doRender);
  }, [view]);

  useEffect(() => {
    if (!initialized) return;
    animRef.current = requestAnimationFrame(doRender);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [initialized, doRender]);

  // Auto-save
  useEffect(() => {
    if (!initialized) return;
    const si = setInterval(async () => {
      try { await window.storage.set('crucible-v1', JSON.stringify(engineRef.current.serialize())); } catch {}
    }, 30000);
    return () => clearInterval(si);
  }, [initialized]);

  const doSave = async () => {
    try {
      await window.storage.set('crucible-v1', JSON.stringify(engineRef.current.serialize()));
      engineRef.current.log('💾 State saved', 'info');
      setLogs([...engineRef.current.eventLog]);
    } catch {}
  };

  const doReset = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    try { await window.storage.delete('crucible-v1'); } catch {}
    engineRef.current.reset();
    setStats(engineRef.current.getStats());
    setLogs([...engineRef.current.eventLog]);
    setResults({}); setAnalysisResult(null);
  };

  // Claude analysis of engine state
  const doAnalyze = async () => {
    setAnalysisLoading(true);
    const engine = engineRef.current;
    const summary = Array.from(engine.glyphs.values()).slice(-20).map(g => ({
      id: g.id, tags: g.tags, entropy: g.entropy, isConcept: g.isConcept,
      thermo: g.thermodynamicState ? { H: g.thermodynamicState.H, dH_dt: +g.thermodynamicState.dH_dt.toFixed(3), tau: +g.thermodynamicState.tau_coherence.toFixed(3), phi: +g.thermodynamicState.phi_phase.toFixed(3) } : null,
    }));
    const recent = engine.collisionLog.slice(-10).map(c => ({ parents: `${c.parentA}×${c.parentB}`, child: c.offspring, resonance: +c.resonance.toFixed(3), crossType: c.crossType }));
    try {
      const prompt = PROMPTS.crucible_analysis(summary, recent);
      const result = await callAPI(prompt.system, prompt.user, null);
      setAnalysisResult(result);
      engine.log('🧠 Crucible analysis complete', 'analysis');
    } catch (e) { console.warn(e); setAnalysisResult(null); }
    setAnalysisLoading(false);
    setLogs([...engine.eventLog]);
  };

  // Pipeline stage toggle
  const toggleStage = (id) => {
    setSelectedStages(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); resolveDependents(id).forEach(d => next.delete(d)); }
      else { resolveDeps(id).forEach(d => next.add(d)); }
      return next;
    });
  };

  // Run extraction pipeline + inject concepts
  const runPipeline = async () => {
    if (!input.trim()) return;
    setPipelineRunning(true); setPipelineError(null);
    setResults({}); setStatusTexts({}); setPipelineLog([]);
    const newStatus = {};
    STAGES.forEach(s => { newStatus[s.id] = selectedStages.has(s.id) ? 'idle' : 'skipped'; });
    setStageStatus(newStatus);
    addPipelineLog(`Pipeline initiated · depth=${depth} · primes: ${JSON.stringify(DEPTH_PRIMES[depth])}`);

    let concepts = null, taxonomy = null;
    const allResults = {};
    const makeStatus = (id) => (t) => setStatusTexts(p => ({ ...p, [id]: t }));

    try {
      // Stage 1: Extract
      if (selectedStages.has('dual_extract')) {
        setStageStatus(p => ({ ...p, dual_extract: 'running' }));
        addPipelineLog(`Extracting ${DEPTH_PRIMES[depth].concepts} concepts...`);
        const prompt = PROMPTS.dual_extract(input, depth);
        concepts = await callAPI(prompt.system, prompt.user, makeStatus('dual_extract'));
        allResults.concepts = concepts;
        setResults(p => ({ ...p, dual_extract: concepts }));
        setStageStatus(p => ({ ...p, dual_extract: 'complete' }));
        addPipelineLog(`✓ ${concepts.length} concepts extracted`);

        // INJECT INTO ENGINE
        const engine = engineRef.current;
        engine.triggerShockwave(engine.canvasW / 2, engine.canvasH / 2, '#daa520');
        for (const concept of concepts) {
          engine.injectConcept(concept);
        }
        engine.updateThermodynamics();
        engine.updateResonanceField();
        setStats(engine.getStats());
        setLogs([...engine.eventLog]);
        addPipelineLog(`⚗️ ${concepts.length} concepts injected into crucible`);
      }

      // Stage 2: Elaborate
      if (selectedStages.has('triple_mode') && concepts) {
        setStageStatus(p => ({ ...p, triple_mode: 'running' }));
        addPipelineLog('Elaborating concepts...');
        const prompt = PROMPTS.triple_mode(input, concepts);
        const elab = await callAPI(prompt.system, prompt.user, makeStatus('triple_mode'));
        allResults.elaborations = elab;
        setResults(p => ({ ...p, triple_mode: elab }));
        setStageStatus(p => ({ ...p, triple_mode: 'complete' }));
        addPipelineLog(`✓ ${elab.length} elaborations`);
      } else if (selectedStages.has('triple_mode')) {
        setStageStatus(p => ({ ...p, triple_mode: 'skipped' }));
      }

      // Stage 3: Taxonomy
      if (selectedStages.has('semantic_index') && concepts) {
        setStageStatus(p => ({ ...p, semantic_index: 'running' }));
        addPipelineLog('Building taxonomy...');
        const prompt = PROMPTS.semantic_index(input, concepts, depth);
        taxonomy = await callAPI(prompt.system, prompt.user, makeStatus('semantic_index'));
        allResults.taxonomy = taxonomy;
        setResults(p => ({ ...p, semantic_index: taxonomy }));
        setStageStatus(p => ({ ...p, semantic_index: 'complete' }));
        addPipelineLog(`✓ ${taxonomy.terms?.length || 0} terms, ${taxonomy.clusters?.length || 0} clusters`);
      } else if (selectedStages.has('semantic_index')) {
        setStageStatus(p => ({ ...p, semantic_index: 'skipped' }));
      }

      // Stage 4: Compress/Expand
      if (selectedStages.has('compress_expand') && concepts) {
        setStageStatus(p => ({ ...p, compress_expand: 'running' }));
        addPipelineLog('Compressing + expanding...');
        const prompt = PROMPTS.compress_expand(input, concepts, taxonomy, depth);
        const comp = await callAPI(prompt.system, prompt.user, makeStatus('compress_expand'));
        allResults.compression = comp;
        setResults(p => ({ ...p, compress_expand: comp }));
        setStageStatus(p => ({ ...p, compress_expand: 'complete' }));
        addPipelineLog(`✓ Thesis + ${comp.glossary?.length || 0} glossary entries`);
      } else if (selectedStages.has('compress_expand')) {
        setStageStatus(p => ({ ...p, compress_expand: 'skipped' }));
      }

      // Stage 5: Meta-analysis (with engine stats)
      if (selectedStages.has('meta_analysis')) {
        setStageStatus(p => ({ ...p, meta_analysis: 'running' }));
        addPipelineLog('Running meta-analysis...');
        const prompt = PROMPTS.meta_analysis(input, allResults, depth, engineRef.current.getStats());
        const meta = await callAPI(prompt.system, prompt.user, makeStatus('meta_analysis'));
        allResults.meta = meta;
        setResults(p => ({ ...p, meta_analysis: meta }));
        setStageStatus(p => ({ ...p, meta_analysis: 'complete' }));
        addPipelineLog('✓ Meta-analysis complete');
      }

      addPipelineLog('Pipeline complete ✓');
    } catch (err) {
      setPipelineError(err.message);
      addPipelineLog(`ERROR: ${err.message}`);
      STAGES.forEach(s => { setStageStatus(p => p[s.id] === 'running' ? { ...p, [s.id]: 'error' } : p); });
    }
    setPipelineRunning(false);
  };

  if (!initialized) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a0908', fontFamily:'monospace', color:'#daa520' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚗️</div>
        <div style={{ fontSize:11, letterSpacing:'0.2em' }}>INITIALIZING CRUCIBLE</div>
      </div>
    </div>
  );

  const S = (label, val, color = '#daa520') => (
    <div style={{ textAlign:'center', padding:'3px 0' }}>
      <div style={{ fontSize:7, color:'#444', letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:'bold', color, fontFamily:'monospace' }}>{val}</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Courier New', monospace", background:'#0a0908', color:'#c8b898', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {/* ─── HEADER ─── */}
      <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid rgba(218,165,32,0.15)' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:14, fontWeight:'bold', color:'#daa520', textShadow:'0 0 12px rgba(218,165,32,0.3)' }}>⚗️ THE CRUCIBLE</span>
          <span style={{ fontSize:8, color:'#444', letterSpacing:'0.15em' }}>GLYPH ENGINE × PHILOSOPHER'S STONE</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:3 }}>
          {S('GEN', stats.generation)}
          {S('ORGANIC', stats.organic, '#00ff00')}
          {S('CONCEPT', stats.concepts, '#daa520')}
          {S('COLLISIONS', stats.collisions, '#ff8800')}
          {S('SYNTHESES', stats.syntheses, '#b4c864')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:3, marginTop:3 }}>
          {S('RES PAIRS', stats.resonantPairs, '#00aaff')}
          {S('PIPES', stats.openPipes, '#ff8800')}
          {S('AVG RES', stats.avgResonance.toFixed(3), '#00aaff')}
          {S('TOTAL', stats.total)}
        </div>
      </div>

      {/* ─── CANVAS + CONTROLS ─── */}
      <div style={{ padding:'6px 10px' }}>
        {/* View tabs */}
        <div style={{ display:'flex', gap:3, marginBottom:4 }}>
          {[['field','⬡ Field'],['entropy','📈 Entropy'],['resonance','〰 Resonance']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              flex:1, padding:'6px 4px', fontSize:9, fontWeight:'bold', fontFamily:'monospace',
              background: view === v ? 'rgba(218,165,32,0.12)' : '#0f0e0b',
              border: `1px solid ${view === v ? 'rgba(218,165,32,0.3)' : '#1a1810'}`,
              borderRadius:3, color: view === v ? '#daa520' : '#555', cursor:'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* Canvas */}
        <div ref={containerRef} style={{ background:'#0a0908', border:'1px solid #1a1810', borderRadius:4, overflow:'hidden', height:'min(45vh, 320px)', width:'100%' }}>
          <canvas ref={canvasRef} style={{ display:'block' }} />
        </div>

        {/* Engine controls */}
        <div style={{ display:'flex', gap:3, marginTop:4 }}>
          <Btn onClick={() => { setRunning(true); engineRef.current.log('▶ Started','info'); setLogs([...engineRef.current.eventLog]); }} disabled={running} style={{ flex:1, opacity:running?0.4:1 }}>▶ RUN</Btn>
          <Btn onClick={() => { setRunning(false); engineRef.current.log('⏸ Paused','info'); setLogs([...engineRef.current.eventLog]); }} disabled={!running} style={{ flex:1, opacity:!running?0.4:1 }}>⏸ PAUSE</Btn>
          <Btn onClick={doAnalyze} disabled={analysisLoading} style={{ flex:1.2, borderColor:'#00aaff33', color:'#00aaff' }}>
            {analysisLoading ? '⏳...' : '🧠 ANALYZE'}
          </Btn>
          <Btn onClick={doSave} style={{ flex:0.5 }}>💾</Btn>
          <Btn onClick={doReset} style={{ flex:0.5, color:'#555' }}>↺</Btn>
        </div>
      </div>

      {/* ─── ANALYSIS PANEL ─── */}
      {analysisResult && (
        <div style={{ margin:'0 10px', padding:10, background:'#0f0e0b', border:'1px solid rgba(0,170,255,0.15)', borderRadius:4, maxHeight:200, overflow:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontSize:9, color:'#00aaff', letterSpacing:'0.12em', fontWeight:'bold' }}>CRUCIBLE ANALYSIS</span>
            <button onClick={() => setAnalysisResult(null)} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:12 }}>✕</button>
          </div>
          {analysisResult.patterns?.map((p, i) => (
            <div key={i} style={{ marginBottom:4, fontSize:10, lineHeight:1.4 }}>
              <span style={{ color:'#daa520', fontWeight:'bold' }}>{p.name}</span>
              <span style={{ color:'#888' }}> — {p.description}</span>
            </div>
          ))}
          {analysisResult.emergence && (
            <div style={{ marginTop:6, fontSize:10, color:'#00ff00' }}>
              Emergence: <strong>{analysisResult.emergence.level}</strong>
              {analysisResult.emergence.indicators?.map((ind, i) => (
                <div key={i} style={{ color:'#888', marginLeft:8 }}>→ {typeof ind === 'string' ? ind : JSON.stringify(ind)}</div>
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

      {/* ─── PHILOSOPHER'S STONE PIPELINE ─── */}
      <div style={{ padding:'8px 10px 0' }}>
        <button onClick={() => setShowPipeline(!showPipeline)} style={{
          width:'100%', padding:'10px 14px', background: showPipeline ? 'rgba(218,165,32,0.08)' : '#0f0e0b',
          border:`1px solid ${showPipeline ? 'rgba(218,165,32,0.2)' : '#1a1810'}`,
          borderRadius:4, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ fontSize:11, color:'#daa520', fontWeight:'bold', letterSpacing:'0.08em' }}>
            ⚗️ PHILOSOPHER'S STONE — Extraction Pipeline
          </span>
          <span style={{ fontSize:10, color:'#555', transform: showPipeline ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▼</span>
        </button>
      </div>

      {showPipeline && (
        <div style={{ padding:'8px 10px 20px' }}>
          {/* Source text */}
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder="Paste text to extract, analyze, and inject into the crucible..."
            style={{ width:'100%', height:100, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(218,165,32,0.1)', borderRadius:4, color:'#c8b898', fontFamily:'monospace', fontSize:11, padding:'8px 10px', resize:'vertical', lineHeight:1.5, outline:'none', boxSizing:'border-box' }}
          />
          <div style={{ fontSize:8, color:'#333', fontFamily:'monospace', textAlign:'right', marginTop:2 }}>{input.length} chars</div>

          {/* Depth + stages */}
          <div style={{ display:'flex', gap:8, margin:'8px 0', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 150px' }}>
              <div style={{ fontSize:8, color:'#daa520', letterSpacing:'0.15em', marginBottom:4 }}>DEPTH</div>
              <div style={{ display:'flex', gap:3 }}>
                {['shallow','medium','deep'].map(d => (
                  <button key={d} onClick={() => setDepth(d)} style={{
                    flex:1, padding:'5px 3px', fontSize:9, fontFamily:'monospace',
                    background: depth === d ? 'rgba(218,165,32,0.15)' : 'rgba(255,255,255,0.02)',
                    border:`1px solid ${depth === d ? 'rgba(218,165,32,0.3)' : '#1a1810'}`,
                    borderRadius:3, color: depth === d ? '#daa520' : '#555', cursor:'pointer', textTransform:'uppercase',
                  }}>{d}<div style={{ fontSize:7, color: depth === d ? '#8B6914' : '#333' }}>{DEPTH_PRIMES[d].concepts}p</div></button>
                ))}
              </div>
            </div>
            <div style={{ flex:'1 1 120px' }}>
              <div style={{ fontSize:8, color:'#daa520', letterSpacing:'0.15em', marginBottom:4 }}>STAGES</div>
              <div style={{ display:'flex', gap:3 }}>
                {STAGES.map(s => (
                  <button key={s.id} onClick={() => !pipelineRunning && toggleStage(s.id)} style={{
                    padding:'5px 8px', fontSize:12,
                    background: selectedStages.has(s.id) ? 'rgba(218,165,32,0.1)' : 'rgba(255,255,255,0.01)',
                    border:`1px solid ${selectedStages.has(s.id) ? 'rgba(218,165,32,0.2)' : '#1a1810'}`,
                    borderRadius:3, cursor: pipelineRunning ? 'default' : 'pointer',
                  }}>{s.icon}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Run button */}
          <button onClick={runPipeline} disabled={pipelineRunning || !input.trim()} style={{
            width:'100%', padding:'11px', marginBottom:8,
            background: pipelineRunning ? 'rgba(218,165,32,0.1)' : input.trim() ? 'linear-gradient(135deg, #8B6914, #daa520)' : 'rgba(255,255,255,0.03)',
            border:'none', borderRadius:4, color: pipelineRunning ? '#daa520' : input.trim() ? '#0a0908' : '#444',
            fontSize:11, fontFamily:'monospace', fontWeight:'bold', letterSpacing:'0.1em', cursor: pipelineRunning || !input.trim() ? 'default' : 'pointer',
          }}>
            {pipelineRunning ? '⟳ TRANSMUTING...' : '⚗️ EXTRACT + INJECT'}
          </button>

          {pipelineError && <div style={{ padding:'8px 10px', background:'rgba(220,50,50,0.1)', border:'1px solid rgba(220,50,50,0.2)', borderRadius:4, color:'#dc6464', fontSize:10, marginBottom:8 }}>{pipelineError}</div>}

          {/* Stage results (collapsible) */}
          {STAGES.map(stage => {
            const status = stageStatus[stage.id] || 'idle';
            const result = results[stage.id];
            const isOpen = expandedStage === stage.id;
            const statusText = statusTexts[stage.id];

            const statusColors = { idle:'#333', running:'#daa520', complete:'#50c878', error:'#dc3232', skipped:'#222' };
            return (
              <div key={stage.id} style={{ marginBottom:3 }}>
                <div onClick={() => status === 'complete' && setExpandedStage(isOpen ? null : stage.id)} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px',
                  background: isOpen ? 'rgba(218,165,32,0.06)' : status === 'running' ? 'rgba(218,165,32,0.03)' : '#0f0e0b',
                  border:`1px solid ${isOpen ? 'rgba(218,165,32,0.15)' : '#1a1810'}`,
                  borderRadius: isOpen ? '4px 4px 0 0' : 4, cursor: status === 'complete' ? 'pointer' : 'default',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:12 }}>{stage.icon}</span>
                    <span style={{ fontSize:10, color: status === 'complete' || status === 'running' ? '#c8b898' : '#444', fontWeight:'bold' }}>{stage.name}</span>
                  </div>
                  <span style={{ fontSize:8, color: statusColors[status], fontFamily:'monospace', fontWeight:'bold', letterSpacing:'0.08em' }}>
                    {status === 'running' ? (statusText || '⟳') : status.toUpperCase()}
                  </span>
                </div>

                {isOpen && result && (
                  <div style={{ padding:'10px 12px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(218,165,32,0.15)', borderTop:'none', borderRadius:'0 0 4px 4px', maxHeight:300, overflow:'auto' }}>
                    {stage.id === 'dual_extract' && Array.isArray(result) && result.map((c, i) => (
                      <div key={i} style={{ marginBottom:6, padding:'6px 8px', background:'rgba(218,165,32,0.03)', borderRadius:3, borderLeft:'2px solid rgba(218,165,32,0.2)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                          <span style={{ fontSize:9, color:'#daa520', fontFamily:'monospace' }}>#{c.id}</span>
                          <span style={{ fontSize:8, color:'#daa520', fontFamily:'monospace' }}>{(c.confidence*100).toFixed(0)}%</span>
                        </div>
                        <div style={{ fontSize:10, color:'#c8b898', lineHeight:1.4, marginBottom:2 }}>{c.technical}</div>
                        <div style={{ fontSize:9, color:'#666', lineHeight:1.3 }}>{c.plain}</div>
                        {c.keywords && <div style={{ display:'flex', gap:3, marginTop:3, flexWrap:'wrap' }}>
                          {c.keywords.map((k,j) => <span key={j} style={{ padding:'1px 5px', fontSize:8, background:'rgba(218,165,32,0.06)', borderRadius:2, color:'#888' }}>{k}</span>)}
                        </div>}
                      </div>
                    ))}

                    {stage.id === 'triple_mode' && Array.isArray(result) && result.map((e, i) => (
                      <div key={i} style={{ marginBottom:6, padding:'6px 8px', background:'rgba(0,0,0,0.2)', borderRadius:3 }}>
                        <div style={{ fontSize:8, color:'#daa520', fontFamily:'monospace', marginBottom:3 }}>Concept #{e.concept_id}</div>
                        <pre style={{ background:'rgba(0,0,0,0.3)', padding:'6px', borderRadius:3, fontSize:9, color:'#a09080', fontFamily:'monospace', margin:'3px 0', whiteSpace:'pre-wrap', overflow:'auto' }}>{(e.code||'').replace(/\\n/g,'\n')}</pre>
                        <div style={{ fontSize:9, color:'#888', fontStyle:'italic', marginBottom:2 }}>{e.analogy}</div>
                        <div style={{ fontSize:9, color:'#c8b898', fontWeight:'bold' }}>{e.insight}</div>
                      </div>
                    ))}

                    {stage.id === 'semantic_index' && result && (
                      <div>
                        {result.clusters?.map((cl, i) => (
                          <div key={i} style={{ marginBottom:4, padding:'6px 8px', background:'rgba(218,165,32,0.04)', borderRadius:3 }}>
                            <div style={{ fontSize:10, color:'#daa520', fontWeight:'bold' }}>{cl.label}</div>
                            <div style={{ fontSize:9, color:'#777' }}>{cl.theme}</div>
                            <div style={{ fontSize:8, color:'#444', fontFamily:'monospace' }}>IDs: {cl.concept_ids?.join(', ')}</div>
                          </div>
                        ))}
                        {result.terms?.map((t, i) => (
                          <div key={i} style={{ display:'flex', gap:6, padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,0.02)', alignItems:'baseline' }}>
                            <span style={{ fontSize:10, color:'#daa520', fontWeight:'bold', minWidth:80 }}>{t.term}</span>
                            <span style={{ fontSize:9, color:'#666', flex:1 }}>{t.definition}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {stage.id === 'compress_expand' && result && (
                      <div>
                        {result.core_thesis && (
                          <div style={{ padding:'8px 10px', background:'rgba(218,165,32,0.05)', borderRadius:4, marginBottom:8, border:'1px solid rgba(218,165,32,0.1)' }}>
                            <div style={{ fontSize:8, color:'#daa520', letterSpacing:'0.12em', marginBottom:4 }}>CORE THESIS</div>
                            <div style={{ fontSize:11, color:'#c8b898', lineHeight:1.5 }}>{result.core_thesis}</div>
                          </div>
                        )}
                        {result.glossary?.map((g, i) => (
                          <div key={i} style={{ padding:'4px 8px', background: i%2===0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderRadius:2 }}>
                            <span style={{ fontSize:10, color:'#daa520', fontWeight:'bold' }}>{g.term}</span>
                            <span style={{ fontSize:9, color:'#666', marginLeft:6 }}>{g.definition}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {stage.id === 'meta_analysis' && result && (
                      <div>
                        {result.complexity_profile && Object.entries(result.complexity_profile).map(([k, v]) => (
                          <div key={k} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                            <span style={{ fontSize:8, color:'#555', width:100, textTransform:'uppercase' }}>{k.replace(/_/g,' ')}</span>
                            <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${Math.min(1,parseFloat(v)||0)*100}%`, background:'linear-gradient(90deg,#8B6914,#daa520)', borderRadius:2 }} />
                            </div>
                            <span style={{ fontSize:9, color:'#daa520', fontFamily:'monospace', width:32 }}>{((parseFloat(v)||0)*100).toFixed(0)}%</span>
                          </div>
                        ))}
                        {result.information_topology && <div style={{ marginTop:6, fontSize:10, color:'#888' }}>Topology: {typeof result.information_topology === 'string' ? result.information_topology : JSON.stringify(result.information_topology)}</div>}
                        {result.emergence_assessment && <div style={{ marginTop:4, fontSize:10, color:'#00ff00' }}>Emergence: {result.emergence_assessment}</div>}
                        {result.blind_spots && <div style={{ marginTop:4, fontSize:10, color:'#dc6464' }}>Blind spots: {Array.isArray(result.blind_spots) ? result.blind_spots.join(' · ') : result.blind_spots}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pipeline log */}
          {pipelineLog.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:8, color:'#333', letterSpacing:'0.12em', marginBottom:4 }}>PIPELINE LOG</div>
              <div style={{ maxHeight:100, overflow:'auto', padding:'6px 8px', background:'rgba(0,0,0,0.2)', borderRadius:4, border:'1px solid #1a1810' }}>
                {pipelineLog.map((l, i) => (
                  <div key={i} style={{ fontSize:9, color:'#444', lineHeight:1.6, fontFamily:'monospace' }}>
                    <span style={{ color:'#2a2a1a' }}>{l.time}</span> {l.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── EVENT LOG ─── */}
      <div style={{ padding:'0 10px 12px' }}>
        <div style={{ fontSize:8, color:'#333', letterSpacing:'0.12em', marginBottom:4 }}>ENGINE LOG</div>
        <div style={{ maxHeight:120, overflow:'auto', padding:'6px 8px', background:'#0f0e0b', borderRadius:4, border:'1px solid #1a1810' }}>
          {logs.length === 0 && <div style={{ color:'#222', fontSize:9 }}>No events.</div>}
          {logs.slice(0, 20).map((log, i) => {
            const colors = { collision:'#ff8800', resonance:'#00aaff', concept:'#daa520', synthesis:'#b4c864', analysis:'#ff44cc', info:'#00ff00' };
            return (
              <div key={i} style={{ padding:'2px 0', borderLeft:`2px solid ${colors[log.type] || '#333'}`, paddingLeft:6, marginBottom:1 }}>
                <span style={{ fontSize:8, color:'#2a2a1a', fontFamily:'monospace' }}>g{log.gen} </span>
                <span style={{ fontSize:9, color:'#888' }}>{log.msg}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ padding:'6px 10px 12px', fontSize:8, color:'#1a1810', textAlign:'center', borderTop:'1px solid #111' }}>
        Beacon Glyph Engine v5 × Philosopher's Stone v2 — The Crucible
      </div>
    </div>
  );
};

function Btn({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'8px 5px', fontSize:9, fontWeight:'bold', fontFamily:'monospace',
      border:'1px solid #1a1810', borderRadius:3, background:'#0f0e0b',
      color:'#daa520', cursor: disabled ? 'not-allowed' : 'pointer',
      letterSpacing:'0.05em', ...style,
    }}>{children}</button>
  );
}

export default TheCrucible;
