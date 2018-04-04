const ParseError = require('./error.js');

class ParserState {
  constructor(root) {
    this.context = root;
    this.rootContainer = {name: 'root', type: 'container', children: []};
    this.contextualContainer = [this.rootContainer, null];
    this.line = this.pos = 0;
  }

  setContext(newContext, tokenName) {
    this.context = newContext;
    const token = {name: tokenName, type: 'container', children: []};
    this.putToken(token);
    this.contextualContainer = [token, this.contextualContainer];
  }

  popContext() {
    while (this.context.visiting) this.doPopContext();
    this.doPopContext();
  }

  doPopContext() {
    this.context = this.context.parent;
    this.contextualContainer = this.contextualContainer[1];
  }

  putToken(token) {
    this.contextualContainer[0].children.push(token);
  }

  updatePos(match) {
    let index = 0;
    for (let i; (i = match.indexOf('\n', index)) != -1;) {
      index = i + 1;
      this.line++;
      this.pos = 0;
    }
    this.pos += match.length - index;
  }

  throwError(reason) {
    throw new ParseError(reason, this.line + 1, this.pos + 1);
  }
}

module.exports = ParserState;