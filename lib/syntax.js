const Parser = require('./parser.js');
const {contextSwitch, contextPop, tokenGroup, tokenMatch} = require('./directive.js');
const {Context, Rule, Action} = require('./construct.js');

const CTX_DIRECTIVE = [];
const RULE_DIRECTIVE = new Rule('\\s*([\\w_]+)(?:\\s+([^;]+?))?\\s*;', new Action([
  contextSwitch(c => new Context('directive', CTX_DIRECTIVE, c)),
  tokenGroup('identifier'),
  tokenGroup('parameters'),
  contextPop(1),
]));
const RULE_EXIT_BLOCK = new Rule('\\s*}', new Action(contextPop(1)));
const CTX_REGEX = [
  new Rule('\\\\.', new Action(tokenMatch('string'))),
  new Rule('\\/', new Action(contextPop(1))),
  new Rule('[^\\\\\\/]+', new Action(tokenMatch('string'))),
];
const CTX_ACTION = [
  RULE_EXIT_BLOCK,
  RULE_DIRECTIVE,
];
const CTX_RULE = [
  new Rule('\\s*\\{', new Action(
    contextSwitch(c => new Context('action', CTX_ACTION, c), null, true))),
  new Rule('\\s*;', new Action([
    contextSwitch(c => new Context('action', CTX_ACTION, c), null, true),
    contextPop(1),
  ])),
];
const CTX_CONTEXT = [
  RULE_EXIT_BLOCK,
  new Rule('\\s*\\/', new Action([
    contextSwitch(c => new Context('rule', CTX_RULE, c)),
    contextSwitch(c => new Context('regex', CTX_REGEX, c)),
  ])),
  new Rule('\\s*(\\**[\\w_]+)\\s*;', new Action(tokenGroup('include'))),
];
const CTX_ROOT = [
  new Rule('\\s*action\\s+([\\w_]+)\\s*\\{', new Action([
    contextSwitch(c => new Context('action', CTX_ACTION, c)),
    tokenGroup('identifier'),
  ])),
  new Rule('\\s*rule\\s+([\\w_]+)\\s+\\/', new Action([
    contextSwitch(c => new Context('rule', CTX_RULE, c)),
    tokenGroup('identifier'),
    contextSwitch(c => new Context('regex', CTX_REGEX, c)),
  ])),
  new Rule('\\s*context\\s+([\\w_]+)\\s*\\{', new Action([
    contextSwitch(c => new Context('context', CTX_CONTEXT, c)),
    tokenGroup('identifier'),
  ])),
  new Rule('\\s*context\\s+([\\w_]+)\\s*;', new Action([
    contextSwitch(c => new Context('context', CTX_CONTEXT, c)),
    tokenGroup('identifier'),
    contextPop(1),
  ])),
];

module.exports = new Parser(() => new Context('root', CTX_ROOT));