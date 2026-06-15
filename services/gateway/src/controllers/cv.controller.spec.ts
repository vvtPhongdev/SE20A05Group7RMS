import { BadRequestException } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { of, throwError } from 'rxjs';
import { CvController } from './cv.controller';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

describe('CvController', () => {
  const cvClient = {
    send: jest.fn(),
  };

  const controller = new CvController(cvClient as any);
  const mkdirMock = jest.mocked(mkdir);
  const unlinkMock = jest.mocked(unlink);
  const writeFileMock = jest.mocked(writeFile);

  beforeEach(() => {
    jest.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
  });

  describe('uploadMine', () => {
    it('rejects a request without a CV file', async () => {
      await expect(controller.uploadMine('user-1')).rejects.toThrow(
        new BadRequestException('CV file is required'),
      );

      expect(cvClient.send).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it('rejects unsupported file extensions before writing the file', async () => {
      const file = {
        buffer: Buffer.from('plain text'),
        originalname: 'candidate.txt',
        mimetype: 'text/plain',
        size: 10,
      };

      await expect(controller.uploadMine('user-1', file)).rejects.toThrow(
        new BadRequestException('Only PDF and DOCX files are supported'),
      );

      expect(cvClient.send).not.toHaveBeenCalled();
      expect(mkdirMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it('rejects CV files larger than 10MB before writing the file', async () => {
      const file = {
        buffer: Buffer.from('oversized cv'),
        originalname: 'candidate.pdf',
        mimetype: 'application/pdf',
        size: 10 * 1024 * 1024 + 1,
      };

      await expect(controller.uploadMine('user-1', file)).rejects.toThrow(
        new BadRequestException('CV file must be 10MB or smaller'),
      );

      expect(cvClient.send).not.toHaveBeenCalled();
      expect(mkdirMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it.each([
      ['candidate.pdf', 'PDF'],
      ['candidate.DOCX', 'DOCX'],
    ] as const)('stores and forwards a valid %s upload', async (originalname, fileType) => {
      const uploaded = {
        id: 'cv-1',
        fileName: originalname,
        fileType,
      };
      const file = {
        buffer: Buffer.from('cv contents'),
        originalname,
        mimetype: 'application/octet-stream',
        size: 11,
      };
      cvClient.send.mockReturnValue(of(uploaded));

      const result = await controller.uploadMine('user-1', file);

      expect(mkdirMock).toHaveBeenCalledWith(expect.stringMatching(/[\\/]uploads[\\/]cv$/), {
        recursive: true,
      });
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`\\.${fileType.toLowerCase()}$`)),
        file.buffer,
      );
      expect(cvClient.send).toHaveBeenCalledWith(
        'cv.upload_candidate',
        expect.objectContaining({
          candidateId: 'user-1',
          fileName: originalname,
          fileType,
          filePath: expect.stringMatching(new RegExp(`\\.${fileType.toLowerCase()}$`)),
        }),
      );
      expect(result).toEqual(uploaded);
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('removes the stored file when the CV service rejects the upload', async () => {
      const serviceError = new Error('CV service unavailable');
      const file = {
        buffer: Buffer.from('cv contents'),
        originalname: 'candidate.pdf',
        mimetype: 'application/pdf',
        size: 11,
      };
      cvClient.send.mockReturnValue(throwError(() => serviceError));

      await expect(controller.uploadMine('user-1', file)).rejects.toBe(serviceError);

      const storedPath = writeFileMock.mock.calls[0]![0];
      expect(unlinkMock).toHaveBeenCalledWith(storedPath);
    });
  });
});
