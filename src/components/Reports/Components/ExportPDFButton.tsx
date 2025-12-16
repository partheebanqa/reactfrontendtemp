import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";

import { format } from "date-fns";
import { ExtractedVariable, Variable } from "@/shared/types/requestChain.model";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { convertDateStamp } from "@/utils/exportDate";


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

interface ExportPDFButtonProps {
  reportData: ReportData;
}

export default function ExportPDFButton({ reportData }: ExportPDFButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    try {
      // console.log("Starting PDF export...");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(reportData.name, margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("API Request Chain Execution Report", margin, yPosition);
      yPosition += 15;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Execution Summary", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryData = [
        `Execution Date: ${convertDateStamp(Date.parse(reportData.lastExecutionDate)).dateTime}`,
        `Duration: ${reportData.duration < 1000 ? `${reportData.duration}ms` : `${(reportData.duration / 1000).toFixed(2)}s`}`,
        `Executed By: ${reportData.executedBy}`,
        `Environment: ${reportData.environment}`,
      ];

      summaryData.forEach(line => {
        doc.text(line, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 5;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Performance Metrics", margin, yPosition);
      yPosition += 8;

      const avgResponseTime = reportData.requestExecutions.length > 0
        ? Math.round(reportData.requestExecutions.reduce((sum, req) => sum + req.duration, 0) / reportData.requestExecutions.length)
        : 0;

      const totalDataTransferred = reportData.requestExecutions.reduce((sum, req) => sum + req.responseSize, 0);
      const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const col1X = margin + 5;
      const col2X = pageWidth / 2;
      const colWidth = (pageWidth - 2 * margin - 10) / 2;

      doc.setFillColor(240, 240, 240);
      doc.rect(col1X - 5, yPosition - 5, colWidth, 50, 'F');
      doc.rect(col2X, yPosition - 5, colWidth, 50, 'F');

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Total Requests", col1X, yPosition);
      doc.text("Success Rate", col2X + 5, yPosition);
      yPosition += 7;

      doc.setFontSize(18);
      doc.setTextColor(33, 150, 243);
      doc.text(reportData.totalRequests.toString(), col1X, yPosition);

      const successColor = reportData.successRate === 100 ? [76, 175, 80] :
        reportData.successRate >= 80 ? [255, 152, 0] : [244, 67, 54];
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      doc.text(`${reportData.successRate}%`, col2X + 5, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(`Passed: ${reportData.successfulRequests}`, col1X, yPosition);
      doc.text(`Avg Response: ${avgResponseTime}ms`, col2X + 5, yPosition);
      yPosition += 6;

      doc.text(`Failed: ${reportData.failedRequests}`, col1X, yPosition);
      doc.text(`Data Transfer: ${formatBytes(totalDataTransferred)}`, col2X + 5, yPosition);
      yPosition += 6;

      doc.text(`Skipped: ${reportData.skippedRequests}`, col1X, yPosition);
      yPosition += 15;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Request Execution Details", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("#", margin, yPosition);
      doc.text("Request Name", margin + 10, yPosition);
      doc.text("Status", margin + 90, yPosition);
      doc.text("Duration", margin + 120, yPosition);
      doc.text("Status Code", margin + 155, yPosition);
      yPosition += 5;

      doc.setFont("helvetica", "normal");

      const sortedRequests = [...reportData.requestExecutions].sort((a, b) => a.order - b.order);

      sortedRequests.forEach((req, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        const statusColor = req.status === "passed" ? [76, 175, 80] :
          req.status === "failed" ? [244, 67, 54] : [158, 158, 158];

        doc.setTextColor(0, 0, 0);
        doc.text(req.order.toString(), margin, yPosition);

        const requestName = req.name.length > 35 ? req.name.substring(0, 32) + "..." : req.name;
        doc.text(requestName, margin + 10, yPosition);

        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(req.status.toUpperCase(), margin + 90, yPosition);

        doc.setTextColor(0, 0, 0);
        doc.text(`${req.duration}ms`, margin + 120, yPosition);
        doc.text(req.responseStatusCode.toString(), margin + 155, yPosition);

        yPosition += 6;
      });

      yPosition += 10;
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${format(new Date(), "MM/dd/yyyy 'at' h:mm a")} • OptraFlow API Testing Platform`, margin, yPosition);

      const fileName = `${reportData.name.replace(/[^a-z0-9]/gi, '_')}_Summary_${Date.now()}.pdf`;
      doc.save(fileName);

      // console.log("PDF exported successfully:", fileName);
      toast({
        title: "PDF Summary Ready",
        description: `${fileName} has been downloaded.`,
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={handleExport} data-testid="export-html-button" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group">
            <Download className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Download PDF Summary</TooltipContent>
      </Tooltip>
    </TooltipProvider>

  );
}
