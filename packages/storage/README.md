# @wr/storage

Shared Supabase Storage helpers for server-side uploads.

## Environment

Set these values in the root `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_CV_BUCKET=cvs
SUPABASE_AVATAR_BUCKET=avatars
```

`SUPABASE_SERVICE_ROLE_KEY` must only be used by backend services.

## Buckets

Create two Supabase Storage buckets:

- `cvs` for candidate CV documents
- `avatars` for candidate profile images

The current gateway returns public URLs for stored files, so these buckets should be public unless the API is later changed to issue signed URLs.

## Usage

```ts
import { buildStoragePath, storageBuckets, uploadFile } from '@wr/storage';

const path = buildStoragePath(candidateId, file.originalname);
const uploaded = await uploadFile(storageBuckets.cvs, path, file.buffer, {
  contentType: file.mimetype,
});

console.log(uploaded.publicUrl);
```
