class Context {
  constructor(name, rules, parent = null, visiting = false) {
    this.name = name;
    this.rules = rules;
    this.parent = parent;
    this.visiting = visiting;
  }
}

class Rule {
  constructor(pattern, action) {
    this.rawPattern = pattern;
    this.pattern = new RegExp(`^${pattern}`, 's');
    this.action = action;
  }
}

class Action {
  constructor(directives = []) {
    this.directives = Array.isArray(directives) ? directives : [directives];
  }

  execute(state, m) {
    let tokenIndex = 1;
    this.doExecute(state, m[0], () => m[tokenIndex++]);
  }

  doExecute(state, match, nextToken) {
    for (const dir of this.directives) dir(state, match, nextToken);
  }
}

module.exports = {Context, Rule, Action};