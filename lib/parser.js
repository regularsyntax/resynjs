const ParserState = require('./state.js');

class Parser {
  constructor(rootContextFactory) {
    this.rootContextFactory = rootContextFactory;
  }

  parse(code) {
    code = code.trim();
    const state = new ParserState(this.rootContextFactory());
    let m = null;
    let action;
    while (code.length) {
      action = null;
      for (const rule of state.context.rules) {
        m = rule.pattern.exec(code);
        if (m) {
          action = rule.action;
          break;
        }
      }
      if (action == null) {
        state.throwError(`Could not find appropriate token in context: ${state.context.name}`);
      }
      action.execute(state, m);
      state.updatePos(m[0]);
      code = code.substring(m.index + m[0].length);
    }
    return state.rootContainer;
  }
}

module.exports = Parser;