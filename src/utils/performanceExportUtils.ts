import { PerformanceAnalyzerResult } from '@/services/executeRequest.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ShareResult {
  method: 'shared' | 'clipboard' | 'execCommand' | 'cancelled';
}

/**
 * Download performance report as PDF
 */
export async function downloadPerformanceReportAsPDF(
  elementId: string,
  filename: string,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found for PDF generation');
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio,
    );

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Download performance report as HTML
 */
export function downloadPerformanceReportAsHTML(
  result: PerformanceAnalyzerResult,
  request: { name: string; method: string; url: string },
  filename: string,
): void {
  const performanceOverview = {
    excellent: result.results.filter((r) => r.score >= 90).length,
    good: result.results.filter((r) => r.score >= 70 && r.score < 90).length,
    needsWork: result.results.filter((r) => r.score >= 50 && r.score < 70)
      .length,
    critical: result.results.filter((r) => r.score < 50).length,
  };

  const priorityRecommendations = result.results
    .filter((r) => !r.passed || r.score < 70)
    .slice(0, 5)
    .map((r, idx) => ({
      priority: idx + 1,
      text: r.suggestions[0] || r.details,
      check: r.name,
    }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return { bg: '#dcfce7', text: '#15803d' };
    if (grade.startsWith('B')) return { bg: '#fef3c7', text: '#a16207' };
    if (grade.startsWith('C')) return { bg: '#fed7aa', text: '#c2410c' };
    return { bg: '#fee2e2', text: '#dc2626' };
  };

  const getSeverityColor = (score: number) => {
    if (score >= 90)
      return { bg: '#dcfce7', border: '#22c55e', text: '#15803d' };
    if (score >= 70)
      return { bg: '#fef3c7', border: '#eab308', text: '#a16207' };
    if (score >= 50)
      return { bg: '#fed7aa', border: '#fb923c', text: '#c2410c' };
    return { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' };
  };

  const gradeColors = getGradeColor(result.grade);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Report - ${request.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .header-info {
      font-size: 14px;
      opacity: 0.95;
      margin-top: 8px;
    }
    
    .header-meta {
      display: flex;
      gap: 20px;
      margin-top: 15px;
      font-size: 13px;
      opacity: 0.9;
    }
    
    .content {
      padding: 30px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .score-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .score-circle {
      width: 140px;
      height: 140px;
      margin: 0 auto 15px;
      position: relative;
    }
    
    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 36px;
      font-weight: bold;
      color: ${getScoreColor(result.overallScore)};
    }
    
    .score-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: -5px;
    }
    
    .grade-badge {
      display: inline-block;
      background: ${gradeColors.bg};
      color: ${gradeColors.text};
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }
    
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .overview-item {
      padding: 15px;
      border-radius: 8px;
      border: 1px solid;
    }
    
    .overview-item.excellent {
      background: #dcfce7;
      border-color: #22c55e;
    }
    
    .overview-item.good {
      background: #fef3c7;
      border-color: #eab308;
    }
    
    .overview-item.needs-work {
      background: #fed7aa;
      border-color: #fb923c;
    }
    
    .overview-item.critical {
      background: #fee2e2;
      border-color: #ef4444;
    }
    
    .overview-value {
      font-size: 24px;
      font-weight: bold;
    }
    
    .overview-item.excellent .overview-value { color: #15803d; }
    .overview-item.good .overview-value { color: #a16207; }
    .overview-item.needs-work .overview-value { color: #c2410c; }
    .overview-item.critical .overview-value { color: #dc2626; }
    
    .overview-label {
      font-size: 12px;
      margin-top: 2px;
    }
    
    .overview-item.excellent .overview-label { color: #15803d; }
    .overview-item.good .overview-label { color: #a16207; }
    .overview-item.needs-work .overview-label { color: #c2410c; }
    .overview-item.critical .overview-label { color: #dc2626; }
    
    .priorities-card {
      background: #fef3c7;
      border: 1px solid #eab308;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    
    .priorities-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .priority-item {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 13px;
      color: #374151;
    }
    
    .priority-number {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      background: #eab308;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 11px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #1f2937;
    }
    
    .checks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .check-item {
      border: 1px solid #e5e7eb;
      border-left-width: 4px;
      border-radius: 6px;
      padding: 15px;
      background: white;
    }
    
    .check-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .check-name {
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
    }
    
    .check-score {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .score-bar {
      width: 80px;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
    }
    
    .score-bar-fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .score-number {
      font-weight: bold;
      font-size: 12px;
    }
    
    .check-details {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    
    .suggestions {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      margin: 10px -15px -15px;
      padding: 12px 15px;
    }
    
    .suggestions-title {
      font-weight: 600;
      font-size: 12px;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .suggestion-item {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 6px;
      padding-left: 15px;
      position: relative;
    }
    
    .suggestion-item::before {
      content: '•';
      color: #3b82f6;
      position: absolute;
      left: 0;
    }
    
    .footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 20px 30px;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }
    
    .metadata-table {
      width: 100%;
      margin-top: 20px;
    }
    
    .metadata-table td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    .metadata-table td:first-child {
      color: #6b7280;
      width: 120px;
    }
    
    .metadata-table td:last-child {
      font-family: monospace;
      color: #1f2937;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>
        ⚡ Performance Analysis Report
      </h1>
      <div class="header-info">
        <strong>${request.method}</strong> ${request.url}
      </div>
      <div class="header-meta">
        <span>📊 Request: ${request.name}</span>
        <span>⏱️ Duration: ${new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()}ms</span>
        <span>✅ Completed: ${new Date(result.completedAt).toLocaleString()}</span>
      </div>
    </div>
    
    <div class="content">
      <div class="grid">
        <div>
          <div class="score-card">
            <h3 class="section-title">Overall Score</h3>
            <div class="score-circle">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="60" fill="none" stroke="#e5e7eb" stroke-width="12"/>
                <circle cx="70" cy="70" r="60" fill="none" 
                  stroke="${getScoreColor(result.overallScore)}" 
                  stroke-width="12" 
                  stroke-dasharray="${(result.overallScore / 100) * 377} 377"
                  stroke-linecap="round"
                  transform="rotate(-90 70 70)"
                />
              </svg>
              <div class="score-value">${result.overallScore}</div>
            </div>
            <div class="score-label">out of 100</div>
            <div style="margin-top: 15px;">
              <span class="grade-badge">${result.grade}</span>
            </div>
          </div>
          
          <div class="score-card" style="margin-top: 20px;">
            <h3 class="section-title">Performance Overview</h3>
            <div class="overview-grid">
              <div class="overview-item excellent">
                <div class="overview-value">${performanceOverview.excellent}</div>
                <div class="overview-label">Excellent</div>
              </div>
              <div class="overview-item good">
                <div class="overview-value">${performanceOverview.good}</div>
                <div class="overview-label">Good</div>
              </div>
              <div class="overview-item needs-work">
                <div class="overview-value">${performanceOverview.needsWork}</div>
                <div class="overview-label">Needs Work</div>
              </div>
              <div class="overview-item critical">
                <div class="overview-value">${performanceOverview.critical}</div>
                <div class="overview-label">Critical</div>
              </div>
            </div>
          </div>
          
          ${
            priorityRecommendations.length > 0
              ? `
          <div class="priorities-card">
            <div class="priorities-header">
              ⚠️ Top Priorities
            </div>
            ${priorityRecommendations
              .map(
                (rec) => `
              <div class="priority-item">
                <div class="priority-number">${rec.priority}</div>
                <div>${rec.text}</div>
              </div>
            `,
              )
              .join('')}
          </div>
          `
              : ''
          }
        </div>
        
        <div>
          <h3 class="section-title">Detailed Results (${result.results.length})</h3>
          <div class="checks-list">
            ${result.results
              .map((check) => {
                const colors = getSeverityColor(check.score);
                return `
              <div class="check-item" style="border-left-color: ${colors.border};">
                <div class="check-header">
                  <div class="check-name">${check.name}</div>
                  <div class="check-score">
                    <div class="score-bar">
                      <div class="score-bar-fill" style="width: ${check.score}%; background: ${colors.border};"></div>
                    </div>
                    <span class="score-number" style="color: ${colors.border};">${check.score}</span>
                  </div>
                </div>
                <div class="check-details">${check.details}</div>
                ${
                  check.suggestions.length > 0
                    ? `
                <div class="suggestions">
                  <div class="suggestions-title">Suggestions:</div>
                  ${check.suggestions
                    .map(
                      (suggestion) =>
                        `<div class="suggestion-item">${suggestion}</div>`,
                    )
                    .join('')}
                </div>
                `
                    : ''
                }
              </div>
            `;
              })
              .join('')}
          </div>
        </div>
      </div>
      
      <table class="metadata-table">
        <tr>
          <td>Analysis ID:</td>
          <td>${result.analyserId}</td>
        </tr>
        <tr>
          <td>Request ID:</td>
          <td>${result.requestId}</td>
        </tr>
        <tr>
          <td>Status:</td>
          <td style="color: #22c55e; font-weight: 600;">${result.status.charAt(0).toUpperCase() + result.status.slice(1)}</td>
        </tr>
        <tr>
          <td>Started At:</td>
          <td>${new Date(result.startedAt).toLocaleString()}</td>
        </tr>
        <tr>
          <td>Completed At:</td>
          <td>${new Date(result.completedAt).toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <div class="footer">
      <p>Performance Analysis Report generated on ${new Date().toLocaleString()}</p>
      <p style="margin-top: 5px;">Analyzed ${result.results.length} performance checks • Overall Score: ${result.overallScore}/100 (${result.grade})</p>
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share performance report using Web Share API or clipboard
 */
export async function sharePerformanceReport(
  result: PerformanceAnalyzerResult,
  request: { name: string; method: string; url: string },
): Promise<ShareResult> {
  const performanceOverview = {
    excellent: result.results.filter((r) => r.score >= 90).length,
    good: result.results.filter((r) => r.score >= 70 && r.score < 90).length,
    needsWork: result.results.filter((r) => r.score >= 50 && r.score < 70)
      .length,
    critical: result.results.filter((r) => r.score < 50).length,
  };

  const topIssues = result.results
    .filter((r) => !r.passed || r.score < 70)
    .slice(0, 3)
    .map((r) => `• ${r.name}: ${r.details}`)
    .join('\n');

  const shareText = `
🚀 Performance Analysis Report

📊 Endpoint: ${request.method} ${request.url}
⭐ Overall Score: ${result.overallScore}/100 (${result.grade})

📈 Performance Overview:
✅ Excellent: ${performanceOverview.excellent}
👍 Good: ${performanceOverview.good}
⚠️ Needs Work: ${performanceOverview.needsWork}
🔴 Critical: ${performanceOverview.critical}

${topIssues ? `🔍 Top Issues:\n${topIssues}\n` : ''}
⏱️ Analysis Duration: ${new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()}ms
📅 Completed: ${new Date(result.completedAt).toLocaleString()}

Total Checks: ${result.results.length}
Passed: ${result.results.filter((r) => r.passed).length}
Failed: ${result.results.filter((r) => !r.passed).length}
  `.trim();

  // Try Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Performance Report - ${request.name}`,
        text: shareText,
      });
      return { method: 'shared' };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { method: 'cancelled' };
      }
      // Fall through to clipboard if share fails
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(shareText);
    return { method: 'clipboard' };
  } catch (error) {
    // Final fallback: execCommand (deprecated but widely supported)
    const textArea = document.createElement('textarea');
    textArea.value = shareText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return { method: 'execCommand' };
    } catch (error) {
      document.body.removeChild(textArea);
      throw new Error('Failed to copy to clipboard');
    }
  }
}
