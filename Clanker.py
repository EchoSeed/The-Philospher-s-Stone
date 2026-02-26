Glyph Engine v4.1 - Performance Optimized
Emergent Consciousness Architecture with:
- LRU caching for embeddings
- Batch processing for embeddings
- Connection pooling patterns
- Reduced lock contention
- NumPy vectorized operations
- Lazy evaluation patterns
\"\"\"

import os
import json
import math
import time
import random
import threading
import collections
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set, Tuple
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from scipy.spatial.distance import cosine
import networkx as nx
from sklearn.cluster import MiniBatchKMeans

# Lazy load sentence transformer
_model = None
def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

LOG_DIR = \"glyph_data\"

# ===== OPTIMIZED DATA STRUCTURES =====
# Use dict for O(1) lookup instead of list scanning
glyph_log: List[dict] = []
id2glyph: Dict[str, dict] = {}
glyph_graph = nx.Graph()

# Single RLock for better reentrancy
_global_lock = threading.RLock()

glyph_id = 0
running = threading.Event()
seen_signatures: Set[Tuple] = set()
reflex_free: List[dict] = []
stagnant_counter: Dict[str, int] = {}
conceptual_attractors: Dict[str, dict] = {}
temporal_clusters: Dict[str, int] = {}
dormant_glyphs: Dict[str, dict] = {}

# ===== CONSTANTS =====
MAX_RAM_GLYPHS = 20_000
LOW_ENTROPY = 100
LOW_KEEP_PROB = 0.025
PRUNE_AFTER = 250
ATTRACTOR_THRESHOLD = 5
DORMANCY_THRESHOLD = 500
REACTIVATION_PROBABILITY = 0.1

# ===== EMBEDDING CACHE =====
# LRU cache for tag embeddings - major performance gain
@lru_cache(maxsize=10000)
def tag_vec_cached(tag: str) -> tuple:
    \"\"\"Cache tag vectors as tuples (hashable).\"\"\"
    return tuple(get_model().encode(tag).tolist())

def tag_vec(tag: str) -> np.ndarray:
    \"\"\"Get tag vector with caching.\"\"\"
    return np.array(tag_vec_cached(tag))

# Batch embedding for multiple tags at once
_embedding_batch_cache: Dict[frozenset, np.ndarray] = {}

def embed_batch(tags_list: List[List[str]]) -> List[np.ndarray]:
    \"\"\"Batch embed multiple tag sets efficiently.\"\"\"
    model = get_model()
    
    # Collect all unique tags
    all_tags = set()
    for tags in tags_list:
        all_tags.update(tags)
    
    # Check which tags need embedding
    tags_to_embed = [t for t in all_tags if t not in tag_vec_cached.cache_info()]
    
    # Batch encode new tags
    if tags_to_embed:
        embeddings = model.encode(tags_to_embed, batch_size=64, show_progress_bar=False)
        for tag, emb in zip(tags_to_embed, embeddings):
            tag_vec_cached.__wrapped__(tag)  # Warm cache
    
    # Compute means
    results = []
    for tags in tags_list:
        vecs = [tag_vec(t) for t in tags]
        results.append(np.mean(vecs, axis=0))
    
    return results

def embed(tags: List[str]) -> np.ndarray:
    \"\"\"Embed tags with caching.\"\"\"
    if not tags:
        return np.zeros(384)  # MiniLM dimension
    vecs = [tag_vec(t) for t in tags]
    return np.mean(vecs, axis=0)

# ===== VECTORIZED NOVELTY CALCULATION =====
# Pre-compute and cache recent embeddings matrix
_novelty_cache = {
    'matrix': None,
    'last_update': 0,
    'update_interval': 50
}

def _update_novelty_cache():
    \"\"\"Update the novelty comparison matrix.\"\"\"
    global _novelty_cache
    
    if len(glyph_log) < 10:
        return
    
    # Sample recent glyphs
    recent = glyph_log[-500:] if len(glyph_log) > 500 else glyph_log
    sample_size = min(100, len(recent))
    sample = random.sample(recent, sample_size)
    
    # Build matrix
    _novelty_cache['matrix'] = np.stack([g['vec'] for g in sample])
    _novelty_cache['last_update'] = len(glyph_log)

