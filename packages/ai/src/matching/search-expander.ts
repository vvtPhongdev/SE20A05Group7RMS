// ─── Search Query Expander ─────────────────────────────────────────
// Expands a text search query using the skill knowledge graph.
// "Web Developer" → ["React", "Angular", "Vue.js", "JavaScript", "Node.js", ...]

import { SkillGraph } from '../skill-graph/graph';

export interface ExpandedSearchQuery {
  /** Original query text */
  originalQuery: string;
  /** Resolved canonical skill name (if matched) */
  resolvedSkill: string | null;
  /** Expanded skill names from graph traversal */
  expandedSkills: string[];
}

export class SearchExpander {
  constructor(private readonly graph: SkillGraph) {}

  /**
   * Expand a search query into related skills via the knowledge graph.
   * Falls back to the raw query if no graph match is found.
   */
  expand(query: string, maxDepth = 3): ExpandedSearchQuery {
    const resolved = this.graph.resolve(query);

    if (!resolved) {
      // Try partial matching: split query into words and match each
      const words = query.split(/\s+/).filter((w) => w.length >= 2);
      const partialMatches: string[] = [];
      for (const word of words) {
        const match = this.graph.resolve(word);
        if (match) partialMatches.push(match);
      }

      if (partialMatches.length > 0) {
        // Merge expansions from all partial matches
        const allExpanded = new Set<string>();
        for (const match of partialMatches) {
          const expanded = this.graph.expandQuery(match, maxDepth);
          for (const s of expanded) allExpanded.add(s);
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
