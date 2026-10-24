/**
 * The only module that talks HTTP. Components receive either data or a
 * normalized AnalyticsApiError, never a raw Response.
 */

const SUMMARY_PATH = '/api/analytics/summary';
const TRENDS_PATH = '/api/analytics/trends';
const COVERAGE_PATH = '/api/analytics/coverage';
const CONTEXT_PATH = '/api/analytics/context';
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class AnalyticsApiError extends Error {
  constructor({ code, message, status = null, requestId = null }) {
    super(message);
    this.name = 'AnalyticsApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

function resolveBaseUrl() {
  if (typeof RAW_BASE_URL !== 'string' || RAW_BASE_URL.trim() === '') {
    throw new AnalyticsApiError({
      code: 'CONFIG_ERROR',
      message:
        'VITE_API_BASE_URL is not configured. Set it to "/" for the dev proxy or to the API origin.',
    });
  }
  return RAW_BASE_URL.trim().replace(/\/+$/, '');
}

function buildRequestUrl(path, params) {
  const baseUrl = resolveBaseUrl();
  const fullPath = `${baseUrl}${path}`;
  const url = baseUrl
    ? new URL(fullPath)
    : new URL(fullPath, globalThis.location.origin);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function requestJson(path, { params = {}, signal } = {}) {
  let url;
  try {
    url = buildRequestUrl(path, params);
  } catch (error) {
    if (error instanceof AnalyticsApiError) {
      throw error;
    }
    throw new AnalyticsApiError({
      code: 'CONFIG_ERROR',
      message: 'The analytics API URL could not be built.',
    });
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    throw new AnalyticsApiError({
      code: 'NETWORK_ERROR',
      message: 'Could not reach the analytics API. Check your connection and try again.',
    });
  }

  let body = null;
  const rawBody = await response.text();
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const apiError = body?.error;
    throw new AnalyticsApiError({
      code: apiError?.code ?? 'INTERNAL_ERROR',
      message: apiError?.message ?? `The analytics request failed (HTTP ${response.status}).`,
      status: response.status,
      requestId: apiError?.requestId ?? response.headers.get('x-request-id'),
    });
  }

  if (!body) {
    throw new AnalyticsApiError({
      code: 'INVALID_RESPONSE',
      message: 'The analytics API returned an unexpected response.',
      status: response.status,
      requestId: response.headers.get('x-request-id'),
    });
  }

  return { body, response };
}

function assertSummaryShape(body) {
  if (!Array.isArray(body.data) || !body.context || !body.totals) {
    throw new AnalyticsApiError({
      code: 'INVALID_RESPONSE',
      message: 'The analytics API returned an unexpected response.',
    });
  }
  return body;
}

export async function fetchCampaignContext({ signal } = {}) {
  const { body } = await requestJson(CONTEXT_PATH, { signal });
  if (!body.context || !Array.isArray(body.context.lgas)) {
    throw new AnalyticsApiError({
      code: 'INVALID_RESPONSE',
      message: 'The campaign context response was incomplete.',
    });
  }
  return body;
}

export async function fetchCampaignSummary({ params = {}, signal } = {}) {
  const { body } = await requestJson(SUMMARY_PATH, { params, signal });
  return assertSummaryShape(body);
}

export async function fetchCampaignTrends({ params = {}, signal } = {}) {
  const { body } = await requestJson(TRENDS_PATH, { params, signal });
  return assertSummaryShape(body);
}

export async function fetchCampaignCoverage({ params = {}, signal } = {}) {
  const { body } = await requestJson(COVERAGE_PATH, { params, signal });
  return assertSummaryShape(body);
}
