import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExtractedVariable, Variable } from "@/shared/types/requestChain.model";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export interface RequestExecution {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  url: string;
  order: number;
  status: "passed" | "failed" | "skipped";
  responseSize: number;
  duration: number;
  responseStatusCode: number;
  extractedVariables: ExtractedVariable[] | null;
  substitutedVariables: { name: string; value: string; usedIn: string }[] | null;
  requestCurl: string;
  response: string;
}


export interface ReportData {
  id: string;
  name: string;
  workspaceId: string;
  environment: string;
  lastExecutionDate: string;
  duration: number;
  executedBy: string;
  successRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  skippedRequests: number;
  globalVariables: Variable[];
  extractedVariables: ExtractedVariable[];
  requestExecutions: RequestExecution[];
}


interface ExportHTMLButtonProps {
  reportData: ReportData;
}

export default function ExportHTMLButton({ reportData }: ExportHTMLButtonProps) {
  const { toast } = useToast();

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const calculateAvgResponseTime = () => {
    if (reportData.requestExecutions.length === 0) return 0;
    const totalDuration = reportData.requestExecutions.reduce((sum, req) => sum + req.duration, 0);
    return Math.round(totalDuration / reportData.requestExecutions.length);
  };

  const calculateTotalDataTransferred = () => {
    return reportData.requestExecutions.reduce((sum, req) => sum + req.responseSize, 0);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return "#10b981";
      case "failed":
        return "#ef4444";
      case "skipped":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const generateHTML = () => {
    const avgResponseTime = calculateAvgResponseTime();
    const totalDataTransferred = calculateTotalDataTransferred();

    const esc = escapeHtml;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(reportData.name)} - API Test Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      color: #0f172a;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
    }
    
    .header-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 48px 0;
      margin-bottom: 32px;
    }
    
    .header-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    
    .header-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    
    .meta-item {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 12px 16px;
      border-radius: 8px;
    }
    
    .meta-label {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .meta-value {
      font-size: 16px;
      font-weight: 600;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    
    .metric-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }
    
    .metric-label {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .metric-unit {
      font-size: 14px;
      color: #64748b;
      margin-left: 4px;
    }
    
    .section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #0f172a;
    }
    
    .request-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .request-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .request-order {
      background: #f1f5f9;
      color: #475569;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    
    .request-name {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      flex: 1;
    }
    
    .method-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .method-get { background: #dbeafe; color: #1e40af; }
    .method-post { background: #dcfce7; color: #15803d; }
    .method-put { background: #fef3c7; color: #a16207; }
    .method-delete { background: #fee2e2; color: #b91c1c; }
    .method-patch { background: #f3e8ff; color: #6b21a8; }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-passed { background: #dcfce7; color: #15803d; }
    .status-failed { background: #fee2e2; color: #b91c1c; }
    .status-skipped { background: #fef3c7; color: #a16207; }
    
    .request-url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #475569;
      margin-bottom: 12px;
      word-break: break-all;
    }
    
    .request-stats {
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: #64748b;
    }
    
    .code-block {
      background: #1e293b;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      overflow-x: auto;
      margin-top: 12px;
    }
    
    .code-block pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .variable-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    
    .variable-table th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .variable-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    
    .variable-table tr:last-child td {
      border-bottom: none;
    }
    
    .variable-name {
      font-family: 'JetBrains Mono', monospace;
      color: #0f172a;
      font-weight: 500;
    }
    
    .variable-value {
      font-family: 'JetBrains Mono', monospace;
      color: #475569;
      word-break: break-all;
    }
    
    .type-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .type-dynamic { background: #dbeafe; color: #1e40af; }
    .type-static { background: #f1f5f9; color: #475569; }
    .type-environment { background: #fef3c7; color: #a16207; }
    .type-extracted { background: #dcfce7; color: #15803d; }
    
    .footer {
      text-align: center;
      padding: 32px 0;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
      margin-top: 32px;
    }
    
    @media print {
      .header-section {
        background: #667eea !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header-section">
    <div class="container">
      <h1 class="header-title">${esc(reportData.name)}</h1>
      <div class="header-meta">
        <div class="meta-item">
          <div class="meta-label">Environment</div>
          <div class="meta-value">${esc(reportData.environment)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Executed By</div>
          <div class="meta-value">${esc(reportData.executedBy)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Execution Date</div>
          <div class="meta-value">${esc(new Date(reportData.lastExecutionDate).toLocaleString())}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Total Duration</div>
          <div class="meta-value">${reportData.duration}ms</div>
        </div>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value">${reportData.totalRequests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Successful</div>
        <div class="metric-value" style="color: #10b981">${reportData.successfulRequests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Failed</div>
        <div class="metric-value" style="color: #ef4444">${reportData.failedRequests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Skipped</div>
        <div class="metric-value" style="color: #f59e0b">${reportData.skippedRequests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Success Rate</div>
        <div class="metric-value">${reportData.successRate}<span class="metric-unit">%</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Avg Response Time</div>
        <div class="metric-value">${avgResponseTime}<span class="metric-unit">ms</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Data Transferred</div>
        <div class="metric-value" style="font-size: 20px">${formatBytes(totalDataTransferred)}</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Request Execution Timeline</h2>
      ${reportData.requestExecutions.map(req => `
        <div class="request-item">
          <div class="request-header">
            <div class="request-order">${req.order}</div>
            <div class="request-name">${esc(req.name)}</div>
            <span class="method-badge method-${esc(req.method.toLowerCase())}">${esc(req.method)}</span>
            <span class="status-badge status-${esc(req.status.toLowerCase())}">${esc(req.status)}</span>
          </div>
          <div class="request-url">${esc(req.url)}</div>
          <div class="request-stats">
            <span><strong>Status Code:</strong> ${req.responseStatusCode}</span>
            <span><strong>Duration:</strong> ${req.duration}ms</span>
            <span><strong>Size:</strong> ${esc(formatBytes(req.responseSize))}</span>
          </div>
          
          ${req.substitutedVariables && req.substitutedVariables.length > 0 ? `
            <div style="margin-top: 16px;">
              <strong style="font-size: 14px; color: #475569;">Variable Substitutions</strong>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Variables from previous requests used in this request</p>
              <table class="variable-table" style="margin-top: 8px;">
                <thead>
                  <tr>
                    <th>Variable Name</th>
                    <th>Value</th>
                    <th>Used In</th>
                  </tr>
                </thead>
                <tbody>
                  ${req.substitutedVariables.map(v => `
                    <tr>
                      <td class="variable-name">${esc(v.name)}</td>
                      <td class="variable-value" style="word-break: break-all;">${esc(v.value)}</td>
                      <td style="font-size: 12px; color: #64748b;">${esc(v.usedIn)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          ${req.extractedVariables && req.extractedVariables.length > 0 ? `
            <div style="margin-top: 16px;">
              <strong style="font-size: 14px; color: #475569;">Extracted Variables</strong>
              <table class="variable-table" style="margin-top: 8px;">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Source</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${req.extractedVariables.map(v => `
                    <tr>
                      <td class="variable-name">${esc(v.name)}</td>
                      <td class="variable-value" style="word-break: break-all;">${esc(v.value)}</td>
                      <td>${esc(v.source || '-')}</td>
                      <td><span class="type-badge type-${esc(v.status || 'success')}">${esc(v.status || 'success')}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <div style="margin-top: 16px;">
            <strong style="font-size: 14px; color: #475569;">Request cURL</strong>
            <div class="code-block"><pre>${esc(req.requestCurl)}</pre></div>
          </div>
          
          <div style="margin-top: 16px;">
            <strong style="font-size: 14px; color: #475569;">Response</strong>
            <div class="code-block"><pre>${esc(req.response)}</pre></div>
          </div>
        </div>
      `).join('')}
    </div>

    ${reportData.globalVariables.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Global Variables</h2>
        <table class="variable-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              <th>Type</th>
             
            </tr>
          </thead>
          <tbody>
            ${reportData.globalVariables.map(v => `
              <tr>
                <td class="variable-name">${esc(v.name)}</td>
                <td class="variable-value" style="word-break: break-all;">${esc(v?.value || "")}</td>
                <td><span class="type-badge type-${esc(v.type)}">${esc(v.type)}</span></td>
              
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${reportData.extractedVariables.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Extracted Variables</h2>
        <table class="variable-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.extractedVariables.map(v => `
              <tr>
                <td class="variable-name">${esc(v.name)}</td>
                <td class="variable-value" style="word-break: break-all;">${esc(v.value)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <div class="footer">
      Generated on ${new Date().toLocaleDateString()} • OptraFlow API Testing Platform
    </div>
  </div>
</body>
</html>`;
  };

  const handleExport = () => {
    try {
      console.log("Starting HTML export...");
      const htmlContent = generateHTML();
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `${reportData.name.replace(/\s+/g, "_")}_Report_${new Date().getTime()}.html`;

      link.href = url;
      link.download = filename;
      link.setAttribute("data-testid", "download-link-html");
      document.body.appendChild(link);

      console.log("Triggering download:", filename);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("Download triggered successfully");

        toast({
          title: "HTML Report Ready",
          description: "Your report has been downloaded successfully.",
        });
      }, 100);
    } catch (error) {
      console.error("HTML export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the HTML report.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={handleExport} data-testid="export-html-button" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group">
            <FileText className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Download HTML File</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
