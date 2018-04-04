const fs = require('fs');
const Parser = require('./index.js');

const args = process.argv.slice(2);
if (args.length != 2) {
  console.log("Usage: resyn <syntax file> <input file>");
  process.exitCode = 1;
} else {
  let parser = null;
  try {
    const syntax = fs.readFileSync(args[0], {encoding: 'utf8'});
    parser = Parser.create(syntax);
  } catch (e) {
    console.log(`Invalid syntax specification: ${e.message}`);
    console.log(e);
    process.exitCode = 1;
  }
  if (parser) {
    try {
      const input = fs.readFileSync(args[1], {encoding: 'utf8'});
      console.log(JSON.stringify(parser.parse(input), null, '  '));
    } catch (e) {
      console.log(`Parsing failed: ${e.message}`);
      process.exitCode = 1;
    }
  }
}