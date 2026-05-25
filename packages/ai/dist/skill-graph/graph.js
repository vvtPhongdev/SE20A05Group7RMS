// ─── Skill Knowledge Graph Engine ──────────────────────────────────
// In-memory graph for skill expansion, distance calculation, and proximity scoring.
// Uses BFS for shortest path and query expansion.
export class SkillGraph {
    nodes = new Map();
    aliasMap = new Map(); // lowercase alias → canonical name
    adjacency = new Map();
    edgeWeights = new Map();
    constructor(nodes, edges) {
        // Index nodes
        for (const node of nodes) {
            const key = node.name.toLowerCase();
            this.nodes.set(key, node);
            this.aliasMap.set(key, node.name);
            for (const alias of node.aliases) {
                this.aliasMap.set(alias.toLowerCase(), node.name);
            }
            this.adjacency.set(key, new Set());
        }
        // Index edges (bidirectional)
        for (const edge of edges) {
            const srcKey = edge.source.toLowerCase();
            const tgtKey = edge.target.toLowerCase();
            if (this.adjacency.has(srcKey) && this.adjacency.has(tgtKey)) {
                this.adjacency.get(srcKey).add(tgtKey);
                this.adjacency.get(tgtKey).add(srcKey);
                const edgeKey = [srcKey, tgtKey].sort().join('::');
                this.edgeWeights.set(edgeKey, edge.weight ?? 1.0);
            }
        }
    }
    /** Resolve a query string to a canonical skill name */
    resolve(query) {
        const key = query.toLowerCase().trim();
        return this.aliasMap.get(key) ?? null;
    }
    /** Find a node by name or alias */
    findNode(query) {
        const canonical = this.resolve(query);
        if (!canonical)
            return null;
        return this.nodes.get(canonical.toLowerCase()) ?? null;
    }
    /** BFS shortest path distance between two skills. Returns Infinity if unreachable. */
    getDistance(from, to) {
        const fromKey = (this.resolve(from) ?? from).toLowerCase();
        const toKey = (this.resolve(to) ?? to).toLowerCase();
        if (fromKey === toKey)
            return 0;
        if (!this.adjacency.has(fromKey) || !this.adjacency.has(toKey))
            return Infinity;
        const visited = new Set([fromKey]);
        const queue = [[fromKey, 0]];
        while (queue.length > 0) {
            const [current, depth] = queue.shift();
            const neighbors = this.adjacency.get(current);
            if (!neighbors)
                continue;
            for (const neighbor of neighbors) {
                if (neighbor === toKey)
                    return depth + 1;
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, depth + 1]);
                }
            }
        }
        return Infinity;
    }
    /** Get all skills reachable within maxDepth hops from a starting skill */
    getRelated(skill, maxDepth = 2) {
        const startKey = (this.resolve(skill) ?? skill).toLowerCase();
        if (!this.adjacency.has(startKey))
            return [];
        const visited = new Set([startKey]);
        const queue = [[startKey, 0]];
        const results = [];
        while (queue.length > 0) {
            const [current, depth] = queue.shift();
            if (depth > 0) {
                const node = this.nodes.get(current);
                if (node)
                    results.push(node);
            }
            if (depth >= maxDepth)
                continue;
            const neighbors = this.adjacency.get(current);
            if (!neighbors)
                continue;
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, depth + 1]);
                }
            }
        }
        return results;
    }
    /**
     * Expand a query (e.g. "Web Developer") into a list of related skill names.
     * Returns skills within maxDepth hops, sorted by distance.
     */
    expandQuery(query, maxDepth = 3) {
        const startKey = (this.resolve(query) ?? query).toLowerCase();
        if (!this.adjacency.has(startKey))
            return [];
        const visited = new Map(); // key → distance
        visited.set(startKey, 0);
        const queue = [[startKey, 0]];
        while (queue.length > 0) {
            const [current, depth] = queue.shift();
            if (depth >= maxDepth)
                continue;
            const neighbors = this.adjacency.get(current);
            if (!neighbors)
                continue;
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.set(neighbor, depth + 1);
                    queue.push([neighbor, depth + 1]);
                }
            }
        }
        // Remove the query itself, sort by distance
        visited.delete(startKey);
        return [...visited.entries()]
            .sort((a, b) => a[1] - b[1])
            .map(([key]) => this.nodes.get(key)?.name ?? key);
    }
    /**
     * Score how well a set of candidate skills matches a set of required skills.
     * Returns 0-1 where 1 = perfect coverage.
     */
    getGraphProximityScore(candidateSkills, requiredSkills) {
        if (requiredSkills.length === 0)
            return { score: 0, matches: [] };
        const matches = [];
        let totalScore = 0;
        for (const required of requiredSkills) {
            const resolvedRequired = this.resolve(required);
            let bestDistance = Infinity;
            let matchSource = 'graph_expansion';
            for (const candidate of candidateSkills) {
                const resolvedCandidate = this.resolve(candidate);
                // Exact match
                if (resolvedCandidate && resolvedRequired &&
                    resolvedCandidate.toLowerCase() === resolvedRequired.toLowerCase()) {
                    bestDistance = 0;
                    matchSource = 'exact';
                    break;
                }
                // Alias match
                if (resolvedCandidate && resolvedRequired &&
                    resolvedCandidate === resolvedRequired) {
                    bestDistance = 0;
                    matchSource = 'alias';
                    break;
                }
                // Graph distance
                const dist = this.getDistance(candidate, required);
                if (dist < bestDistance) {
                    bestDistance = dist;
                    matchSource = 'graph_expansion';
                }
            }
            // Convert distance to confidence (closer = higher)
            const confidence = bestDistance === 0 ? 1.0
                : bestDistance === 1 ? 0.85
                    : bestDistance === 2 ? 0.65
                        : bestDistance === 3 ? 0.45
                            : bestDistance < Infinity ? 0.25
                                : 0;
            totalScore += confidence;
            if (confidence > 0) {
                matches.push({
                    skill: required,
                    source: matchSource,
                    confidence,
                    distance: bestDistance,
                });
            }
        }
        return {
            score: totalScore / requiredSkills.length,
            matches,
        };
    }
    /** Get total number of skill nodes */
    get size() {
        return this.nodes.size;
    }
    /** Get total number of edges */
    get edgeCount() {
        return this.edgeWeights.size;
    }
}
//# sourceMappingURL=graph.js.map