/**
 * Minimal structured JSON logger.
 * Never pass row values, query parameter values, or credentials to this module.
 */

const LEVEL_WEIGHT = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

function resolveLevel(level) {
  return LEVEL_WEIGHT[level] ? level : 'info';
}

export function createLogger({ level = 'info', sink = process.stdout } = {}) {
  const threshold = LEVEL_WEIGHT[resolveLevel(level)];

  function write(entryLevel, fields, message) {
    if (LEVEL_WEIGHT[entryLevel] < threshold) {
      return;
    }
    const record = {
      time: new Date().toISOString(),
      level: entryLevel,
      message,
      ...fields,
    };
    sink.write(`${JSON.stringify(record)}\n`);
  }

  return {
    debug: (fields, message) => write('debug', fields, message),
    info: (fields, message) => write('info', fields, message),
    warn: (fields, message) => write('warn', fields, message),
    error: (fields, message) => write('error', fields, message),
  };
}

export const logger = createLogger({ level: process.env.LOG_LEVEL || 'info' });
