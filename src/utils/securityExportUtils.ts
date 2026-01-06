// src/utils/securityExportUtils.ts
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface Vulnerability {
  id: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  confidence?: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  recommendation?: string;
  cwe?: string;
  owasp?: string;
}

export interface ScanResult {
  scanId: string;
  completedAt: string;
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  informational: number;
  vulnerabilities: Vulnerability[];
  passedChecks: number;
}

export interface SecurityScanRequest {
  id: string;
  name: string;
  method: string;
  url: string;
}

/* =========================
   PDF EXPORT
   ========================= */

export const downloadSecurityScanAsPDF = async (
  elementId: string,
  filename: string
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF export');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    const imgW = pdfW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pdfH;

    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pdfH;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/* =========================
   HTML EXPORT
   ========================= */

export const downloadSecurityScanAsHTML = (
  scanResult: ScanResult,
  request: SecurityScanRequest,
  filename: string
) => {
  try {
    const htmlContent = buildSecurityScanHTMLDocument(scanResult, request);

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating HTML:', err);
    throw err;
  }
};

/* =========================
   SHARE FUNCTIONALITY
   ========================= */

export const shareSecurityScan = async (
  scanResult: ScanResult,
  request: SecurityScanRequest,
  requestId?: string
) => {
  // Create shareable URL if requestId is provided
  const shareUrl = requestId
    ? `${window.location.origin}/security-scan/${requestId}?scanId=${scanResult.scanId}`
    : null;

  const summaryText = `
Security Scan Results: ${request.name}
Endpoint: ${request.method} ${request.url}
Completed: ${new Date(scanResult.completedAt).toLocaleString()}

Total Issues: ${scanResult.totalIssues}
High Severity: ${scanResult.highSeverity}
Medium Severity: ${scanResult.mediumSeverity}
Low Severity: ${scanResult.lowSeverity}
Informational: ${scanResult.informational}
Passed Checks: ${scanResult.passedChecks}
${shareUrl ? `\n\nView full report: ${shareUrl}` : ''}
  `.trim();

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Security Scan: ${request.name}`,
        text: 'View this comprehensive security scan report',
        url: shareUrl || undefined,
      });
    } catch (error) {
      // User cancelled or share failed, fall through to clipboard
      if ((error as Error).name !== 'AbortError') {
        throw error;
      }
    }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareUrl || summaryText);
  } else {
    // Final fallback: prompt dialog
    prompt('Copy this shareable link:', shareUrl || summaryText);
  }
};

/* =========================
   HTML DOCUMENT BUILDER
   ========================= */

const escapeHtml = (s: string) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const getSeverityStyle = (
  severity: string
): { bg: string; color: string; icon: string } => {
  const styles: Record<string, { bg: string; color: string; icon: string }> = {
    high: { bg: '#fef2f2', color: '#991b1b', icon: '🔴' },
    medium: { bg: '#fff7ed', color: '#9a3412', icon: '🟠' },
    low: { bg: '#f0fdf4', color: '#166534', icon: '🟢' },
    info: { bg: '#fefce8', color: '#854d0e', icon: '🟡' },
  };
  return styles[severity] || styles.info;
};

const buildSecurityScanHTMLDocument = (
  scanResult: ScanResult,
  request: SecurityScanRequest
): string => {
  const formatDate = (d: string) => new Date(d).toLocaleString();

  const vulnerabilitiesHTML = scanResult.vulnerabilities
    .map((vuln, index) => {
      const style = getSeverityStyle(vuln.severity);
      const vulnId = `vuln-${index}`;

      return `
        <div style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;overflow:hidden;">
          <div style="padding:16px;background:#f9fafb;cursor:pointer;" onclick="toggleVuln('${vulnId}')">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:16px;">
              <div style="display:flex;align-items:center;gap:8px;flex:1;">
                <span id="toggle-${vulnId}" style="font-size:14px;">▶️</span>
                <div style="flex:1;">
                  <h4 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 4px 0;">${escapeHtml(
                    vuln.title
                  )}</h4>
                  <p style="font-size:14px;color:#6b7280;margin:0;">${escapeHtml(
                    vuln.description
                  )}</p>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
                <span style="padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;background:${
                  style.bg
                };color:${style.color};">
                  ${style.icon} ${vuln.severity.toUpperCase()}
                </span>
                ${
                  vuln.confidence
                    ? `
                  <span style="padding:2px 8px;border-radius:4px;font-size:11px;background:#f3f4f6;color:#374151;">
                    ${vuln.confidence} Confidence
                  </span>
                `
                    : ''
                }
              </div>
            </div>
          </div>
          <div id="${vulnId}" style="display:none;padding:20px;background:#fff;border-top:1px solid #e5e7eb;">
            ${
              vuln.recommendation
                ? `
              <div style="margin-bottom:16px;">
                <h5 style="font-size:14px;font-weight:600;color:#111827;margin:0 0 8px 0;">💡 Recommendation</h5>
                <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">${escapeHtml(
                  vuln.recommendation
                )}</p>
              </div>
            `
                : ''
            }
            <div style="display:flex;gap:16px;">
              ${
                vuln.cwe
                  ? `
                <div>
                  <span style="font-size:12px;color:#6b7280;">CWE:</span>
                  <span style="font-size:14px;font-weight:500;color:#111827;margin-left:4px;">${escapeHtml(
                    vuln.cwe
                  )}</span>
                </div>
              `
                  : ''
              }
              ${
                vuln.owasp
                  ? `
                <div>
                  <span style="font-size:12px;color:#6b7280;">OWASP:</span>
                  <span style="font-size:14px;font-weight:500;color:#111827;margin-left:4px;">${escapeHtml(
                    vuln.owasp
                  )}</span>
                </div>
              `
                  : ''
              }
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Security Scan Report - ${escapeHtml(request.name)}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;margin:0;padding:20px;background:#f5f5f5;line-height:1.5}
        .report-container{max-width:1200px;margin:0 auto}
        @media print{body{background:#fff}.report-container{max-width:none}}
      </style>
      <script>
        function toggleVuln(id){
          const el=document.getElementById(id);
          const t=document.getElementById('toggle-'+id);
          if(!el||!t)return;
          if(el.style.display==='none'||!el.style.display){
            el.style.display='block';
            t.textContent='🔽';
          } else {
            el.style.display='none';
            t.textContent='▶️';
          }
        }
      </script>
    </head>
    <body>
      <div class="report-container">
        <!-- Header -->
        <div style="background:#fff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);padding:32px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px;">
            <div>
              <h1 style="font-size:30px;font-weight:700;color:#111827;margin:0 0 8px 0;">
                🛡️ Security Scan Report
              </h1>
              <p style="font-size:16px;color:#6b7280;margin:0 0 8px 0;">
                <strong>${escapeHtml(request.name)}</strong>
              </p>
              <p style="font-size:14px;color:#6b7280;margin:0;">
                <span style="padding:2px 8px;background:#dbeafe;color:#1e40af;border-radius:4px;font-weight:500;">
                  ${escapeHtml(request.method)}
                </span>
                <span style="margin-left:8px;">${escapeHtml(request.url)}</span>
              </p>
            </div>
            <div style="text-align:right;">
              <h2 style="font-size:24px;font-weight:700;color:#2563eb;margin:0;">Optraflow</h2>
              <p style="font-size:14px;color:#6b7280;margin:0;">Security Analysis</p>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px;padding:12px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:4px;">
            <span style="font-size:14px;color:#1e40af;">
              ⏱️ Completed: ${formatDate(scanResult.completedAt)}
            </span>
          </div>
        </div>

        <!-- Summary Cards -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-bottom:24px;">
          <div style="background:#fff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);padding:20px;text-align:center;">
            <p style="font-size:12px;color:#6b7280;margin:0 0 8px 0;font-weight:500;">Total Issues</p>
            <p style="font-size:28px;font-weight:700;color:#111827;margin:0;">${
              scanResult.totalIssues
            }</p>
          </div>
          
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;text-align:center;">
            <p style="font-size:12px;color:#991b1b;margin:0 0 8px 0;font-weight:500;">High</p>
            <p style="font-size:28px;font-weight:700;color:#dc2626;margin:0;">${
              scanResult.highSeverity
            }</p>
          </div>
          
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;text-align:center;">
            <p style="font-size:12px;color:#9a3412;margin:0 0 8px 0;font-weight:500;">Medium</p>
            <p style="font-size:28px;font-weight:700;color:#ea580c;margin:0;">${
              scanResult.mediumSeverity
            }</p>
          </div>
          
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;text-align:center;">
            <p style="font-size:12px;color:#166534;margin:0 0 8px 0;font-weight:500;">Low</p>
            <p style="font-size:28px;font-weight:700;color:#16a34a;margin:0;">${
              scanResult.lowSeverity
            }</p>
          </div>
          
          <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:20px;text-align:center;">
            <p style="font-size:12px;color:#854d0e;margin:0 0 8px 0;font-weight:500;">Info</p>
            <p style="font-size:28px;font-weight:700;color:#ca8a04;margin:0;">${
              scanResult.informational
            }</p>
          </div>
          
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;text-align:center;">
            <p style="font-size:12px;color:#166534;margin:0 0 8px 0;font-weight:500;">Passed</p>
            <p style="font-size:28px;font-weight:700;color:#059669;margin:0;">${
              scanResult.passedChecks
            }</p>
          </div>
        </div>

        <!-- Vulnerabilities -->
        <div style="background:#fff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);padding:24px;margin-bottom:24px;">
          <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 20px 0;">
            🔍 Detected Vulnerabilities (${scanResult.vulnerabilities.length})
          </h2>
          ${
            vulnerabilitiesHTML ||
            '<p style="text-align:center;color:#6b7280;padding:40px 0;">No vulnerabilities detected</p>'
          }
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:32px;color:#6b7280;font-size:14px;">
          <p style="margin:0;">Generated by Optraflow Security Scanner</p>
          <p style="margin:4px 0 0 0;">Powered by ZAP Proxy • Report generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
