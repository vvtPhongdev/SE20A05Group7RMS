import { SkillGraph } from './graph';
import { SKILL_EDGES, SKILL_NODES } from './taxonomy';

describe('SkillGraph role qualifications', () => {
  const graph = new SkillGraph(SKILL_NODES, SKILL_EDGES);

  it('allows a full-stack role to qualify for backend and frontend roles', () => {
    expect(graph.getRoleQualificationDistance('Full Stack Developer', 'Backend Developer')).toBe(1);
    expect(graph.getRoleQualificationDistance('Full Stack Developer', 'Frontend Developer')).toBe(1);
  });

  it('does not infer that a backend role qualifies for full-stack', () => {
    expect(graph.getRoleQualificationDistance('Backend Developer', 'Full Stack Developer')).toBe(
      Infinity,
    );
  });
});