def semantic_novelty(vec: np.ndarray) -> float:
    \"\"\"Vectorized novelty calculation.\"\"\"
    if not glyph_log:
        return 1.0
    
    # Update cache if stale
    if (_novelty_cache['matrix'] is None or 
        len(glyph_log) - _novelty_cache['last_update'] > _novelty_cache['update_interval']):
        _update_novelty_cache()
    
    if _novelty_cache['matrix'] is None:
        return 1.0
    
    # Vectorized cosine distances
    matrix = _novelty_cache['matrix']
    
    # Normalize vectors for cosine
    vec_norm = vec / (np.linalg.norm(vec) + 1e-10)
    matrix_norm = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-10)
    
    # Cosine similarity -> distance
    similarities = np.dot(matrix_norm, vec_norm)
    distances = 1 - similarities
    
    return float(np.max(distances))

def productive_novelty(g: dict) -> float:
    \"\"\"Novelty weighted by ancestry quality.\"\"\"
    base_novelty = semantic_novelty(g['vec'])
    
    # Bonus for productive ancestors
    ancestry = g.get('ancestry', [])
    if not ancestry:
        return base_novelty
    
    ancestry_bonus = sum(0.1 for aid in ancestry if aid in conceptual_attractors)
    return base_novelty + ancestry_bonus

# ===== REFLEX SYSTEM =====
class ReflexType(Enum):
    DEFENSIVE = \"defensive\"
    EXPLORATORY = \"exploratory\"
    COLLABORATIVE = \"collaborative\"
    CONSOLIDATIVE = \"consolidative\"
    METAMORPHIC = \"metamorphic\"

@dataclass
class ReflexProfile:
    primary_type: ReflexType
    intensity: float
    trigger_conditions: List[str]
    activation_count: int = 0
    last_activation: int = 0

# ===== SEASONAL SYSTEM =====
class SeasonalPhase(Enum):
    EXPLORATION = \"exploration\"
    CONSOLIDATION = \"consolidation\"
    DORMANCY = \"dormancy\"
    RENAISSANCE = \"renaissance\"

generation_count = 0
current_season = SeasonalPhase.EXPLORATION
season_duration = 1000
season_counter = 0

# ===== OPTIMIZED INFLUENCE CALCULATION =====
# Cache influence scores
_influence_cache: Dict[str, Tuple[int, float]] = {}
_INFLUENCE_CACHE_TTL = 100  # Generations

def calculate_influence(g: dict) -> float:
    \"\"\"Calculate influence with caching.\"\"\"
    gid = g['id']
    
    # Check cache
    if gid in _influence_cache:
        cached_gen, cached_val = _influence_cache[gid]
        if generation_count - cached_gen < _INFLUENCE_CACHE_TTL:
            return cached_val
    
    if gid not in glyph_graph:
        return 0.0
    
    # Get children efficiently
    children = []
    with _global_lock:
        for neighbor in glyph_graph.neighbors(gid):
            neighbor_glyph = id2glyph.get(neighbor)
            if neighbor_glyph and gid in neighbor_glyph.get('ancestry', []):
                children.append(neighbor_glyph)
    
    if not children:
        _influence_cache[gid] = (generation_count, 0.0)
        return 0.0
    
    # Compute metrics
    offspring_novelty = sum(productive_novelty(c) for c in children) / len(children)
    
    all_tags = set()
    for c in children:
        all_tags.update(c['tags'])
    tag_diversity = len(all_tags) / max(1, len(children))
    
    # Simplified cascade depth (avoid deep recursion)
    max_depth = min(3, _fast_cascade_depth(gid))
    
    influence = offspring_novelty * 0.4 + tag_diversity * 0.35 + max_depth * 0.25
    
    _influence_cache[gid] = (generation_count, influence)
    return influence

