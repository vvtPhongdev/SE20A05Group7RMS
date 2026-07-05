import { randomUUID } from 'crypto';
import { extname } from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type UploadBody = ArrayBuffer | Buffer | Blob | Uint8Array;

export type StorageObjectLocation = {
  bucket: string;
  path: string;
};

export type UploadedStorageObject = StorageObjectLocation & {
  publicUrl: string;
};

export const storageBuckets = {
  cvs: process.env.SUPABASE_CV_BUCKET || 'cvs',
  avatars: process.env.SUPABASE_AVATAR_BUCKET || 'avatars',
  banners: process.env.SUPABASE_BANNER_BUCKET || 'Banner',
  jobPostings: process.env.SUPABASE_JOB_POSTING_BUCKET || 'job-postings',
};

export const supportedCvExtensions = ['.pdf', '.docx', '.doc'] as const;

let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';

function storageEnv() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.',
    );
  }

  return { url, key };
}

export function getSupabaseClient(): SupabaseClient {
  const env = storageEnv();
  const signature = `${env.url}:${env.key}`;

  if (cachedClient && cachedSignature === signature) {
    return cachedClient;
  }

  cachedSignature = signature;
  cachedClient = createClient(env.url, env.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cachedClient;
}

export function sanitizeStorageSegment(value: string) {
  const safe = value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe || 'unknown';
}

export function sanitizeFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop() || 'upload';
  return sanitizeStorageSegment(baseName);
}

export function buildStoragePath(ownerId: string, originalFileName: string) {
  return `${sanitizeStorageSegment(ownerId)}/${randomUUID()}-${sanitizeFileName(originalFileName)}`;
}

function storageTimestamp(date = new Date()) {
  return date.toISOString().replace(/\D/g, '').slice(0, 14);
}

export function buildCvStorageFileName(
  candidateName: string | undefined,
  originalFileName: string,
  date = new Date(),
) {
  const { extension } = validateCvFileName(originalFileName);
  const candidateSegment = sanitizeStorageSegment(candidateName || 'candidate');
  const shortCode = randomUUID().replace(/-/g, '').slice(0, 8);
  return `${candidateSegment}-CV-${storageTimestamp(date)}-${shortCode}${extension}`;
}

export function validateCvFileName(fileName: string) {
  const safeFileName = sanitizeFileName(fileName);
  const extension = extname(safeFileName).toLowerCase();

  if (!supportedCvExtensions.includes(extension as (typeof supportedCvExtensions)[number])) {
    throw new Error('Only PDF, DOCX, and DOC files are supported');
  }

  return {
    safeFileName,
    extension: extension as (typeof supportedCvExtensions)[number],
  };
}

export function buildCvStoragePath(
  ownerId: string,
  originalFileName: string,
  date = new Date(),
  candidateName?: string,
) {
  return `${sanitizeStorageSegment(ownerId)}/${buildCvStorageFileName(
    candidateName,
    originalFileName,
    date,
  )}`;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: UploadBody,
  options?: { contentType?: string; upsert?: boolean },
): Promise<UploadedStorageObject> {
  const client = getSupabaseClient();
  const { error } = await client.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    bucket,
    path,
    publicUrl: getPublicUrl(bucket, path),
  };
}

export async function removeFile(bucket: string, path: string) {
  const client = getSupabaseClient();
  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}

export async function downloadFile(bucket: string, path: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.storage.from(bucket).download(path);
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  return getSupabaseClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function parseSupabasePublicUrl(fileUrl: string): StorageObjectLocation | null {
  try {
    const url = new URL(fileUrl);
    const marker = '/storage/v1/object/public/';
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    const storagePath = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    const [bucket, ...pathParts] = storagePath.split('/');
    const path = pathParts.join('/');
    return bucket && path ? { bucket, path } : null;
  } catch {
    return null;
  }
}
