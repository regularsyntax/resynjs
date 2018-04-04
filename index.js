const Parser = require('./lib/parser.js');
const parserParser = require('./lib/syntax.js');
const ParseError = require('./lib/error.js');
const {Context, Rule, Action} = require('./lib/construct.js');
const directives = require('./lib/directive.js');

Parser.create = function(syntax) {
  const parsed = parserParser.parse(syntax);
  const actionTokens = new Map();
  const ruleTokens = new Map();
  const contextTokens = new Map();
  for (const token of parsed.children) {
    const identifier = token.children[0].content;
    switch (token.name) {
      case 'action':
        if (actionTokens.has(identifier)) {
          throw new ParseError(`Duplicate action: ${identifier}`);
        }
        actionTokens.set(identifier, token);
        break;
      case 'rule':
        if (ruleTokens.has(identifier)) {
          throw new ParseError(`Duplicate rule: ${identifier}`);
        }
        ruleTokens.set(identifier, token);
        break;
      case 'context':
        if (contextTokens.has(identifier)) {
          throw new ParseError(`Duplicate context: ${identifier}`);
        }
        contextTokens.set(identifier, token);
        break;
    }
  }
  if (!contextTokens.has('root')) throw new ParseError('No root context!');

  const actions = new Map();
  const rules = new Map();
  const uninitializedRules = [];
  const contexts = new Map();
  for (const action of actionTokens.keys()) actions.set(action, new Action());
  for (const [name, rule] of ruleTokens) {
    const pattern = rule.children[1].children.map(c => c.content).join('');
    const newRule = new Rule(pattern, new Action());
    rules.set(name, newRule);
    uninitializedRules.push([newRule, rule.children[2].children]);
  }
  for (const [name, context] of contextTokens) {
    const contextRules = [];
    const tokens = context.children;
    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === 'node') {
        const identifier = token.content;
        if (identifier.startsWith("*")) {
          const exitCount = identifier.lastIndexOf("*") + 1;
          identifier = identifier.substring(exitCount);
          if (!rules.has(identifier)) throw new ParseError(`Unknown rule: ${identifier}`);
          const parent = rules.get(identifier);
          const rule = new Rule(parent.rawPattern, new Action());
          rule.action.directives.push(directive.executeAction(parent.action));
          rule.action.directives.push(directive.contextPop(exitCount));
          contextRules.push(rule);
        } else {
          if (!rules.has(identifier)) throw new ParseError(`Unknown rule: ${identifier}`);
          contextRules.push(rules.get(identifier));
        }
      } else {
        const pattern = token.children[0].children.map(t => t.content).join('');
        const newRule = new Rule(pattern, new Action());
        contextRules.push(newRule);
        uninitializedRules.push([newRule, token.children[1].children]);
      }
    }
    contexts.set(name, c => new Context(name, contextRules, c));
  }

  for (const [name, action] of actions) {
    const tokens = actionTokens.get(name).children;
    for (let i = 1; i < tokens.length; i++) {
      action.directives.push(directives.parse(tokens[i], contexts, actions));
    }
  }
  for (const [rule, dirs] of uninitializedRules) {
    for (const dir of dirs) {
      rule.action.directives.push(directives.parse(dir, contexts, actions));
    }
  }
  const rootFactory = contexts.get("root");
  return new Parser(() => rootFactory(null));
}

module.exports = Parser;