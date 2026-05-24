import { SkillGraph } from '../skill-graph/graph';
export interface ExpandedSearchQuery {
    /** Original query text */
    originalQuery: string;
    /** Resolved canonical skill name (if matched) */
    resolvedSkill: string | null;
    /** Expanded skill names from graph traversal */
    expandedSkills: string[];
}
export declare class SearchExpander {
    private readonly graph;
    constructor(graph: SkillGraph);
    /**
     * Expand a search query into related skills via the knowledge graph.
     * Falls back to the raw query if no graph match is found.
     */
    expand(query: string, maxDepth?: number): ExpandedSearchQuery;
}
//# sourceMappingURL=search-expander.d.ts.map