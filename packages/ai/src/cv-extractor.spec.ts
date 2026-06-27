jest.mock('@wr/storage', () => ({
  downloadFile: jest.fn(),
  parseSupabasePublicUrl: jest.fn(() => null),
}));

import { downloadFile, parseSupabasePublicUrl } from '@wr/storage';
import { buildCvSearchText, extractCvWithAi } from './cv-extractor';

function collectSchemaIssues(value: unknown, path = '$'): string[] {
  if (!value || typeof value !== 'object') return [];

  const issues: string[] = [];
  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPath = `${path}.${key}`;
    if (key === 'additionalProperties') {
      issues.push(nestedPath);
    }
    if (key === 'type' && Array.isArray(nestedValue)) {
      issues.push(nestedPath);
    }
    issues.push(...collectSchemaIssues(nestedValue, nestedPath));
  }
  return issues;
}

describe('Gemini CV extractor', () => {
  const originalFetch = global.fetch;
  const envKeys = [
    'GEMINI_API_KEY',
    'GEMINI_API_KEYS',
    'GEMINI_CV_MODEL',
    'GEMINI_CV_MODELS',
    'GEMINI_CV_RETRY_ATTEMPTS',
    'GEMINI_CV_RETRY_BASE_DELAY_MS',
  ] as const;
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    global.fetch = originalFetch;
    for (const key of envKeys) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
    (parseSupabasePublicUrl as jest.Mock).mockReturnValue(null);
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('sends PDF inline data and validates Gemini structured output', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CV_MODEL = 'gemini-test-model';
    const output = {
      documentText: 'Jane Doe\nSenior Engineer\nTypeScript',
      confidence: 0.96,
      warnings: [],
      resume: {
        personalInfo: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phoneNumber: null,
          address: null,
          links: [],
        },
        currentRole: 'Senior Engineer',
        summary: 'Backend and platform engineer.',
        yearsOfExperience: 99,
        skills: {
          technical: ['TypeScript'],
          softSkills: ['Communication'],
          languages: [{ name: 'English', proficiency: 'Professional' }],
        },
        workExperience: [
          {
            company: 'Alpha',
            position: 'Backend Developer',
            startDate: '2020-01',
            endDate: '2021-12',
            isCurrent: false,
            durationMonths: 1,
            achievements: ['Built NestJS APIs'],
          },
          {
            company: 'Beta',
            position: 'Software Engineer',
            startDate: '2021-07',
            endDate: '2022-12',
            isCurrent: false,
            durationMonths: 1,
            achievements: [],
          },
        ],
        education: [],
      },
    };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: async () => Uint8Array.from([37, 80, 68, 70]).buffer,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const result = await extractCvWithAi({
      fileName: 'canva-cv.pdf',
      fileType: 'PDF',
      fileUrl: 'https://storage.example/canva-cv.pdf',
      rawText: '',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [geminiUrl, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(geminiUrl).toContain('/models/gemini-test-model:generateContent');
    expect(options.headers).toEqual(
      expect.objectContaining({ 'x-goog-api-key': 'test-gemini-key' }),
    );
    const request = JSON.parse(String(options.body));
    expect(request.contents[0].parts[0]).toEqual(
      expect.objectContaining({
        inline_data: expect.objectContaining({ mime_type: 'application/pdf' }),
      }),
    );
    expect(request.generationConfig).toEqual({
      responseFormat: {
        text: {
          mimeType: 'APPLICATION_JSON',
          schema: expect.any(Object),
        },
      },
    });
    expect(request.generationConfig.responseSchema).toBeUndefined();
    expect(collectSchemaIssues(request.generationConfig.responseFormat.text.schema)).toEqual([]);
    expect(result).toEqual(
      expect.objectContaining({
        method: 'AI_VISION',
        model: 'gemini-test-model',
        confidence: 0.96,
        resume: expect.objectContaining({ yearsOfExperience: 3 }),
      }),
    );
    expect(result.resume.workExperience?.map((item) => item.durationMonths)).toEqual([24, 18]);
    expect(buildCvSearchText(result.documentText, result.resume)).toContain(
      'Total experience: 3 years',
    );
  });

  it('downloads Supabase PDFs through the storage client', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    (parseSupabasePublicUrl as jest.Mock).mockReturnValue({
      bucket: 'CV-Storage',
      path: 'candidate/cv.pdf',
    });
    (downloadFile as jest.Mock).mockResolvedValue(
      new Blob([Uint8Array.from([37, 80, 68, 70])], { type: 'application/pdf' }),
    );
    const output = {
      documentText: 'Jane Doe\nSenior Engineer\nTypeScript',
      confidence: 0.96,
      warnings: [],
      resume: {
        personalInfo: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phoneNumber: null,
          address: null,
          links: [],
        },
        currentRole: 'Senior Engineer',
        summary: 'Backend and platform engineer.',
        yearsOfExperience: 3,
        skills: {
          technical: ['TypeScript'],
          softSkills: ['Communication'],
          languages: [],
        },
        workExperience: [],
        education: [],
      },
    };
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    await extractCvWithAi({
      fileName: 'canva-cv.pdf',
      fileType: 'PDF',
      fileUrl: 'https://project.supabase.co/storage/v1/object/public/CV-Storage/candidate/cv.pdf',
      rawText: '',
    });

    expect(downloadFile).toHaveBeenCalledWith('CV-Storage', 'candidate/cv.pdf');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(':generateContent');
  });

  it('tries the next Gemini API key when the first key is rate limited', async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEYS = 'rate-limited-key, healthy-key';
    process.env.GEMINI_CV_MODEL = 'gemini-test-model';
    const output = {
      documentText: 'Jane Doe\nSenior Engineer\nTypeScript',
      confidence: 0.93,
      warnings: [],
      resume: {
        personalInfo: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          links: [],
        },
        currentRole: 'Senior Engineer',
        skills: {
          technical: ['TypeScript'],
          softSkills: [],
          languages: [],
        },
        workExperience: [],
        education: [],
      },
    };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: { message: 'rate limit exceeded' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const result = await extractCvWithAi({
      fileName: 'text-cv.docx',
      fileType: 'DOCX',
      fileUrl: 'https://storage.example/text-cv.docx',
      rawText: 'Jane Doe Senior Engineer TypeScript',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toEqual(
      expect.objectContaining({ 'x-goog-api-key': 'rate-limited-key' }),
    );
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toEqual(
      expect.objectContaining({ 'x-goog-api-key': 'healthy-key' }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        method: 'AI_TEXT',
        model: 'gemini-test-model',
        confidence: 0.93,
      }),
    );
  });

  it('parses Gemini JSON output wrapped in a markdown code fence', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CV_MODEL = 'gemini-test-model';
    const output = {
      documentText: 'Jane Doe\nSenior Engineer\nTypeScript',
      confidence: 0.92,
      warnings: [],
      resume: {
        personalInfo: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          links: [],
        },
        currentRole: 'Senior Engineer',
        skills: {
          technical: ['TypeScript'],
          softSkills: [],
          languages: [],
        },
        workExperience: [],
        education: [],
      },
    };
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: `\`\`\`json\n${JSON.stringify(output)}\n\`\`\`` }] } }],
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    const result = await extractCvWithAi({
      fileName: 'text-cv.docx',
      fileType: 'DOCX',
      fileUrl: 'https://storage.example/text-cv.docx',
      rawText: 'Jane Doe Senior Engineer TypeScript',
    });

    expect(result).toEqual(
      expect.objectContaining({
        method: 'AI_TEXT',
        confidence: 0.92,
        resume: expect.objectContaining({
          currentRole: 'Senior Engineer',
        }),
      }),
    );
  });

  it('accepts Gemini resume fields returned at the top level without a resume wrapper', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CV_MODEL = 'gemini-test-model';
    const output = {
      documentText: 'Jane Doe\nSenior Engineer\nTypeScript',
      confidence: 0.89,
      warnings: [],
      personalInfo: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        links: [],
      },
      currentRole: 'Senior Engineer',
      skills: {
        technical: ['TypeScript'],
        softSkills: [],
        languages: [],
      },
      workExperience: [
        {
          company: 'Alpha',
          position: 'Backend Developer',
          startDate: '2022-01',
          endDate: '2023-12',
          technologies: ['Node.js', 'PostgreSQL'],
          achievements: ['Built APIs'],
        },
      ],
      education: [{ school: 'FPT University', degree: 'Software Engineering', gpa: '3.6 / 4.0' }],
      projects: [
        {
          name: 'ContextOS',
          role: 'Author & Maintainer',
          url: 'https://github.com/example/contextos',
          technologies: ['FAISS', 'MCP'],
          highlights: ['Published NPM package'],
        },
      ],
      awards: [{ name: 'Third Prize', issuer: 'FPT University', date: '2025' }],
    };
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    const result = await extractCvWithAi({
      fileName: 'text-cv.docx',
      fileType: 'DOCX',
      fileUrl: 'https://storage.example/text-cv.docx',
      rawText: 'Jane Doe Senior Engineer TypeScript',
    });

    expect(result).toEqual(
      expect.objectContaining({
        method: 'AI_TEXT',
        confidence: 0.89,
        resume: expect.objectContaining({
          currentRole: 'Senior Engineer',
          workExperience: [
            expect.objectContaining({
              company: 'Alpha',
              durationMonths: 24,
              technologies: ['Node.js', 'PostgreSQL'],
            }),
          ],
          education: [expect.objectContaining({ gpa: '3.6 / 4.0' })],
          projects: [expect.objectContaining({ name: 'ContextOS' })],
          awards: [expect.objectContaining({ name: 'Third Prize' })],
        }),
      }),
    );
  });

  it('retries transient 503 errors and falls back to the next Gemini model', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CV_MODEL = 'gemini-busy-model';
    process.env.GEMINI_CV_MODELS = 'gemini-healthy-model';
    process.env.GEMINI_CV_RETRY_ATTEMPTS = '2';
    process.env.GEMINI_CV_RETRY_BASE_DELAY_MS = '0';
    const output = {
      documentText: 'Jane Doe\nSenior Engineer\nTypeScript',
      confidence: 0.91,
      warnings: [],
      resume: {
        personalInfo: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          links: [],
        },
        currentRole: 'Senior Engineer',
        skills: {
          technical: ['TypeScript'],
          softSkills: [],
          languages: [],
        },
        workExperience: [],
        education: [],
      },
    };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({
          error: { message: 'This model is currently experiencing high demand.' },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({
          error: { message: 'This model is currently experiencing high demand.' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const result = await extractCvWithAi({
      fileName: 'text-cv.docx',
      fileType: 'DOCX',
      fileUrl: 'https://storage.example/text-cv.docx',
      rawText: 'Jane Doe Senior Engineer TypeScript',
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/models/gemini-busy-model:generateContent');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/models/gemini-busy-model:generateContent');
    expect(String(fetchMock.mock.calls[2][0])).toContain('/models/gemini-healthy-model:generateContent');
    expect(result).toEqual(
      expect.objectContaining({
        method: 'AI_TEXT',
        model: 'gemini-healthy-model',
        confidence: 0.91,
      }),
    );
  });

  it('rejects API-key-shaped values in Gemini model configuration', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_CV_MODEL = 'gemini-test-model';
    process.env.GEMINI_CV_MODELS = 'AQ.not-a-model-name';

    await expect(
      extractCvWithAi({
        fileName: 'text-cv.docx',
        fileType: 'DOCX',
        fileUrl: 'https://storage.example/text-cv.docx',
        rawText: 'Jane Doe Senior Engineer TypeScript',
      }),
    ).rejects.toThrow('Invalid Gemini CV model name');
  });

  it('requires a Gemini API key', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEYS;
    await expect(
      extractCvWithAi({
        fileName: 'scan.pdf',
        fileType: 'PDF',
        fileUrl: 'https://storage.example/scan.pdf',
      }),
    ).rejects.toThrow('GEMINI_API_KEY or GEMINI_API_KEYS');
  });
});
