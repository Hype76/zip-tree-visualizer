import React, { useState } from 'react';
import { Bot, Check } from 'lucide-react';
import { SecurityAnalysisResult } from '../types/security';
import { Button } from './Button';

export const AiPromptButton: React.FC<{ result: SecurityAnalysisResult }> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const generatePrompt = () => {
    const summary = `
Security Score: ${result.score.score}/100 (${result.score.status})
Findings:
- Secrets: ${result.score.summaryCounts.secrets}
- Dangerous Functions: ${result.score.summaryCounts.dangerous}
- Alerts: ${result.score.summaryCounts.mismatches}
    `;
    
    return `I am working on a project with the following file structure and security analysis.
Please review architecture, risks, and organisation.

<file_structure>
${result.asciiTree}
</file_structure>

<security_summary>
${summary.trim()}
</security_summary>

Please provide a detailed technical assessment.`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
        onClick={handleCopy} 
        variant="primary"
        className="bg-indigo-600 hover:bg-indigo-500 border-indigo-500 shadow-indigo-900/20"
        icon={copied ? <Check className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
    >
        {copied ? 'Prompt Copied!' : 'Copy for AI Agent'}
    </Button>
  );
};