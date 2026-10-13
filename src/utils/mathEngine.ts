/**
 * Motor de evaluación matemática seguro (100% libre de eval y new Function)
 * Utiliza algoritmo de parseo Shunting-Yard (Dijkstra) con soporte para:
 * +, -, *, /, %, ^, paréntesis, normalización de coma decimal y redondeo contable.
 */

type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
}

const PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '%': 2,
  '^': 3,
};

const ASSOCIATIVITY: Record<string, 'L' | 'R'> = {
  '+': 'L',
  '-': 'L',
  '*': 'L',
  '/': 'L',
  '%': 'L',
  '^': 'R',
};

/**
 * Normaliza la expresión reemplazando símbolos visuales y comas decimales
 */
export function normalizeExpression(expr: string): string {
  if (!expr) return '';
  return expr
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/−/g, '-');
}

/**
 * Convierte una cadena matemática en una lista de tokens seguros
 */
function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  const normalized = normalizeExpression(expr);
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];

    // Espacios
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Paréntesis
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Operadores
    if (['+', '-', '*', '/', '%', '^'].includes(char)) {
      // Manejar números negativos unarios: al inicio o después de '(' u otro operador
      const prev = tokens[tokens.length - 1];
      const isUnary =
        char === '-' && (!prev || prev.type === 'OPERATOR' || prev.type === 'LPAREN');

      if (isUnary) {
        // Leer el número negativo
        let numStr = '-';
        i++;
        while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
          numStr += normalized[i];
          i++;
        }
        if (numStr === '-') {
          // Es un operador unario suelto, tratamos como -1 *
          tokens.push({ type: 'NUMBER', value: '-1' });
          tokens.push({ type: 'OPERATOR', value: '*' });
        } else {
          tokens.push({ type: 'NUMBER', value: numStr });
        }
        continue;
      }

      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    // Números con decimales
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      let hasDot = false;
      while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
        if (normalized[i] === '.') {
          if (hasDot) break; // evitar números con doble punto
          hasDot = true;
        }
        numStr += normalized[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Caracter ignorado o inválido
    i++;
  }

  return tokens;
}

/**
 * Convierte notación infija a postfija (Reverse Polish Notation) usando Shunting-Yard
 */
function toRPN(tokens: Token[]): Token[] {
  const outputQueue: Token[] = [];
  const operatorStack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'NUMBER') {
      outputQueue.push(token);
    } else if (token.type === 'OPERATOR') {
      const op1 = token.value;
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (top.type === 'OPERATOR') {
          const op2 = top.value;
          const p1 = PRECEDENCE[op1] || 0;
          const p2 = PRECEDENCE[op2] || 0;
          const assoc = ASSOCIATIVITY[op1] || 'L';

          if ((assoc === 'L' && p1 <= p2) || (assoc === 'R' && p1 < p2)) {
            outputQueue.push(operatorStack.pop()!);
            continue;
          }
        }
        break;
      }
      operatorStack.push(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type !== 'LPAREN'
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      if (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type === 'LPAREN'
      ) {
        operatorStack.pop(); // Descartar '('
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op.type !== 'LPAREN' && op.type !== 'RPAREN') {
      outputQueue.push(op);
    }
  }

  return outputQueue;
}

/**
 * Evalúa una cola RPN y retorna el resultado numérico seguro
 */
function evaluateRPN(rpnTokens: Token[]): number {
  const stack: number[] = [];

  for (const token of rpnTokens) {
    if (token.type === 'NUMBER') {
      const num = parseFloat(token.value);
      if (isNaN(num)) throw new Error('Número inválido');
      stack.push(num);
    } else if (token.type === 'OPERATOR') {
      if (stack.length < 2) throw new Error('Expresión incompleta');
      const b = stack.pop()!;
      const a = stack.pop()!;

      let res = 0;
      switch (token.value) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) throw new Error('División por cero');
          res = a / b;
          break;
        case '%':
          // Cálculo de porcentaje contextual: a * (b / 100)
          res = (a * b) / 100;
          break;
        case '^':
          res = Math.pow(a, b);
          break;
        default:
          throw new Error(`Operador desconocido: ${token.value}`);
      }

      // Redondeo de precisión para evitar 0.30000000000000004
      stack.push(roundToPrecision(res, 10));
    }
  }

  if (stack.length !== 1) {
    throw new Error('Sintaxis inválida');
  }

  return roundToPrecision(stack[0], 10);
}

/**
 * Redondeo seguro para evitar imprecisiones de punto flotante
 */
export function roundToPrecision(val: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Función principal para evaluar cualquier expresión aritmética de forma segura
 */
export function safeEvaluate(expr: string): { success: boolean; result: number; error?: string } {
  try {
    const trimmed = expr.trim();
    if (!trimmed) {
      return { success: true, result: 0 };
    }

    const tokens = tokenize(trimmed);
    if (tokens.length === 0) {
      return { success: true, result: 0 };
    }

    const rpn = toRPN(tokens);
    if (rpn.length === 0) {
      return { success: true, result: 0 };
    }

    const value = evaluateRPN(rpn);
    return { success: true, result: value };
  } catch (err) {
    return {
      success: false,
      result: 0,
      error: err instanceof Error ? err.message : 'Error de cálculo',
    };
  }
}

/**
 * Formatea un número en estilo hispanohablante/financiero legible
 */
export function formatNumber(val: number, maxDecimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return 'Error';
  return val.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Extrae y suma todos los números o montos encontrados en un texto de notas
 * Permite "Auto-Sumar Renglones" de una lista de gastos
 */
export function extractNumbersAndSum(text: string): { items: number[]; total: number } {
  if (!text) return { items: [], total: 0 };

  // Detecta números con separadores comunes (ej: 15.000, 15000, 34.50, $25,000)
  const regex = /[-+]?\s*[$€£]?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)/g;
  const items: number[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    let raw = match[1];
    if (!raw) continue;

    // Normalizar separadores: si tiene punto de miles y coma decimal o viceversa
    if (raw.includes('.') && raw.includes(',')) {
      if (raw.indexOf('.') < raw.indexOf(',')) {
        // Formato 1.500,50
        raw = raw.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato 1,500.50
        raw = raw.replace(/,/g, '');
      }
    } else if (raw.includes(',')) {
      // Si tiene coma única, puede ser decimal
      raw = raw.replace(',', '.');
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      // Respetar signo si lo tiene
      const fullMatch = match[0].trim();
      const signed = fullMatch.startsWith('-') ? -parsed : parsed;
      items.push(signed);
    }
  }

  const total = items.reduce((acc, curr) => acc + curr, 0);
  return { items, total: roundToPrecision(total, 4) };
}
