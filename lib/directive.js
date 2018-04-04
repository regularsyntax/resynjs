const ParseError = require('./error.js');

module.exports = {
  contextPop(count) {
    return (state, match, nextToken) => {
      if (count < 1) state.throwError('Invalid exit count!');
      for (let i = 0; i < count; i++) {
        if (!state.context.parent) state.throwError('Context does not have parent!');
        state.popContext();
      }
    }
  },
  contextSwitch(contextBinder, name = null, visiting = false) {
    return (state, match, nextToken) => {
      const ctx = contextBinder(state.context);
      ctx.visiting = visiting;
      state.setContext(ctx, name || ctx.name);
    };
  },
  executeAction(action) {
    return action.doExecute.bind(action);
  },
  tokenGroup(name) {
    return (state, match, nextToken) => state.putToken({name, type: 'node', content: nextToken()});
  },
  tokenMatch(name) {
    return (state, match, nextToken) => state.putToken({name, type: 'node', content: match});
  },
  parse(token, contexts, actions) {
    let args = token.children[1].content;
    args = args ? args.split(/\\s+/g) : [];
    switch (token.children[0].content) {
      case 'do':
        if (args.length !== 1) throw new ParseError('Wrong number of parameters to do!');
        if (!actions.has(args[0])) throw new ParseError(`Unknown action: ${args[0]}`);
        return this.executeAction(actions.get(args[0]));
      case 'enter':
        if (args.length < 1 || args.length > 2) {
          throw new ParseError('Wrong number of parameters to enter!');
        }
        if (!contexts.has(args[0])) throw new ParseError(`Unknown context: ${args[0]}`);
        return this.contextSwitch(contexts.get(args[0]), args.length === 2 ? args[1] : null);
      case 'visit':
        if (args.length < 1 || args.length > 2) {
          throw new ParseError(`Wrong number of parameters to visit!`);
        }
        if (!contexts.has(args[0])) throw new ParseError(`Unknown context: ${args[0]}`);
        return this.contextSwitch(contexts.get(args[0]), args.length === 2 ? args[1] : null, true);
      case 'exit':
        if (args.length > 1) throw new ParseError('Wrong number of parameters to exit!');
        let count = args[0] ? parseInt(args[0], 10) : 1;
        if (isNaN(count)) throw new ParseError(`Invalid parameter to exit: ${args[0]}`);
        return this.contextPop(count);
      case 'take':
        if (args.length !== 1) throw new ParseError('Wrong number of parameters to take!');
        return this.tokenGroup(args[0]);
      case 'grab':
        if (args.length !== 1) throw new ParseError('Wrong number of parameters to grab!');
        return this.tokenMatch(args[0]);
    }
    throw new ParseError(`Unknown directive: ${token.children[0].content}`);
  },
};