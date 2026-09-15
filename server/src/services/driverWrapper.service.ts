/**
 * Driver Wrapper Service
 * 
 * Separates user-facing solution stub from driver harness (stdin parsing, invocation, stdout printing).
 * Users write only the solution function/class (e.g. def twoSum / class Solution),
 * while test execution automatically wraps the solution with the driver harness.
 */

export function cleanStarterTemplate(language: string, code?: string): string {
  if (!code) return '';
  const trimmed = code.trim();

  if (language === 'python') {
    if (trimmed.includes('def reverseList')) {
      const defIdx = trimmed.indexOf('def reverseList');
      const afterDef = trimmed.substring(defIdx);
      const lines = afterDef.split('\n');
      const defLines = [lines[0]];
      for (let i = 1; i < lines.length; i++) {
        const l = lines[i];
        if (l.trim() === '' || l.startsWith('    ') || l.startsWith('\t')) {
          defLines.push(l);
        } else break;
      }
      return `# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\n` + defLines.join('\n').trim();
    }

    const sysMatch = trimmed.search(/(?:^|\n)(import sys|from sys|data = sys\.stdin|if __name__|lines = sys\.stdin|s = sys\.stdin)/);
    if (sysMatch > 0) {
      return trimmed.substring(0, sysMatch).trim();
    }
    if (sysMatch === 0 || (sysMatch > 0 && trimmed.indexOf('def ') > sysMatch)) {
      const defIdx = trimmed.indexOf('def ');
      if (defIdx >= 0) {
        const afterDef = trimmed.substring(defIdx);
        const lines = afterDef.split('\n');
        const defLines = [lines[0]];
        for (let i = 1; i < lines.length; i++) {
          const l = lines[i];
          if (l.trim() === '' || l.startsWith('    ') || l.startsWith('\t')) {
            defLines.push(l);
          } else break;
        }
        return defLines.join('\n').trim();
      }
    }
    const fnMatch = trimmed.match(/(def\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*:(?:\n[ \t]+[^\n]+)+)/);
    if (fnMatch) return fnMatch[1].trim();
  }

  if (language === 'java') {
    if (trimmed.includes('public static void main')) {
      const mainIdx = trimmed.indexOf('public static void main');
      const beforeMain = trimmed.substring(0, mainIdx).trim();
      let methodPart = beforeMain;
      methodPart = methodPart.replace(/^import\s+[^;]+;\s*/gm, '');
      methodPart = methodPart.replace(/public\s+class\s+[A-Za-z0-9_]+\s*\{/, '');
      methodPart = methodPart.trim();
      const lines = methodPart.split('\n').map(l => l.startsWith('    ') ? l : '    ' + l).join('\n');
      return `class Solution {\n${lines}\n}`;
    }
  }

  if (language === 'cpp') {
    const mainIdx = trimmed.indexOf('int main(');
    if (mainIdx > 0) {
      let codePart = trimmed.substring(0, mainIdx).trim();
      codePart = codePart.replace(/^#include\s+<[^>]+>\s*/gm, '');
      codePart = codePart.replace(/^using\s+namespace\s+std;\s*/gm, '');
      return codePart.trim();
    }
  }

  if (language === 'javascript') {
    const fnMatch = trimmed.match(/(function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\})/);
    if (fnMatch) return fnMatch[1].trim();
  }

  return trimmed;
}

export function wrapCodeWithDriver(
  language: string,
  userCode: string,
  problemOrTemplate?: any
): string {
  if (!userCode || !userCode.trim()) return userCode;
  const u = userCode.trim();

  // If problem object passed, pick template for language
  let fullTemplate = '';
  if (typeof problemOrTemplate === 'string') {
    fullTemplate = problemOrTemplate;
  } else if (problemOrTemplate && typeof problemOrTemplate === 'object') {
    fullTemplate =
      problemOrTemplate.driverCode?.[language] ||
      problemOrTemplate.starterTemplates?.[language] ||
      '';
  }

  if (!fullTemplate || !fullTemplate.trim()) {
    return userCode;
  }

  const f = fullTemplate.trim();

  if (language === 'python') {
    // If user already supplied stdin reading, don't double wrap
    if (u.includes('sys.stdin') || u.includes('import sys') || u.includes('__main__')) {
      return userCode;
    }

    if (f.includes('def reverseList')) {
      const defIdx = f.indexOf('def reverseList');
      const afterDef = f.substring(defIdx);
      const lines = afterDef.split('\n');
      let endIdx = lines.length;
      for (let i = 1; i < lines.length; i++) {
        const l = lines[i];
        if (l.trim() !== '' && !l.startsWith('    ') && !l.startsWith('\t')) {
          endIdx = i;
          break;
        }
      }
      const stub = lines.slice(0, endIdx).join('\n');
      const driver = f.replace(stub, '').trim();
      return `${u}\n\n${driver}`;
    }

    const sysIdx = f.search(/(?:^|\n)(import sys|from sys|data = sys\.stdin|if __name__|lines = sys\.stdin|s = sys\.stdin)/);
    if (sysIdx > 0 && !f.substring(0, sysIdx).includes('def ')) {
      // sys is at top
      const defIdx = f.indexOf('def ');
      if (defIdx >= 0) {
        const afterDef = f.substring(defIdx);
        const lines = afterDef.split('\n');
        let endIdx = lines.length;
        for (let i = 1; i < lines.length; i++) {
          const l = lines[i];
          if (l.trim() !== '' && !l.startsWith('    ') && !l.startsWith('\t')) {
            endIdx = i;
            break;
          }
        }
        const stub = lines.slice(0, endIdx).join('\n');
        const driver = f.replace(stub, '').trim();
        return `${u}\n\n${driver}`;
      }
    }

    const fnMatch = f.match(/(def\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*:(?:\n[ \t]+[^\n]+)+)/);
    let driver = f;
    if (fnMatch) {
      driver = f.replace(fnMatch[1], '').trim();
    } else if (sysIdx >= 0) {
      driver = f.substring(sysIdx).trim();
    }

    return `${u}\n\n${driver}`;
  }

  if (language === 'java') {
    // If user already wrote main method, don't wrap
    if (u.includes('public static void main')) {
      return userCode;
    }

    const mainIdx = f.indexOf('public static void main');
    if (mainIdx > 0) {
      const beforeMain = f.substring(0, mainIdx);
      let mainPart = f.substring(mainIdx).trim().replace(/\n\s*\}\s*$/, '');

      // Identify method name in driver template to ensure call dispatch works
      const fnMatch = beforeMain.match(/(?:static\s+)?[A-Za-z0-9_\[\]<>]+\s+([A-Za-z0-9_]+)\s*\(/);
      if (fnMatch) {
        const fnName = fnMatch[1];
        mainPart = mainPart.replace(new RegExp('\\b' + fnName + '\\s*\\(', 'g'), `new Solution().${fnName}(`);
      }

      // Collect imports
      let imports = 'import java.util.*;\n';
      const importMatches = f.match(/^import\s+[^;]+;\s*/gm);
      if (importMatches) {
        imports = Array.from(new Set(importMatches)).join('\n') + '\n';
      }

      let userClass = u;
      // Strip any "public" modifier from class Solution in user code so Main can be the only public class
      userClass = userClass.replace(/public\s+class\s+Solution/, 'class Solution');
      if (!userClass.includes('class Solution') && !userClass.includes('class Main')) {
        userClass = `class Solution {\n${userClass}\n}`;
      }

      // Check for helper classes like ListNode
      let helperClass = '';
      const helperMatch = f.match(/(static\s+class\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\n\s*\})/);
      if (helperMatch && !userClass.includes('class ListNode')) {
        helperClass = `\n${helperMatch[1].replace('static class', 'class').trim()}\n`;
      }

      return `${imports}
public class Main {
    ${mainPart}
}
${helperClass}
${userClass}
`;
    }

    return userCode;
  }

  if (language === 'cpp') {
    // If user already wrote main function, don't wrap
    if (u.includes('int main(')) {
      return userCode;
    }

    const mainIdx = f.indexOf('int main(');
    if (mainIdx > 0) {
      const headers =
        f.match(/(#include[^\n]+\n|using namespace[^\n]+;\n)+/)?.[0] ||
        '#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n';
      const mainPart = f.substring(mainIdx);
      return `${headers}\n${u}\n\n${mainPart}`;
    }

    return userCode;
  }

  if (language === 'javascript') {
    // If user already wrote stdin handler, don't wrap
    if (u.includes('readline') || u.includes('process.stdin')) {
      return userCode;
    }

    const fnMatch = f.match(/(function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\})/);
    let driver = f;
    if (fnMatch) {
      driver = f.replace(fnMatch[1], '').trim();
    }

    return `${u}\n\n${driver}`;
  }

  return userCode;
}
