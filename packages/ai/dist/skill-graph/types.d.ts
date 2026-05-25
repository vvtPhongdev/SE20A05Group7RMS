export interface SkillNodeDef {
    /** Unique skill name (canonical form) */
    name: string;
    /** Alternate names / abbreviations */
    aliases: string[];
    /** Category classification */
    category: SkillCategoryType;
    /** Optional parent skill for hierarchy */
    parent?: string;
}
export interface SkillEdgeDef {
    source: string;
    target: string;
    relationship: SkillRelType;
    weight?: number;
}
export type SkillCategoryType = 'LANGUAGE' | 'FRAMEWORK' | 'LIBRARY' | 'DATABASE' | 'CLOUD' | 'DEVOPS' | 'PARADIGM' | 'ROLE' | 'DOMAIN' | 'TOOL' | 'PLATFORM';
export type SkillRelType = 'IS_A' | 'PART_OF' | 'RELATED_TO' | 'VARIANT_OF' | 'REQUIRES';
export interface GraphQueryResult {
    /** Matched skill nodes */
    matchedNodes: SkillNodeDef[];
    /** Shortest path distance (hops) */
    distance: number;
    /** Path from source to target */
    path: string[];
}
export interface SkillMatch {
    skill: string;
    source: 'exact' | 'alias' | 'graph_expansion' | 'vector_similarity';
    confidence: number;
    distance: number;
}
//# sourceMappingURL=types.d.ts.map