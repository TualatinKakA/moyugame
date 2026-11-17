const astCache = new Map();
const MAX_CACHE_SIZE = 512;

const FUNCTIONS = Object.freeze({
  ln: Math.log,
  log: Math.log,
  log10: Math.log10,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  min: Math.min,
  max: Math.max,
});

export class FormulaError extends Error {
  constructor(message, { formula, contentId = 'unknown', phase = 'unknown', variables = {} } = {}) {
    super(`[${contentId}/${phase}] ${message}; formula=${JSON.stringify(formula)}; variables=${JSON.stringify(variables)}`);
    this.name = 'FormulaError';
    this.contentId = contentId;
    this.phase = phase;
    this.formula = formula;
    this.variables = variables;
  }
}

export function cleanFormula(formula) {
  return String(formula ?? '')
    .split(/,?\s+where\s+/i)[0]
    .replace(/%/g, '')
    .replace(/as a percent/ig, '')
    .trim();
}

function tokenize(text, meta) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const space = rest.match(/^\s+/);
    if (space) { i += space[0].length; continue; }
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]) });
      i += number[0].length;
      continue;
    }
    const identifier = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      tokens.push({ type: 'identifier', value: identifier[0] });
      i += identifier[0].length;
      continue;
    }
    const char = text[i];
    if ('+-*/^(),'.includes(char)) {
      tokens.push({ type: char, value: char });
      i++;
      continue;
    }
    throw new FormulaError(`Unsupported token ${JSON.stringify(char)}`, { ...meta, formula: text });
  }
  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

function parse(formula, meta = {}) {
  const cleaned = cleanFormula(formula);
  if (!cleaned) throw new FormulaError('Formula is empty', { ...meta, formula });
  const tokens = tokenize(cleaned, { ...meta, formula });
  let cursor = 0;
  const peek = () => tokens[cursor];
  const take = type => {
    if (peek().type !== type) throw new FormulaError(`Expected ${type}, got ${peek().type}`, { ...meta, formula });
    return tokens[cursor++];
  };

  function primary() {
    if (peek().type === 'number') return { type: 'number', value: take('number').value };
    if (peek().type === 'identifier') {
      const name = take('identifier').value;
      if (peek().type !== '(') return { type: 'variable', name };
      take('(');
      if (!Object.hasOwn(FUNCTIONS, name)) throw new FormulaError(`Function ${name} is not whitelisted`, { ...meta, formula });
      const args = [];
      if (peek().type !== ')') {
        args.push(expression());
        while (peek().type === ',') { take(','); args.push(expression()); }
      }
      take(')');
      return { type: 'call', name, args };
    }
    if (peek().type === '(') {
      take('(');
      const node = expression();
      take(')');
      return node;
    }
    throw new FormulaError(`Unexpected ${peek().type}`, { ...meta, formula });
  }

  function unary() {
    if (peek().type === '+' || peek().type === '-') {
      const operator = tokens[cursor++].type;
      return { type: 'unary', operator, argument: unary() };
    }
    return primary();
  }

  function power() {
    const left = unary();
    if (peek().type !== '^') return left;
    take('^');
    return { type: 'binary', operator: '^', left, right: power() };
  }

  function term() {
    let node = power();
    while (peek().type === '*' || peek().type === '/') {
      const operator = tokens[cursor++].type;
      node = { type: 'binary', operator, left: node, right: power() };
    }
    return node;
  }

  function expression() {
    let node = term();
    while (peek().type === '+' || peek().type === '-') {
      const operator = tokens[cursor++].type;
      node = { type: 'binary', operator, left: node, right: term() };
    }
    return node;
  }

  const ast = expression();
  if (peek().type !== 'eof') throw new FormulaError(`Unexpected trailing ${peek().type}`, { ...meta, formula });
  return ast;
}

function compiledAst(formula, meta) {
  const key = cleanFormula(formula);
  if (!astCache.has(key)) {
    if (astCache.size >= MAX_CACHE_SIZE) astCache.delete(astCache.keys().next().value);
    astCache.set(key, parse(formula, meta));
  }
  return astCache.get(key);
}

function evaluateAst(node, context, meta) {
  if (node.type === 'number') return node.value;
  if (node.type === 'variable') {
    if (!Object.hasOwn(context, node.name)) throw new FormulaError(`Unknown variable ${node.name}`, meta);
    const value = Number(context[node.name]);
    if (!Number.isFinite(value)) throw new FormulaError(`Variable ${node.name} is not finite`, meta);
    return value;
  }
  if (node.type === 'unary') {
    const value = evaluateAst(node.argument, context, meta);
    return node.operator === '-' ? -value : value;
  }
  if (node.type === 'call') {
    const args = node.args.map(arg => evaluateAst(arg, context, meta));
    return FUNCTIONS[node.name](...args);
  }
  const left = evaluateAst(node.left, context, meta);
  const right = evaluateAst(node.right, context, meta);
  if (node.operator === '+') return left + right;
  if (node.operator === '-') return left - right;
  if (node.operator === '*') return left * right;
  if (node.operator === '/') return left / right;
  if (node.operator === '^') return left ** right;
  throw new FormulaError(`Unknown operator ${node.operator}`, meta);
}

export function validateFormula(formula, options = {}) {
  const ast = compiledAst(formula, options);
  const variables = new Set();
  const visit = node => {
    if (node.type === 'variable') variables.add(node.name);
    if (node.argument) visit(node.argument);
    if (node.args) node.args.forEach(visit);
    if (node.left) visit(node.left);
    if (node.right) visit(node.right);
  };
  visit(ast);
  const allowed = options.allowedVariables ? new Set(options.allowedVariables) : null;
  if (allowed) {
    for (const name of variables) {
      if (!allowed.has(name)) throw new FormulaError(`Variable ${name} is not declared`, { ...options, formula });
    }
  }
  return [...variables];
}

export function evaluateFormula(formula, context = {}, options = {}) {
  const meta = { ...options, formula, variables: context };
  const result = evaluateAst(compiledAst(formula, meta), context, meta);
  if (!Number.isFinite(result)) throw new FormulaError(`Formula produced non-finite result ${result}`, meta);
  return result;
}

export function formulaContext(stats, x, extras = {}) {
  return { ...stats, ...extras, x: typeof x === 'string' ? stats[x] : x };
}

export function formulaCacheInfo() {
  return { size: astCache.size, maxSize: MAX_CACHE_SIZE };
}
