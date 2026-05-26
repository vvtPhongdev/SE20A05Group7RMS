// ─── Skill Graph Module ────────────────────────────────────────────
// Exports a pre-loaded singleton skill graph instance.
export { SkillGraph } from './graph';
export { SKILL_NODES, SKILL_EDGES } from './taxonomy';
import { SkillGraph } from './graph';
import { SKILL_NODES, SKILL_EDGES } from './taxonomy';
/** Pre-loaded singleton skill graph with full taxonomy */
export const skillGraph = new SkillGraph(SKILL_NODES, SKILL_EDGES);
//# sourceMappingURL=index.js.map