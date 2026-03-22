/**
 * POST /trips/{id}/upload-url
 *
 * Body (JSON):
 *   { "filename": "beach.jpg", "contentType": "image/jpeg", "date": "2026-06-01" }
 *
 * Returns:
 *   { "uploadUrl": "<presigned PUT URL>", "key": "<S3 object key>" }
 *
 * The browser PUTs the file directly to S3 using the returned URL — no data
 * passes through Lambda, keeping uploads fast and costs low.
 */

import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ok, err } from '../lib/response.mjs';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;
const URL_TTL = 300; // presigned URL valid for 5 minutes

export async function handler(event) {
  const tripId = event.pathParameters?.id;
  if (!tripId) return err('Missing trip id', 400);

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { filename, contentType, date } = body;
  if (!filename || !contentType) {
    return err('filename and contentType are required', 400);
  }

  // Key layout: trips/<tripId>/<date>/<timestamp>-<filename>
  const datePart = date ?? new Date().toISOString().slice(0, 10);
  const key = `trips/${tripId}/${datePart}/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: URL_TTL });

  return ok({ uploadUrl, key });
}
