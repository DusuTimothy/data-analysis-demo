/**
 * Loads and validates every environment variable at boot.
 * Invalid configuration must stop the process before any request is served.
 */

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

const VALID_LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error']);
const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);

function isPostgresUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'postgres:' || url.protocol === 'postgresql:';
  } catch {
    return false;
  }
}

function parseBoolean(errors, name, rawValue, fallback) {
  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }
  if (rawValue === 'true') {
    return true;
  }
  if (rawValue === 'false') {
    return false;
  }
  errors.push(`${name} must be "true" or "false".`);
  return fallback;
}

function parseInteger(errors, name, rawValue, fallback, { min, max }) {
  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < min || value > max) {
    errors.push(`${name} must be an integer between ${min} and ${max}.`);
    return fallback;
  }
  return value;
}

function parseOrigins(errors, rawValue) {
  if (!rawValue) {
    return [];
  }
  return rawValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter((origin, index, origins) => origins.indexOf(origin) === index)
    .map((origin) => {
      try {
        const parsed = new URL(origin);
        if (parsed.origin !== origin) {
          errors.push(`CORS_ALLOWED_ORIGINS entry "${origin}" must be a bare origin.`);
        }
        return origin;
      } catch {
        errors.push(`CORS_ALLOWED_ORIGINS entry "${origin}" is not a valid URL.`);
        return origin;
      }
    });
}

function parseLgas(errors, rawValue) {
  if (!rawValue) {
    return [];
  }
  const lgas = rawValue
    .split(',')
    .map((lga) => lga.trim())
    .filter(Boolean);
  const unique = lgas.filter((lga, index) => lgas.indexOf(lga) === index);
  if (unique.length === 0) {
    errors.push('PLATEAU_SENATORIAL_LGAS must contain at least one LGA name.');
  }
  for (const lga of unique) {
    if (lga.length > 100) {
      errors.push(`PLATEAU_SENATORIAL_LGAS entry "${lga}" exceeds 100 characters.`);
    }
  }
  return unique;
}

export function loadEnv(source = process.env) {
  const errors = [];

  const nodeEnv = source.NODE_ENV || 'development';
  if (!VALID_NODE_ENVS.has(nodeEnv)) {
    errors.push('NODE_ENV must be one of: development, test, production.');
  }
  const isProduction = nodeEnv === 'production';

  const port = parseInteger(errors, 'PORT', source.PORT, 4000, { min: 1, max: 65535 });

  const databaseUrl = (source.DATABASE_URL || '').trim();
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required.');
  } else if (!isPostgresUrl(databaseUrl)) {
    errors.push('DATABASE_URL must be a postgres:// or postgresql:// URL.');
  }

  const seedDatabaseUrl = (source.SEED_DATABASE_URL || '').trim();
  if (seedDatabaseUrl && !isPostgresUrl(seedDatabaseUrl)) {
    errors.push('SEED_DATABASE_URL must be a postgres:// or postgresql:// URL when set.');
  }

  const candidateName = (source.CANDIDATE_NAME || '').trim();
  if (!candidateName) {
    errors.push('CANDIDATE_NAME is required.');
  }

  const partyName = (source.PARTY_NAME || 'APC').trim() || 'APC';
  const senatorialDistrict = (source.SENATORIAL_DISTRICT || 'Plateau').trim() || 'Plateau';
  const electionYear = parseInteger(errors, 'ELECTION_YEAR', source.ELECTION_YEAR, 2027, {
    min: 2023,
    max: 2100,
  });

  const lgas = parseLgas(errors, (source.PLATEAU_SENATORIAL_LGAS || '').trim());
  if (lgas.length === 0 && !source.PLATEAU_SENATORIAL_LGAS) {
    errors.push(
      'PLATEAU_SENATORIAL_LGAS is required. Supply the official LGA composition of the district.',
    );
  }

  const corsAllowedOrigins = parseOrigins(errors, source.CORS_ALLOWED_ORIGINS);
  if (corsAllowedOrigins.length === 0) {
    if (isProduction) {
      errors.push('CORS_ALLOWED_ORIGINS is required in production.');
    } else {
      corsAllowedOrigins.push('http://localhost:5173');
    }
  }

  const dbSsl = parseBoolean(errors, 'DB_SSL', source.DB_SSL, isProduction);
  const dbSslRejectUnauthorized = parseBoolean(
    errors,
    'DB_SSL_REJECT_UNAUTHORIZED',
    source.DB_SSL_REJECT_UNAUTHORIZED,
    true,
  );
  const dbLogging = parseBoolean(errors, 'DB_LOGGING', source.DB_LOGGING, false);
  const trustProxy = parseBoolean(errors, 'TRUST_PROXY', source.TRUST_PROXY, false);

  const logLevel = (source.LOG_LEVEL || 'info').trim();
  if (!VALID_LOG_LEVELS.has(logLevel)) {
    errors.push('LOG_LEVEL must be one of: debug, info, warn, error.');
  }

  if (errors.length > 0) {
    throw new ConfigError(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return Object.freeze({
    nodeEnv,
    isProduction,
    port,
    databaseUrl,
    seedDatabaseUrl,
    candidateName,
    partyName,
    senatorialDistrict,
    electionYear,
    lgas,
    corsAllowedOrigins,
    dbSsl,
    dbSslRejectUnauthorized,
    dbLogging,
    trustProxy,
    logLevel,
  });
}
