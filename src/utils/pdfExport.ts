import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  quality?: number;
}

export const exportToPDF = async (
  elementRef: React.RefObject<HTMLElement>,
  options: PDFExportOptions = {}
): Promise<void> => {
  const {
    filename = `radio-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
    format = 'a4',
    orientation = 'portrait',
    margin = 10,
    quality = 0.98
  } = options;

  try {
    const element = elementRef.current;
    if (!element) {
      throw new Error('Element reference is null');
    }

    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-family: Arial, sans-serif;
      ">
        <div style="text-align: center;">
          <div style="
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 0 auto 20px;
          "></div>
          <p>Generating PDF Report...</p>
          <p style="font-size: 14px; opacity: 0.8;">Please wait while we process your report</p>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingDiv);

    // Configure canvas options for better quality
    const canvasOptions = {
      allowTaint: true,
      useCORS: true,
      scale: 2, // Higher scale for better quality
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      width: element.scrollWidth,
      height: element.scrollHeight
    };

    // Generate canvas from the element
    const canvas = await html2canvas(element, canvasOptions);
    const imgData = canvas.toDataURL('image/png', quality);

    // Calculate PDF dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // PDF page dimensions (in mm)
    const pageWidth = format === 'a4' ? 210 : 216; // A4: 210mm, Letter: 216mm
    const pageHeight = format === 'a4' ? 297 : 279; // A4: 297mm, Letter: 279mm
    
    const availableWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - (margin * 2);
    
    // Calculate scaling to fit content
    const ratio = Math.min(availableWidth / (imgWidth * 0.264583), availableHeight / (imgHeight * 0.264583));
    const scaledWidth = imgWidth * 0.264583 * ratio;
    const scaledHeight = imgHeight * 0.264583 * ratio;

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format
    });

    // Calculate centering offsets
    const xOffset = (pageWidth - scaledWidth) / 2;
    const yOffset = margin;

    // If content is taller than one page, we need to split it
    if (scaledHeight > availableHeight) {
      const pageCount = Math.ceil(scaledHeight / availableHeight);
      
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const sourceY = (imgHeight / pageCount) * i;
        const sourceHeight = Math.min(imgHeight / pageCount, imgHeight - sourceY);
        
        // Create a canvas for this page section
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        
        pageCanvas.width = imgWidth;
        pageCanvas.height = sourceHeight;
        
        if (pageCtx) {
          pageCtx.drawImage(
            canvas,
            0, sourceY, imgWidth, sourceHeight,
            0, 0, imgWidth, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png', quality);
          pdf.addImage(
            pageImgData,
            'PNG',
            xOffset,
            yOffset,
            scaledWidth,
            Math.min(availableHeight, (scaledHeight / pageCount))
          );
        }
      }
    } else {
      // Single page
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
    }

    // Add metadata
    pdf.setProperties({
      title: 'Radio Analytics Report',
      subject: 'AI-Generated Radio Analytics Report',
      author: 'Azi Analytics Platform',
      creator: 'Azi Analytics Platform'
    });

    // Remove loading overlay
    document.body.removeChild(loadingDiv);

    // Save the PDF
    pdf.save(filename);

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-family: Arial, sans-serif;
        max-width: 300px;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">✓</span>
          <div>
            <div style="font-weight: bold;">Report Generated Successfully!</div>
            <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">PDF saved as: ${filename}</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 7000);

  } catch (error) {
    // Remove loading overlay if it exists
    const loadingOverlay = document.querySelector('[style*="position: fixed"][style*="z-index: 9999"]');
    if (loadingOverlay) {
      document.body.removeChild(loadingOverlay);
    }

    console.error('Error generating PDF:', error);
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-family: Arial, sans-serif;
        max-width: 300px;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">⚠</span>
          <div>
            <div style="font-weight: bold;">PDF Generation Failed</div>
            <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">Please try again or contact support</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 7000);

    throw error;
  }
};

export const printReport = (elementRef: React.RefObject<HTMLElement>): void => {
  const element = elementRef.current;
  if (!element) {
    console.error('Element reference is null');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Radio Analytics Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          @media print {
            body {
              padding: 0;
            }
            .chart-container {
              break-inside: avoid;
            }
          }
          ${document.head.querySelector('style')?.textContent || ''}
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);
};
