// ─── Search Query Expander ─────────────────────────────────────────
// Expands a text search query using the skill knowledge graph.
// "Web Developer" → ["React", "Angular", "Vue.js", "JavaScript", "Node.js", ...]
export class SearchExpander {
    graph;
    constructor(graph) {
        this.graph = graph;
    }
    /**
     * Expand a search query into related skills via the knowledge graph.
     * Falls back to the raw query if no graph match is found.
     */
    expand(query, maxDepth = 3) {
        const resolved = this.graph.resolve(query);
        if (!resolved) {
            // Try partial matching: split query into words and match each
            const words = query.split(/\s+/).filter((w) => w.length >= 2);
            const partialMatches = [];
            for (const word of words) {
                const match = this.graph.resolve(word);
                if (match)
                    partialMatches.push(match);
            }
            if (partialMatches.length > 0) {
                // Merge expansions from all partial matches
                const allExpanded = new Set();
                for (const match of partialMatches) {
                    const expanded = this.graph.expandQuery(match, maxDepth);
                    for (const s of expanded)
                        allExpanded.add(s);
                }
                return {
                    originalQuery: query,
                    resolvedSkill: null,
                    expandedSkills: [...allExpanded],
                };
            }
            return {
                originalQuery: query,
                resolvedSkill: null,
                expandedSkills: [],
            };
        }
        const expanded = this.graph.expandQuery(resolved, maxDepth);
        return {
            originalQuery: query,
            resolvedSkill: resolved,
            expandedSkills: expanded,
        };
    }
}
//# sourceMappingURL=search-expander.js.map