/**
 * Correlates every log line and error response with one request ID.
 */

import { randomUUID } from 'node:crypto';

const MAX_INCOMING_ID_LENGTH = 128;

export function requestId(req, res, next) {
  const incoming = req.get('x-request-id');
  const candidate =
    typeof incoming === 'string' && incoming.trim().length > 0
      ? incoming.trim().slice(0, MAX_INCOMING_ID_LENGTH)
      : randomUUID();

  req.requestId = candidate;
  res.setHeader('x-request-id', candidate);
  next();
}
