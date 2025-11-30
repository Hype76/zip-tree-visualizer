import { SecurityAnalysisResult, SecurityScore } from '../types/security';

export const calculateScore = (
  issues: SecurityAnalysisResult['issues'],
  alerts: SecurityAnalysisResult['alerts']
): SecurityScore => {
  
  let score = 100;
  
  const counts = {
    secrets: 0,
    dangerous: 0,
    obfuscation: 0,
    todos: 0,
    mismatches: 0,
    zipbomb: 0
  };

  // Tally Issues
  issues.forEach(i => {
    if (i.category === 'secret') counts.secrets++;
    if (i.category === 'danger') counts.dangerous++;
    if (i.category === 'obfuscation') counts.obfuscation++;
    if (i.category === 'todo') counts.todos++;
  });

  // Tally Alerts
  alerts.forEach(a => {
    if (a.issue === 'zip-bomb-indicator') counts.zipbomb++;
    if (a.issue === 'extension-mismatch' || a.issue === 'binary-mismatch') counts.mismatches++;
  });

  // Apply Deductions
  score -= (counts.dangerous * 15);
  score -= (counts.secrets * 10);
  score -= (counts.obfuscation * 5);
  score -= (counts.mismatches * 10);
  score -= (counts.zipbomb * 20);
  score -= (counts.todos * 1); // Minor penalty for sloppy code

  // Clamp Score
  score = Math.max(0, Math.min(100, score));

  let status: SecurityScore['status'] = "clean";
  if (score < 80) status = "warning";
  if (score < 50) status = "high-risk";
  if (counts.dangerous > 0 || counts.secrets > 0) status = "high-risk";

  return {
    score,
    status,
    summaryCounts: counts
  };
};
