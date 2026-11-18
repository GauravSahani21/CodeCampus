/**
 * CodeCampus Language-Aware Code Formatter
 * Supports Python, Java, C++, C, JavaScript, TypeScript, Go, C#, Rust
 */

export function formatCode(code: string, language: string): string {
  if (!code || typeof code !== 'string') return '';
  const trimmed = code.trim();
  if (!trimmed) return code;

  const lang = language.toLowerCase();

  // Python: Whitespace & indentation sensitive (PEP 8 clean-up)
  if (lang === 'python') {
    const lines = code.split(/\r?\n/);
    const cleaned = lines.map((l) => l.replace(/\t/g, '    ').trimEnd());
    const result: string[] = [];
    let blankCount = 0;

    for (const line of cleaned) {
      if (line.trim() === '') {
        blankCount++;
        if (blankCount <= 2 && result.length > 0) {
          result.push('');
        }
      } else {
        blankCount = 0;
        result.push(line);
      }
    }
    return result.join('\n').trimEnd() + '\n';
  }

  // Bracket-based languages (Java, C++, C, JavaScript, TypeScript, C#, Go, Rust)
  const lines = code.split(/\r?\n/);
  const indentStr = '    '; // 4 spaces
  let indentLevel = 0;
  const result: string[] = [];
  let blankCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      blankCount++;
      if (blankCount <= 1 && result.length > 0) {
        result.push('');
      }
      continue;
    }
    blankCount = 0;

    // Check if the current line starts with closing bracket
    const startsWithClosing = /^[\}\]\)]/.test(line);
    const effectiveIndent = Math.max(0, indentLevel - (startsWithClosing ? 1 : 0));

    result.push(indentStr.repeat(effectiveIndent) + line);

    // Calculate open vs close braces on this line, skipping string literals and line comments
    let opens = 0;
    let closes = 0;
    let inString: string | null = null;
    let isEscaped = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char === '\\') {
        isEscaped = true;
        continue;
      }

      if (inString) {
        if (char === inString) {
          inString = null;
        }
        continue;
      }

      if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
      }

      // Check for single-line comments
      if (char === '/' && line[i + 1] === '/') {
        break;
      }
      if (char === '#' && (lang === 'ruby' || lang === 'python')) {
        break;
      }

      if (char === '{' || char === '(' || char === '[') {
        if (char === '{') opens++;
      } else if (char === '}' || char === ')' || char === ']') {
        if (char === '}') closes++;
      }
    }

    indentLevel = Math.max(0, indentLevel + opens - closes);
  }

  return result.join('\n').trimEnd() + '\n';
}
