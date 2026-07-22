import { parseCandidateTemplateCv } from './candidate-template-parser';

const filledTemplate = `RMS-CV-TEMPLATE: V1
Jane Doe
Backend Engineer
Email: jane@example.com Phone: +84 900 000 000
Address: Ho Chi Minh City LinkedIn: https://linkedin.com/in/jane
GitHub: https://github.com/jane Portfolio: https://jane.dev

Professional Summary
Backend engineer building reliable APIs.

Technical Skills
Programming languages: TypeScript, Java
Frameworks and libraries: NestJS, React
Databases and tools: PostgreSQL, Docker

Soft Skills
Communication, Teamwork

Languages
English - IELTS 7.0

Work Experience
Backend Engineer - Example Co

Education
Bachelor of Software Engineering - FPT University`;

describe('parseCandidateTemplateCv', () => {
  const embed = jest.fn(async () => new Float32Array([1, 0, 0]));

  beforeEach(() => jest.clearAllMocks());

  it('uses the local vector model and parses a filled RMS Word template', async () => {
    const result = await parseCandidateTemplateCv({ fileType: 'DOC', rawText: filledTemplate, embed });

    expect(result.matched).toBe(true);
    if (!result.matched) return;
    expect(embed).toHaveBeenCalledTimes(2);
    expect(result.extraction.model).toBe('rms-template-parser-v1');
    expect(result.extraction.resume.personalInfo).toMatchObject({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phoneNumber: '+84 900 000 000',
    });
    expect(result.extraction.resume.skills?.technical).toEqual(
      expect.arrayContaining(['TypeScript', 'Java', 'NestJS', 'React', 'PostgreSQL', 'Docker']),
    );
  });

  it('does not use vector parsing for files without the RMS template marker', async () => {
    const result = await parseCandidateTemplateCv({
      fileType: 'DOCX',
      rawText: filledTemplate.replace('RMS-CV-TEMPLATE: V1\n', ''),
      embed,
    });

    expect(result).toEqual(expect.objectContaining({ matched: false, reason: expect.stringContaining('marker') }));
    expect(embed).not.toHaveBeenCalled();
  });

  it('routes PDFs away from the template parser', async () => {
    const result = await parseCandidateTemplateCv({ fileType: 'PDF', rawText: filledTemplate, embed });

    expect(result).toEqual(expect.objectContaining({ matched: false }));
    expect(embed).not.toHaveBeenCalled();
  });
});
