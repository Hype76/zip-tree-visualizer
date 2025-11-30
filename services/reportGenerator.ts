import { SecurityAnalysisResult } from "../types/security";
// @ts-ignore
import { jsPDF } from "jspdf";

export const generateJSONReport = (result: SecurityAnalysisResult) => {
  const json = JSON.stringify(result, (key, value) => {
    if (key === 'binary' || key === 'content') return undefined; // Exclude heavy data
    return value;
  }, 2);
  downloadFile(json, "security_report.json", "application/json");
};

export const generateTextReport = (result: SecurityAnalysisResult) => {
  let text = `ZIPTREE SECURITY REPORT\n=======================\n\n`;
  text += `Score: ${result.score.score}/100 (${result.score.status})\n`;
  text += `Files: ${result.stats.totalFiles} | Size: ${(result.stats.totalSize/1024).toFixed(2)} KB\n\n`;
  
  text += `ISSUES FOUND:\n-------------\n`;
  result.issues.forEach(i => {
    text += `[${i.category.toUpperCase()}] ${i.path}:${i.line} - ${i.issue}\n`;
  });

  text += `\nALERTS:\n-------\n`;
  result.alerts.forEach(a => {
    text += `[ALERT] ${a.path} - ${a.details}\n`;
  });

  text += `\nFILE TREE:\n----------\n${result.asciiTree}`;
  
  downloadFile(text, "security_report.txt", "text/plain");
};

export const generatePDFReport = (result: SecurityAnalysisResult) => {
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(16);
  doc.text("ZipTree Security Analysis", 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Security Score: ${result.score.score}/100`, 10, y);
  y += 7;
  doc.text(`Status: ${result.score.status.toUpperCase()}`, 10, y);
  y += 10;

  doc.text(`Summary:`, 10, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(`- Dangerous Matches: ${result.score.summaryCounts.dangerous}`, 15, y); y+=5;
  doc.text(`- Potential Secrets: ${result.score.summaryCounts.secrets}`, 15, y); y+=5;
  doc.text(`- Alerts/Mismatches: ${result.score.summaryCounts.mismatches}`, 15, y); y+=10;

  doc.setFontSize(12);
  doc.text("Top Security Issues:", 10, y);
  y += 7;
  doc.setFontSize(9);
  
  result.issues.slice(0, 15).forEach(issue => {
    const line = `[${issue.category}] ${issue.path.substring(0, 40)}: ${issue.issue}`;
    doc.text(line, 10, y);
    y += 5;
    if (y > 280) {
        doc.addPage();
        y = 10;
    }
  });

  if (result.issues.length > 15) {
      doc.text(`... and ${result.issues.length - 15} more issues.`, 10, y);
  }

  doc.save("ziptree_report.pdf");
};

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};