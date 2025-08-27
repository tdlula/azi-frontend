import jsPDF from "jspdf";

export interface PDFChartData {
  type: string;
  data: any;
  title?: string;
  width?: number;
  height?: number;
  radius?: number;
}

export interface PDFTableData {
  data: any;
  title?: string;
  width?: number;
}

export interface PDFReportOptions {
  messages: any[];
  enhancedReportData?: any;
  filename?: string;
}

export function generateChatPDF({ messages, enhancedReportData, filename = "chat-report.pdf" }: PDFReportOptions) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Helper functions (addWrappedText, drawBarChart, drawPieChart, drawTable) can be moved here from chat file
  // ...existing code...

  // Title and header
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(37, 99, 235);
  pdf.text("AI Chat Report", pageWidth / 2, currentY, { align: "center" });
  currentY += 15;

  // Metadata
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, currentY);
  currentY += 6;
  pdf.text(`Total Messages: ${messages.length}`, margin, currentY);
  currentY += 6;
  pdf.text(`Topic: General Chat Analysis`, margin, currentY);
  currentY += 15;

  // Separator line
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Chat Messages Section
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 0, 0);
  pdf.text("Chat History", margin, currentY);
  currentY += 10;

  // Process each message
  for (const message of messages) {
    // ...existing code for rendering each message, charts, tables...
  }

  pdf.save(filename);
}
