import { SecurityIssue } from '../types/security';

export const scanContent = (path: string, content: string): SecurityIssue[] => {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  // Regex Patterns
  const patterns = {
    danger: [
      { regex: /eval\s*\(/, label: "Dangerous Eval usage" },
      { regex: /new\s+Function\s*\(/, label: "Dangerous Function constructor" },
      { regex: /setTimeout\s*\(\s*['"`]/, label: "String-based setTimeout (eval-like)" },
      { regex: /child_process/, label: "Node.js child_process access" },
    ],
    obfuscation: [
      { regex: /atob\s*\(/, label: "Base64 decoding (atob)" },
      { regex: /btoa\s*\(/, label: "Base64 encoding (btoa)" },
      { regex: /[A-Za-z0-9+/=]{200,}/, label: "Suspiciously long Base64 string" },
      { regex: /\\x[0-9A-Fa-f]{2}.{0,5}\\x[0-9A-Fa-f]{2}/, label: "Hex encoding detected" }
    ],
    secret: [
      { regex: /(AWS|aws|Aws)(_)?(ACCESS|SECRET|access|secret)(_)?(KEY|key)/, label: "Possible AWS Key" },
      { regex: /sk_live_[0-9a-zA-Z]{24}/, label: "Stripe Live Key" },
      { regex: /sk_test_[0-9a-zA-Z]{24}/, label: "Stripe Test Key" },
      { regex: /-----BEGIN PRIVATE KEY-----/, label: "Private Key Block" },
      { regex: /Authorization:\s*['"`]?Bearer/, label: "Hardcoded Bearer Token" },
      { regex: /ghp_[0-9a-zA-Z]{36}/, label: "GitHub Personal Access Token" }
    ],
    todo: [
      { regex: /\/\/\s*TODO/, label: "TODO Comment" },
      { regex: /\/\/\s*FIXME/, label: "FIXME Comment" },
      { regex: /\/\/\s*HACK/, label: "HACK Comment" }
    ]
  };

  lines.forEach((line, index) => {
    // Skip extremely long lines to avoid regex DoS
    if (line.length > 2000) return;

    // Check Danger
    patterns.danger.forEach(p => {
        if (p.regex.test(line)) {
            issues.push({ path, line: index + 1, category: "danger", issue: p.label, context: line.trim() });
        }
    });

    // Check Obfuscation
    patterns.obfuscation.forEach(p => {
        if (p.regex.test(line)) {
            issues.push({ path, line: index + 1, category: "obfuscation", issue: p.label, context: line.trim().substring(0, 50) + '...' });
        }
    });

    // Check Secrets
    patterns.secret.forEach(p => {
        if (p.regex.test(line)) {
            issues.push({ path, line: index + 1, category: "secret", issue: p.label, context: "REDACTED" });
        }
    });

    // Check TODOs
    patterns.todo.forEach(p => {
        if (p.regex.test(line)) {
            issues.push({ path, line: index + 1, category: "todo", issue: p.label, context: line.trim() });
        }
    });
  });

  return issues;
};
