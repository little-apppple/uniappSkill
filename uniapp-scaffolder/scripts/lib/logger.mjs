export function createLogger({ json }) {
  function emit(stream, level, msg, data) {
    if (json) {
      const payload = JSON.stringify({ level, msg, ...(data ? { data } : {}), ts: new Date().toISOString() })
      stream.write(payload + '\n')
    } else {
      const prefix = level === 'warn' ? 'WARN: ' : level === 'error' ? 'ERROR: ' : ''
      const target = level === 'warn' || level === 'error' ? process.stderr : process.stdout
      target.write(prefix + msg + '\n')
    }
  }
  return {
    info(msg, data)  { emit(process.stdout, 'info',  format(msg, data), data) },
    warn(msg, data)  { emit(process.stderr, 'warn',  format(msg, data), data) },
    error(msg, data) { emit(process.stderr, 'error', format(msg, data), data) },
    progress(msg)    { if (!json) process.stdout.write('… ' + msg + '\n') },
  }
}

function format(msg, data) {
  if (typeof msg !== 'string') return JSON.stringify(msg)
  if (data === undefined) return msg
  try { return msg.replace(/%[sdj]/g, () => JSON.stringify(data)) }
  catch { return msg }
}
