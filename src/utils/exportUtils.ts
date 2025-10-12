import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadAsPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Get the report details section for better PDF content
  const reportContent = document.getElementById('report-content');
  const reportDetails = document.getElementById('report-details');
  
  if (!reportContent || !reportDetails) return;

  // Create a temporary container with both sections
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '1200px';
  tempContainer.style.backgroundColor = '#f5f5f5';
  tempContainer.style.padding = '32px';
  
  // Clone and append the content
  const clonedContent = reportContent.cloneNode(true) as HTMLElement;
  const clonedDetails = reportDetails.cloneNode(true) as HTMLElement;
  
  tempContainer.appendChild(clonedContent);
  tempContainer.appendChild(clonedDetails);
  document.body.appendChild(tempContainer);

  try {
    // Generate canvas from the temporary container
    const canvas = await html2canvas(tempContainer, {
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    // Remove temporary container
    document.body.removeChild(tempContainer);
  }
};

export const downloadAsHTML = (elementId: string, filename: string) => {
  const reportContent = document.getElementById('report-content');
  const reportDetails = document.getElementById('report-details');
  
  if (!reportContent || !reportDetails) return;

  try {
    // Clone both sections
    const clonedContent = reportContent.cloneNode(true) as HTMLElement;
    const clonedDetails = reportDetails.cloneNode(true) as HTMLElement;

    // Create complete HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Suite Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .report-container { max-width: 1200px; margin: 0 auto; }
          .bg-white { background-color: white; }
          .rounded-lg { border-radius: 8px; }
          .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .p-6 { padding: 24px; }
          .mb-8 { margin-bottom: 32px; }
          .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
          .font-bold { font-weight: 700; }
          .text-gray-900 { color: #111827; }
          .mb-4 { margin-bottom: 16px; }
          .mb-2 { margin-bottom: 8px; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .bg-blue-600 { background-color: #2563eb; }
          .bg-green-600 { background-color: #16a34a; }
          .bg-red-600 { background-color: #dc2626; }
          .bg-yellow-600 { background-color: #ca8a04; }
          .bg-orange-600 { background-color: #ea580c; }
          .bg-purple-600 { background-color: #9333ea; }
          .mt-6 { margin-top: 24px; }
          .rounded { border-radius: 4px; }
          .mt-4 { margin-top: 16px; }
          .space-y-6 > * + * { margin-top: 24px; }
          .space-y-4 > * + * { margin-top: 16px; }
          .text-gray-600 { color: #4b5563; }
          .w-4 { width: 16px; }
          .h-4 { height: 16px; }
          .text-green-800 { color: #166534; }
          .p-4 { padding: 16px; }
          .text-red-800 { color: #991b1b; }
          .text-yellow-800 { color: #92400e; }
          .px-4 { padding-left: 16px; padding-right: 16px; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .text-white { color: white; }
          .grid { display: grid; }
          .gap-6 { gap: 24px; }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .border-green-200 { border-color: #bbf7d0; }
          .border-red-200 { border-color: #fecaca; }
          .border-yellow-200 { border-color: #fde68a; }
          .border-blue-200 { border-color: #bfdbfe; }
          .border-t { border-top-width: 1px; }
          .border-gray-100 { border-color: #f3f4f6; }
          @media (max-width: 768px) { .grid-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media print { body { background-color: white; } }
          .overflow-hidden { overflow: hidden; }
          .overflow-x-auto { overflow-x: auto; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
          .block { display: block; }
          pre { background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 0.875rem; overflow-x: auto; }
          code { background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 0.875rem; display: block; overflow-x: auto; }
          .space-x-4 > * + * { margin-left: 16px; }
          .space-x-2 > * + * { margin-left: 8px; }
        </style>
      </head>
      <body>
        <div class="report-container">
          ${clonedContent.outerHTML}
          ${clonedDetails.outerHTML}
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
  } catch (error) {
    console.error('Error generating HTML:', error);
    alert('Failed to generate HTML. Please try again.');
  }
};

export const shareReport = (reportName: string) => {
  const shareUrl = `${window.location.origin}${window.location.pathname}?suite=${encodeURIComponent(reportName)}`;
  
  if (navigator.share) {
    // Use Web Share API if available
    navigator.share({
      title: `Test Suite Report: ${reportName}`,
      text: 'View this comprehensive API test suite report',
      url: shareUrl,
    }).catch(console.error);
  } else if (navigator.clipboard) {
    // Fallback to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Shareable link copied to clipboard!');
    }).catch(() => {
      // Final fallback - show the URL
      prompt('Copy this shareable link:', shareUrl);
    });
  } else {
    // Final fallback - show the URL
    prompt('Copy this shareable link:', shareUrl);
  }
};