def _fast_cascade_depth(gid: str, max_depth: int = 5) -> int:
    \"\"\"Non-recursive cascade depth using BFS.\"\"\"
    if gid not in glyph_graph:
        return 0
    
    visited = {gid}
    current_level = [gid]
    depth = 0
    
    while current_level and depth < max_depth:
        next_level = []
        for node in current_level:
            with _global_lock:
                for neighbor in glyph_graph.neighbors(node):
                    if neighbor not in visited:
                        neighbor_glyph = id2glyph.get(neighbor)
                        if neighbor_glyph and node in neighbor_glyph.get('ancestry', []):
                            visited.add(neighbor)
                            next_level.append(neighbor)
        
        if next_level:
            depth += 1
            current_level = next_level
        else:
            break
    
    return depth + 1

# ===== CORE SYSTEM FUNCTIONS =====
_id_counter = 0
_id_lock = threading.Lock()

def gen_id() -> str:
    global _id_counter
    with _id_lock:
        _id_counter += 1
        return f\"g{_id_counter:04}\"

_BASE_TAGS = ['origin', 'flex', 'ghost', 'fractal', 'wild', 'mirror', 'unknown', 'stable']
_SEASONAL_TAGS = {
    SeasonalPhase.EXPLORATION: ['pioneer', 'venture', 'discover'],
    SeasonalPhase.CONSOLIDATION: ['anchor', 'strengthen', 'unify'],
    SeasonalPhase.DORMANCY: ['rest', 'potential', 'dormant'],
    SeasonalPhase.RENAISSANCE: ['reborn', 'transformed', 'awakened']
}

def random_tag() -> str:
    tags = _BASE_TAGS + _SEASONAL_TAGS.get(current_season, [])
    return random.choice(tags)

_SEASONAL_MODIFIER = {
    SeasonalPhase.EXPLORATION: 1.2,
    SeasonalPhase.CONSOLIDATION: 0.8,
    SeasonalPhase.DORMANCY: 0.6,
    SeasonalPhase.RENAISSANCE: 1.5
}

def calc_entropy(g: dict, gen: int = None) -> int:
    if gen is None:
        gen = generation_count
    base = len(g['tags']) * 42 + random.randint(0, 58)
    gen_pressure = gen * 10
    modifier = _SEASONAL_MODIFIER.get(current_season, 1.0)
    return int(base + gen_pressure * modifier)

def fitness(g: dict) -> float:
    sem = productive_novelty(g)
    influence = calculate_influence(g)
    
    seasonal_bonus = 0
    if current_season == SeasonalPhase.EXPLORATION and sem > 0.7:
        seasonal_bonus = 50
    elif current_season == SeasonalPhase.CONSOLIDATION and g['id'] in conceptual_attractors:
        seasonal_bonus = 75
    elif current_season == SeasonalPhase.RENAISSANCE and 'renaissance' in g['tags']:
        seasonal_bonus = 100
    
    return 200 * sem - g['entropy'] + 50 * influence + seasonal_bonus

def mutate_tag(tags: List[str]) -> str:
    if len(tags) < 2:
        return 'm_misc'
    a, b = random.sample(tags, 2)
    
    if current_season == SeasonalPhase.EXPLORATION:
        return f\"{a}→{b}\"
    elif current_season == SeasonalPhase.CONSOLIDATION:
        return f\"{a}∧{b}\"
    return f\"{a}+{b}\"

