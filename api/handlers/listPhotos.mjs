/**
 * GET /trips/{id}/photos?date=YYYY-MM-DD
 *
 * Lists all photos stored for a trip, optionally filtered by date.
 * Each item includes a short-lived presigned GET URL so the browser can
 * display photos without making the S3 bucket public.
 *
 * Returns:
 *   { "photos": [{ "key": "...", "url": "...", "date": "...", "size": 12345 }] }
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ok, err } from '../lib/response.mjs';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;
const URL_TTL = 3600; // presigned GET URL valid for 1 hour

export async function handler(event) {
  const tripId = event.pathParameters?.id;
  if (!tripId) return err('Missing trip id', 400);

  const date = event.queryStringParameters?.date; // optional YYYY-MM-DD

  // Prefix narrows the S3 listing to this trip (and optionally this day)
  const prefix = date
    ? `trips/${tripId}/${date}/`
    : `trips/${tripId}/`;

  // Page through all objects under the prefix
  const keys = [];
  let continuationToken;
  do {
    const cmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });
    const res = await s3.send(cmd);
    for (const obj of res.Contents ?? []) {
      keys.push({ key: obj.Key, size: obj.Size, lastModified: obj.LastModified });
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  // Generate a presigned GET URL for each object
  const photos = await Promise.all(
    keys.map(async ({ key, size, lastModified }) => {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: URL_TTL },
      );

      // Extract date segment from key: trips/<tripId>/<date>/<file>
      const segments = key.split('/');
      const photoDate = segments[2] ?? null;

      return { key, url, date: photoDate, size, lastModified };
    }),
  );

  return ok({ photos });
}
