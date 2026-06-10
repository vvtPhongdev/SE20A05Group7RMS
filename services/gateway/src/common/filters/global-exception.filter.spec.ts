import { ArgumentsHost, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ERROR_CODES } from '@wr/contracts';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  const mockHost = (headers: Record<string, string> = {}): ArgumentsHost => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ status: statusMock }),
        getRequest: jest.fn().mockReturnValue({
          method: 'POST',
          url: '/api/recruitment-requests',
          headers,
        }),
      }),
    } as unknown as ArgumentsHost;
  };

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete process.env.NODE_ENV;
  });

  // ── HttpException — single message ─────────────────────────────────

  it('maps a NotFoundException to 404 NOT_FOUND', () => {
    filter.catch(new NotFoundException('Candidate not found'), mockHost());

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: ERROR_CODES.NOT_FOUND,
        message: 'Candidate not found',
        path: '/api/recruitment-requests',
      }),
    );
  });

  it('maps a ConflictException to 409 CONFLICT', () => {
    filter.catch(new ConflictException('Schedule conflict'), mockHost());

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, error: ERROR_CODES.CONFLICT }),
    );
  });

  // ── HttpException — ValidationPipe array message ────────────────────

  it('maps ValidationPipe BadRequestException with array message to details', () => {
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        message: ['Position title is required', 'Department must be a string'],
        error: 'Bad Request',
      }),
      mockHost(),
    );

    const body = jsonMock.mock.calls[0][0];
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(body.message).toBe('Validation failed');
    expect(body.details).toEqual(['Position title is required', 'Department must be a string']);
  });

  // ── TCP microservice errors (RpcException plain-object payloads) ────

  it('maps a plain-object RpcException payload to its mapped HTTP status', () => {
    filter.catch({ status: 409, message: 'Interview slot already booked' }, mockHost());

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        error: ERROR_CODES.CONFLICT,
        message: 'Interview slot already booked',
      }),
    );
  });

  it('folds extra array fields (e.g. conflicts) from RpcException payloads into details', () => {
    const conflicts = [{ scheduleId: 'sched-1', interviewerId: 'int-1' }];
    filter.catch({ status: 409, message: 'Schedule conflict', conflicts }, mockHost());

    const body = jsonMock.mock.calls[0][0];
    expect(body.statusCode).toBe(409);
    expect(body.details).toEqual(conflicts);
  });

  // ── Unknown errors ────────────────────────────────────────────────

  it('maps unknown Error instances to 500 INTERNAL_ERROR with stack in details when not production', () => {
    process.env.NODE_ENV = 'development';
    filter.catch(new Error('Unexpected failure'), mockHost());

    const body = jsonMock.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.error).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(body.message).toBe('Internal server error');
    expect(body.details).toBeDefined();
    expect(body.details![0]).toEqual(expect.stringContaining('Unexpected failure'));
  });

  it('hides stack traces when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    filter.catch(new Error('Unexpected failure'), mockHost());

    const body = jsonMock.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.error).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(body.details).toBeUndefined();
  });

  // ── Response shape & correlation ID ─────────────────────────────────

  it('always includes statusCode, error, message, timestamp and path', () => {
    filter.catch(new NotFoundException('Not found'), mockHost());

    const body = jsonMock.mock.calls[0][0];
    expect(body).toHaveProperty('statusCode');
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('path');
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
  });

  it('logs using the x-correlation-id header when present', () => {
    filter.catch(new NotFoundException('Not found'), mockHost({ 'x-correlation-id': 'corr-123' }));

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('corr-123'));
  });

  it('generates a correlation ID when the header is absent', () => {
    filter.catch(new NotFoundException('Not found'), mockHost());

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/\[[0-9a-f-]{36}\]/));
  });
});
