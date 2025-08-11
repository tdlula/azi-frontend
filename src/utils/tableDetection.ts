export interface TableData {
  headers: string[];
  rows: string[][];
  title?: string;
}

export function detectAndParseTable(content: string): TableData | null {
  // Remove extra whitespace and normalize line endings
  const normalizedContent = content.trim().replace(/\r\n/g, '\n');
  
  // Check for markdown table format
  const lines = normalizedContent.split('\n');
  
  // Look for table patterns - markdown tables typically have | characters
  const potentialTableLines = lines.filter(line => 
    line.trim().includes('|') && 
    line.trim().split('|').length >= 3 // At least 2 columns plus empty edges
  );
  
  if (potentialTableLines.length < 2) {
    return null; // Need at least header and one data row
  }
  
  // Find the start of the table
  let tableStartIndex = -1;
  let tableEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('|') && line.split('|').length >= 3) {
      if (tableStartIndex === -1) {
        tableStartIndex = i;
      }
      tableEndIndex = i;
    } else if (tableStartIndex !== -1 && line === '') {
      // Empty line might continue the table context
      continue;
    } else if (tableStartIndex !== -1) {
      // Non-table line after table started, end the table
      break;
    }
  }
  
  if (tableStartIndex === -1 || tableEndIndex === -1) {
    return null;
  }
  
  const tableLines = lines.slice(tableStartIndex, tableEndIndex + 1)
    .filter(line => line.trim().includes('|'))
    .map(line => line.trim());
  
  if (tableLines.length < 2) {
    return null;
  }
  
  // Parse headers (first line)
  const headerLine = tableLines[0];
  const headers = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell !== ''); // Remove empty cells from edges
  
  if (headers.length === 0) {
    return null;
  }
  
  // Skip separator line if it exists (lines with --- pattern)
  let dataStartIndex = 1;
  if (tableLines.length > 1 && tableLines[1].includes('-')) {
    dataStartIndex = 2;
  }
  
  // Parse data rows
  const rows: string[][] = [];
  for (let i = dataStartIndex; i < tableLines.length; i++) {
    const line = tableLines[i];
    if (line.includes('|')) {
      const cells = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== ''); // Remove empty cells from edges
      
      // Only add rows that have the same number of columns as headers
      if (cells.length === headers.length) {
        rows.push(cells);
      }
    }
  }
  
  if (rows.length === 0) {
    return null;
  }
  
  // Try to extract a title from content before the table
  let title: string | undefined;
  const contentBeforeTable = lines.slice(0, tableStartIndex).join('\n').trim();
  
  // Look for title patterns
  const titlePatterns = [
    /^#\s+(.+)$/m,           // Markdown heading
    /^##\s+(.+)$/m,          // Markdown subheading  
    /^(.+)\s*:?\s*$/m,       // Simple title line
  ];
  
  for (const pattern of titlePatterns) {
    const match = contentBeforeTable.match(pattern);
    if (match && match[1] && match[1].length < 100) { // Reasonable title length
      title = match[1].trim();
      break;
    }
  }
  
  // If no title found and content before table is short, use it as title
  if (!title && contentBeforeTable && contentBeforeTable.length < 100 && !contentBeforeTable.includes('\n')) {
    title = contentBeforeTable;
  }
  
  return {
    headers,
    rows,
    title
  };
}

export function hasTableData(content: string): boolean {
  return detectAndParseTable(content) !== null;
}

// Enhanced table detection for various formats
export function detectMultipleTableFormats(content: string): TableData | null {
  // First try markdown table detection
  let result = detectAndParseTable(content);
  if (result) return result;
  
  // Try to detect CSV-like format
  const lines = content.trim().split('\n');
  
  // Look for comma-separated values
  const csvLines = lines.filter(line => 
    line.includes(',') && 
    line.split(',').length >= 2
  );
  
  if (csvLines.length >= 2) {
    const headers = csvLines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = csvLines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    
    // Validate that all rows have the same number of columns
    const validRows = rows.filter(row => row.length === headers.length);
    
    if (validRows.length > 0) {
      return {
        headers,
        rows: validRows,
        title: 'Data Table'
      };
    }
  }
  
  // Try to detect tab-separated values
  const tabLines = lines.filter(line => 
    line.includes('\t') && 
    line.split('\t').length >= 2
  );
  
  if (tabLines.length >= 2) {
    const headers = tabLines[0].split('\t').map(h => h.trim());
    const rows = tabLines.slice(1).map(line => 
      line.split('\t').map(cell => cell.trim())
    );
    
    // Validate that all rows have the same number of columns
    const validRows = rows.filter(row => row.length === headers.length);
    
    if (validRows.length > 0) {
      return {
        headers,
        rows: validRows,
        title: 'Data Table'
      };
    }
  }
  
  return null;
}
