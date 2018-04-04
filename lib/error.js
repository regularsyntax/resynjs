class ParseError extends Error {
  constructor(reason, line = null, pos = null) {
    super(line !== null ? `${reason} (${line}:${pos})` : reason);
  }
}

module.exports = ParseError;