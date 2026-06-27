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
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_CV_MODEL;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
    process.env.GEMINI_CV_MODEL = originalModel;
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
      fileUrl:
        'https://project.supabase.co/storage/v1/object/public/CV-Storage/candidate/cv.pdf',
      rawText: '',
    });

    expect(downloadFile).toHaveBeenCalledWith('CV-Storage', 'candidate/cv.pdf');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(':generateContent');
  });

  it('requires a Gemini API key', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      extractCvWithAi({
        fileName: 'scan.pdf',
        fileType: 'PDF',
        fileUrl: 'https://storage.example/scan.pdf',
      }),
    ).rejects.toThrow('GEMINI_API_KEY');
  });
});
