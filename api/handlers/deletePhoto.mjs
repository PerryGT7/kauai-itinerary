/**
 * DELETE /trips/{id}/photos
 *
 * Body (JSON):
 *   { "key": "trips/kauai-2026/2026-06-01/1234567890-beach.jpg" }
 *
 * Permanently removes the object from S3.
 * The key must belong to the trip specified in the path to prevent
 * one trip from deleting another trip's photos.
 *
 * Returns:
 *   { "deleted": "<key>" }
 */

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ok, err } from '../lib/response.mjs';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;

export async function handler(event) {
  const tripId = event.pathParameters?.id;
  if (!tripId) return err('Missing trip id', 400);

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { key } = body;
  if (!key) return err('key is required', 400);

  // Safety check: the key must live under this trip's prefix
  const expectedPrefix = `trips/${tripId}/`;
  if (!key.startsWith(expectedPrefix)) {
    return err('key does not belong to this trip', 403);
  }

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

  return ok({ deleted: key });
}