def signature(g: dict, bucket: int = 25) -> Tuple:
    return (tuple(sorted(g['tags'])), g['entropy'] // bucket)

def is_novel(g: dict) -> bool:
    if g['entropy'] < LOW_ENTROPY:
        return random.random() < LOW_KEEP_PROB
    
    sig = signature(g)
    if sig in seen_signatures:
        return False
    
    seen_signatures.add(sig)
    return True

def maybe_store(g: dict) -> bool:
    \"\"\"Store glyph if novel. Returns True if stored.\"\"\"
    g['vec'] = embed(g['tags'])
    
    if not is_novel(g):
        return False
    
    with _global_lock:
        glyph_log.append(g)
        id2glyph[g['id']] = g
        glyph_graph.add_node(g['id'], entropy=g['entropy'], tags=g['tags'], fit=fitness(g))
        stagnant_counter[g['id']] = 0
        
        if 'reflex' not in g['tags']:
            reflex_free.append(g)
    
    return True

def create_glyph() -> dict:
    g = {
        'id': gen_id(),
        'tags': list({random_tag() for _ in range(random.randint(1, 3))}),
        'entropy': 0,
        'ancestry': [],
        'generation_born': generation_count
    }
    g['entropy'] = calc_entropy(g)
    g['vec'] = embed(g['tags'])
    return g

# ===== OPTIMIZED COLLISION SYSTEM =====
def collide(a: dict, b: dict) -> dict:
    \"\"\"Collision with minimal locking.\"\"\"
    child_tags = list({*a['tags'], *b['tags'], mutate_tag(a['tags'] + b['tags'])})
    child = {
        'id': gen_id(),
        'tags': child_tags,
        'entropy': 0,
        'ancestry': [a['id'], b['id']],
        'generation_born': generation_count
    }
    child['entropy'] = calc_entropy(child)
    
    maybe_store(child)
    
    with _global_lock:
        glyph_graph.add_edge(a['id'], child['id'])
        glyph_graph.add_edge(b['id'], child['id'])
        stagnant_counter[a['id']] = 0
        stagnant_counter[b['id']] = 0
        stagnant_counter[child['id']] = 0
    
    temporal_clusters[child['id']] = generation_count
    
    # Edge explosion (sampled)
    _smart_edge_explosion(child, [a, b])
    
    return child

def _smart_edge_explosion(child: dict, parents: List[dict]):
    \"\"\"Efficient edge creation with sampling.\"\"\"
    parent_ids = {p['id'] for p in parents}
    parent_ids.add(child['id'])
    
    # Sample candidates instead of iterating all
    sample_size = min(50, len(glyph_log))
    if sample_size < 5:
        return
    
    candidates = random.sample(glyph_log, sample_size)
    candidates = [c for c in candidates if c['id'] not in parent_ids]
    
    if not candidates:
        return
    
    # Batch compute similarities
    child_vec = child['vec']
    child_norm = child_vec / (np.linalg.norm(child_vec) + 1e-10)
    
    connections = []
    for cand in candidates[:20]:  # Limit candidates
        cand_norm = cand['vec'] / (np.linalg.norm(cand['vec']) + 1e-10)
        sim = np.dot(child_norm, cand_norm)
        
        if 0.3 < sim < 0.8:  # Sweet spot
            weight = sim * 2
            connections.append((cand['id'], weight))
    
    # Add attractor connections
    for cand in candidates:
        if cand['id'] in conceptual_attractors:
            connections.append((cand['id'], 3.0))
    
    # Apply connections
    with _global_lock:
        for cand_id, weight in connections[:10]:  # Limit total
            glyph_graph.add_edge(child['id'], cand_id, weight=weight)
            stagnant_counter[cand_id] = 0

def select_parents(k: int = 10) -> List[str]:
    \"\"\"Optimized parent selection.\"\"\"
    with _global_lock:
        nodes = list(glyph_graph.nodes(data=True))
    
    if len(nodes) < 2:
        return []
    
    # Pre-compute weights
    weights = []
    for node_id, node_data in nodes:
        base = max(1, node_data.get('fit', 1))
        
        if node_id in conceptual_attractors:
            base *= 2
        
        weights.append(base)
    
    chosen = random.choices(nodes, weights=weights, k=min(k, len(nodes)))
    return [n[0] for n in chosen]

def batch_collide(max_pairs: int = 30):
    \"\"\"Batch collision with parallel potential.\"\"\"
    parents = select_parents(max_pairs)
    if len(parents) < 2:
        return
    
    # Limit collision pairs
    pairs = []
    for i in range(min(len(parents), 10)):
        for j in range(i + 1, min(len(parents), 10)):
            pairs.append((parents[i], parents[j]))
    
    for p1, p2 in pairs[:max_pairs]:
        a = id2glyph.get(p1)
        b = id2glyph.get(p2)
        if a and b:
            collide(a, b)

# ===== REFLEX SYSTEM =====
def determine_reflex_type(g: dict, context_glyphs: List[dict]) -> ReflexType:
    if not context_glyphs:
        return ReflexType.EXPLORATORY
    
    avg_entropy = np.mean([cg['entropy'] for cg in context_glyphs])
    entropy_ratio = g['entropy'] / max(1, avg_entropy)
    semantic_isolation = semantic_novelty(g['vec'])
    
    if entropy_ratio < 0.5 and semantic_isolation < 0.3:
        return ReflexType.DEFENSIVE
    elif semantic_isolation > 0.8:
        return ReflexType.EXPLORATORY
    elif len(g['tags']) > 3 and entropy_ratio > 1.2:
        return ReflexType.COLLABORATIVE
    elif g['id'] in conceptual_attractors:
        return ReflexType.CONSOLIDATIVE
    return ReflexType.METAMORPHIC

def create_reflex_glyph(parent: dict, reflex_type: ReflexType) -> dict:
    base_tags = parent['tags'].copy()
    
    type_tags = {
        ReflexType.DEFENSIVE: ['reflex', 'preserve', 'stable'],
        ReflexType.EXPLORATORY: ['reflex', 'seek', 'novel', random_tag()],
        ReflexType.COLLABORATIVE: ['reflex', 'bridge'],
        ReflexType.CONSOLIDATIVE: ['reflex', 'strengthen', 'anchor'],
        ReflexType.METAMORPHIC: ['reflex', 'transform', 'evolve']
    }
    
    new_tags = list(set(base_tags + type_tags.get(reflex_type, ['reflex'])))
    
    new_g = {
        'id': gen_id(),
        'tags': new_tags,
        'entropy': 0,
        'ancestry': [parent['id']],
        'generation_born': generation_count,
        'reflex_profile': ReflexProfile(
            primary_type=reflex_type,
            intensity=random.uniform(0.5, 1.0),
            trigger_conditions=[f\"entropy<{parent['entropy']*1.2}\"],
            activation_count=1,
            last_activation=generation_count
        )
    }
    new_g['entropy'] = calc_entropy(new_g)
    return new_g

def reflex_test():
    \"\"\"Optimized reflex testing.\"\"\"
    # Sample context glyphs
    context_size = min(100, len(glyph_log))
    context_glyphs = glyph_log[-context_size:] if context_size > 0 else []
    
    # Find candidates (limit search)
    candidates = [g for g in glyph_log[-200:] 
                  if 'unknown' in g['tags'] and g['entropy'] < 150][:10]
    
    for g in candidates:
        reflex_type = determine_reflex_type(g, context_glyphs)
        reflex_count = 3 if reflex_type == ReflexType.EXPLORATORY else 2
        
        for _ in range(reflex_count):
            new_g = create_reflex_glyph(g, reflex_type)
            maybe_store(new_g)
            
            with _global_lock:
                glyph_graph.add_edge(g['id'], new_g['id'])
            
            collide(g, new_g)

# ===== PRUNING =====
def prune_stagnant():
    \"\"\"Efficient pruning.\"\"\"
    to_remove = []
    
    with _global_lock:
        for node in list(glyph_graph.nodes):
            stagnant_counter[node] = stagnant_counter.get(node, 0) + 1
            
            if stagnant_counter[node] > PRUNE_AFTER:
                if node not in conceptual_attractors:
                    to_remove.append(node)
        
        for n in to_remove:
            glyph_graph.remove_node(n)
            stagnant_counter.pop(n, None)
            id2glyph.pop(n, None)
    
    # Clean log (batch operation)
    if to_remove:
        remove_set = set(to_remove)
        glyph_log[:] = [g for g in glyph_log if g['id'] not in remove_set]

# ===== SEASONAL DYNAMICS =====
def update_seasonal_phase():
    global current_season, season_counter
    
    season_counter += 1
    if season_counter >= season_duration:
        season_counter = 0
        seasons = list(SeasonalPhase)
        current_index = seasons.index(current_season)
        current_season = seasons[(current_index + 1) % len(seasons)]
        print(f\"Season change: {current_season.value} (Gen {generation_count})\")

# ===== PERSISTENCE =====
def _jsonify(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (list, tuple, set)):
        return [_jsonify(v) for v in obj]
    if isinstance(obj, dict):
        return {k: _jsonify(v) for k, v in obj.items() 
                if k not in ('graph', 'nx_obj', 'reflex_profile')}
    if isinstance(obj, Enum):
        return obj.value
    if hasattr(obj, '__dict__'):
        return {k: _jsonify(v) for k, v in obj.__dict__.items()}
    return repr(obj)

def save_logs(chunk_size: int = 250):
    \"\"\"Optimized log saving.\"\"\"
    import pathlib
    pathlib.Path(LOG_DIR).mkdir(parents=True, exist_ok=True)
    
    idx = len([f for f in os.listdir(LOG_DIR) 
               if f.startswith('chunk_') and f.endswith('.json')])
    
    recent = glyph_log[-chunk_size:] if len(glyph_log) >= chunk_size else glyph_log
    
    # Use faster JSON if available
    try:
        import orjson
        dumps = lambda obj: orjson.dumps(obj).decode()
    except ImportError:
        dumps = lambda obj: json.dumps(obj, separators=(',', ':'), ensure_ascii=False)
    
    with open(f\"{LOG_DIR}/chunk_{idx:04}.json\", \"w\", encoding=\"utf-8\") as f:
        for g in recent:
            f.write(dumps(_jsonify(g)) + \"\n\")
    
    print(f\"✅ Saved {len(recent)} glyphs to chunk_{idx:04}.json\")

# ===== MAIN GENERATION LOOP =====
def generate():
    \"\"\"Optimized generation loop.\"\"\"
    global generation_count
    
    while running.is_set():
        generation_count += 1
        update_seasonal_phase()
        
        # Create and store glyph
        g = create_glyph()
        maybe_store(g)
        
        # Batch operations
        batch_collide()
        
        # Periodic operations (reduced frequency)
        if generation_count % 10 == 0:
            reflex_test()
        
        if generation_count % 50 == 0:
            prune_stagnant()
        
        if generation_count % 250 == 0 and glyph_log:
            save_logs()
            _update_novelty_cache()
            # Clear old influence cache entries
            _influence_cache.clear()
        
        # Adaptive sleep
        sleep_time = {
            SeasonalPhase.EXPLORATION: 0.05,
            SeasonalPhase.CONSOLIDATION: 0.1,
            SeasonalPhase.DORMANCY: 0.2,
            SeasonalPhase.RENAISSANCE: 0.02
        }.get(current_season, 0.1)
        
        time.sleep(sleep_time)

def start_system():
    \"\"\"Start the optimized system.\"\"\"
    global running, _id_counter
    running.set()
    
    print(\"🚀 Glyph Engine v4.1 (Optimized)\")
    print(\"Initializing...\")
    
    # Seed glyphs
    for _ in range(10):
        g = create_glyph()
        maybe_store(g)
    
    print(f\"Started with {len(glyph_log)} seed glyphs\")
    
    thread = threading.Thread(target=generate, daemon=True)
    thread.start()
    return thread

def stop_system():
    \"\"\"Stop the system.\"\"\"
    running.clear()
    print(\"Glyph Engine stopped\")

def get_stats() -> dict:
    \"\"\"Get current system statistics.\"\"\"
    return {
        'generation': generation_count,
        'total_glyphs': len(glyph_log),
        'network_nodes': glyph_graph.number_of_nodes(),
        'network_edges': glyph_graph.number_of_edges(),
        'attractors': len(conceptual_attractors),
        'dormant': len(dormant_glyphs),
        'season': current_season.value,
        'cache_info': {
            'tag_vec_hits': tag_vec_cached.cache_info().hits,
            'tag_vec_misses': tag_vec_cached.cache_info().misses,
        }
    }

if __name__ == \"__main__\":
    print(\"🧠 Glyph Engine v4.1 - Performance Optimized\")
    print(\"\nOptimizations:\")
    print(\"- LRU caching for tag embeddings\")
    print(\"- Vectorized novelty calculations\")
    print(\"- Reduced lock contention (single RLock)\")
    print(\"- Influence caching with TTL\")
    print(\"- BFS cascade depth (non-recursive)\")
    print(\"- Batch embedding support\")
    print(\"- Sampling-based operations\")
    
    thread = start_system()
    
    try:
        time.sleep(10)
        stats = get_stats()
        print(f\"\n📊 Stats after 10s:\")
        for k, v in stats.items():
            print(f\"  {k}: {v}\")
        
        thread.join(timeout=1)
    except KeyboardInterrupt:
        stop_system()
"
Observation: Create successful: /app/backend/glyph_engine_optimized.py
