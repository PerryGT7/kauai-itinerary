/**
 * Shared helpers for Lambda responses.
 * All responses include CORS headers so the browser never gets blocked.
 */

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
};

/**
 * Return a successful JSON response.
 * @param {unknown} body   - Value to serialize as JSON
 * @param {number}  status - HTTP status code (default 200)
 */
export function ok(body, status = 200) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    body: JSON.stringify(body),
  };
}

/**
 * Return an error JSON response.
 * @param {string} message - Human-readable error message
 * @param {number} status  - HTTP status code (default 400)
 */
export function err(message, status = 400) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    body: JSON.stringify({ error: message }),
  };
}
