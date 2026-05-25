import { SkillNodeDef, SkillEdgeDef, SkillMatch } from './types';
export declare class SkillGraph {
    private nodes;
    private aliasMap;
    private adjacency;
    private edgeWeights;
    constructor(nodes: SkillNodeDef[], edges: SkillEdgeDef[]);
    /** Resolve a query string to a canonical skill name */
    resolve(query: string): string | null;
    /** Find a node by name or alias */
    findNode(query: string): SkillNodeDef | null;
    /** BFS shortest path distance between two skills. Returns Infinity if unreachable. */
    getDistance(from: string, to: string): number;
    /** Get all skills reachable within maxDepth hops from a starting skill */
    getRelated(skill: string, maxDepth?: number): SkillNodeDef[];
    /**
     * Expand a query (e.g. "Web Developer") into a list of related skill names.
     * Returns skills within maxDepth hops, sorted by distance.
     */
    expandQuery(query: string, maxDepth?: number): string[];
    /**
     * Score how well a set of candidate skills matches a set of required skills.
     * Returns 0-1 where 1 = perfect coverage.
     */
    getGraphProximityScore(candidateSkills: string[], requiredSkills: string[]): {
        score: number;
        matches: SkillMatch[];
    };
    /** Get total number of skill nodes */
    get size(): number;
    /** Get total number of edges */
    get edgeCount(): number;
}
//# sourceMappingURL=graph.d.ts.map