// Message formatting utilities

import React from "react";
import { AIResponseDefinitions } from "@/utils/aiResponseFormatter";
import { detectMultipleTableFormats } from "@/utils/tableDetection";
import DataTable from "@/components/ui/DataTable";

// Enhanced function to format text according to AI response definitions
export const formatTextWithDefinitions = (text: string, definitions: any = null) => {
  if (!text) return '';
  
  let formattedText = text;
  
  // Handle URLs first (before other formatting)
  formattedText = formattedText.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>'
  );
  
  // Handle email addresses
  formattedText = formattedText.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1" class="text-blue-400 hover:text-blue-300 underline">$1</a>'
  );

  // Handle markdown headers BEFORE converting newlines (must be processed before bold text)
  formattedText = formattedText.replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-semibold text-yellow-300 mt-3 mb-2">$1</h6>');
  formattedText = formattedText.replace(/^#####\s+(.+)$/gm, '<h5 class="text-base font-semibold text-yellow-300 mt-3 mb-2">$1</h5>');
  formattedText = formattedText.replace(/^####\s+(.+)$/gm, '<h4 class="text-lg font-semibold text-yellow-300 mt-4 mb-2">$1</h4>');
  formattedText = formattedText.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-yellow-300 mt-4 mb-3">$1</h3>');
  formattedText = formattedText.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-yellow-300 mt-5 mb-3">$1</h2>');
  formattedText = formattedText.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-bold text-yellow-300 mt-6 mb-4">$1</h1>');

  // Handle line breaks AFTER header processing
  formattedText = formattedText.replace(/\n/g, '<br>');

  // Handle markdown - Bold text **text**
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-yellow-300">$1</strong>');
  
  // Handle markdown - Italic text *text*
  formattedText = formattedText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-gray-300">$1</em>');
  
  // Handle markdown - Code `code`
  formattedText = formattedText.replace(/`([^`]+)`/g, '<code class="bg-slate-700 text-orange-300 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Handle strikethrough ~~text~~
  formattedText = formattedText.replace(/~~(.*?)~~/g, '<del class="line-through text-gray-400">$1</del>');
  
  // Handle percentages
  formattedText = formattedText.replace(/(\d+(?:\.\d+)?%)/g, '<span class="font-semibold text-green-400">$1</span>');
  
  // Handle currency (R##.##)
  formattedText = formattedText.replace(/\bR(\d+(?:\.\d{2})?)\b/g, '<span class="font-semibold text-green-400">R$1</span>');
  
  return formattedText;
};

// Enhanced function to render a single line with formatting
export const renderFormattedLine = (line: string, index: number, definitions: AIResponseDefinitions | null = null) => {
  const trimmedLine = line.trim();
  
  // Empty line
  if (trimmedLine === '') return <br key={index} />;
  
  // Headers (# Header, ## Header, ### Header, #### Header)
  if (trimmedLine.startsWith('#### ')) {
    const headerText = trimmedLine.slice(5);
    return (
      <h5 key={index} className="text-sm font-semibold text-white mb-2 mt-2 border-b border-gray-800 pb-1">
        <span dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(headerText, definitions) }} />
      </h5>
    );
  }
  
  if (trimmedLine.startsWith('### ')) {
    const headerText = trimmedLine.slice(4);
    return (
      <h4 key={index} className="text-base font-bold text-white mb-2 mt-3 border-b border-gray-700 pb-1">
        <span dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(headerText, definitions) }} />
      </h4>
    );
  }
  
  if (trimmedLine.startsWith('## ')) {
    const headerText = trimmedLine.slice(3);
    return (
      <h3 key={index} className="text-lg font-bold text-white mb-3 mt-4 border-b border-gray-600 pb-1">
        <span dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(headerText, definitions) }} />
      </h3>
    );
  }
  
  if (trimmedLine.startsWith('# ')) {
    const headerText = trimmedLine.slice(2);
    return (
      <h2 key={index} className="text-xl font-bold text-white mb-4 mt-5 border-b-2 border-gray-500 pb-2">
        <span dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(headerText, definitions) }} />
      </h2>
    );
  }
  
  // Code blocks (```code```)
  if (trimmedLine.startsWith('```') && trimmedLine.endsWith('```') && trimmedLine.length > 6) {
    const codeText = trimmedLine.slice(3, -3);
    return (
      <pre key={index} className="bg-slate-800 border border-slate-600 rounded-lg p-3 my-3 overflow-x-auto">
        <code className="text-orange-300 text-sm font-mono">{codeText}</code>
      </pre>
    );
  }
  
  // Bullet points (- item, * item, + item)
  if (trimmedLine.match(/^[-*+]\s+/)) {
    const bulletText = trimmedLine.replace(/^[-*+]\s+/, '');
    return (
      <div key={index} className="flex items-start mb-2">
        <span className="text-yellow-400 mr-3 mt-1 flex-shrink-0">•</span>
        <span className="text-white leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(bulletText, definitions) }} />
      </div>
    );
  }
  
  // Numbered lists (1. item, 2. item, etc.)
  if (trimmedLine.match(/^\d+\.\s+/)) {
    const match = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      const [, number, text] = match;
      return (
        <div key={index} className="flex items-start mb-2">
          <span className="text-blue-400 font-semibold mr-3 mt-1 min-w-[24px] flex-shrink-0">{number}.</span>
          <span className="text-white leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(text, definitions) }} />
        </div>
      );
    }
  }
  
  // Task lists (- [ ] item, - [x] item)
  if (trimmedLine.match(/^[-*+]\s+\[[x\s]\]\s+/i)) {
    const isChecked = trimmedLine.match(/^[-*+]\s+\[x\]\s+/i);
    const taskText = trimmedLine.replace(/^[-*+]\s+\[[x\s]\]\s+/i, '');
    return (
      <div key={index} className="flex items-start mb-2">
        <span className={`mr-3 mt-1 flex-shrink-0 ${isChecked ? 'text-green-400' : 'text-gray-400'}`}>
          {isChecked ? '☑' : '☐'}
        </span>
        <span className={`leading-relaxed flex-1 ${isChecked ? 'line-through text-gray-400' : 'text-white'}`} 
              dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(taskText, definitions) }} />
      </div>
    );
  }
  
  // Horizontal rule (--- or ***)
  if (trimmedLine.match(/^(---+|\*\*\*+)$/)) {
    return <hr key={index} className="border-gray-600 my-4" />;
  }
  
  // Blockquotes (> text)
  if (trimmedLine.startsWith('> ')) {
    const quoteText = trimmedLine.slice(2);
    return (
      <blockquote key={index} className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-900/20 rounded-r">
        <span className="text-gray-200 italic" dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(quoteText, definitions) }} />
      </blockquote>
    );
  }
  
  // Table separator line (|---|---|)
  if (trimmedLine.match(/^\|?[\s]*:?-+:?[\s]*(\|[\s]*:?-+:?[\s]*)*\|?$/)) {
    return null; // Skip table separator lines, they're handled by table detection
  }
  
  // Regular paragraph
  return (
    <p key={index} className="mb-2 leading-relaxed text-white">
      <span dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(trimmedLine, definitions) }} />
    </p>
  );
};

// Function to render message content with enhanced formatting and table detection
export const renderMessageContent = (content: string, aiResponseDefinitions: AIResponseDefinitions | null = null) => {
  // Check for potential table content with more nuanced detection
  const lines = content.split('\n');
  const pipeLines = lines.filter(line => line.includes('|'));
  const commaLines = lines.filter(line => line.includes(','));
  const tabLines = lines.filter(line => line.includes('\t'));
  
  const mightContainTable = (
    // Markdown table: multiple lines with pipes, at least 3 lines (header + separator + data)
    (pipeLines.length >= 3 && pipeLines.some(line => line.split('|').length >= 4)) ||
    // CSV: multiple lines with commas, consistent structure
    (commaLines.length >= 3 && commaLines.some(line => line.split(',').length >= 3)) ||
    // TSV: multiple lines with tabs
    (tabLines.length >= 3 && tabLines.some(line => line.split('\t').length >= 3))
  ) && (
    // Exclude clearly conversational content
    !content.toLowerCase().match(/^(here are|the results|i found|let me|i'll|i can|based on)/i) &&
    content.length > 50 // Reasonable minimum length
  );

  // Only attempt table detection if content seems table-like
  if (mightContainTable) {
    const tableData = detectMultipleTableFormats(content);
    
    if (tableData) {
      // Extract non-table content (content before and after table)
      const lines = content.split('\n');
      let tableStartIndex = -1;
      let tableEndIndex = -1;
      
      // Find table boundaries in the content
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('|') && line.split('|').length >= 3) {
          if (tableStartIndex === -1) {
            tableStartIndex = i;
          }
          tableEndIndex = i;
        }
      }
      
      const beforeTable = tableStartIndex > 0 ? lines.slice(0, tableStartIndex).join('\n').trim() : '';
      const afterTable = tableEndIndex < lines.length - 1 ? lines.slice(tableEndIndex + 1).join('\n').trim() : '';
      
      return (
        <div>
          {beforeTable && (
            <div className="prose prose-sm max-w-none mb-4 text-white">
              <div 
                dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(beforeTable, aiResponseDefinitions) }}
                className="leading-relaxed text-white"
              />
            </div>
          )}
          <DataTable data={tableData} title={tableData.title} />
          {afterTable && (
            <div className="prose prose-sm max-w-none mt-4 text-white">
              <div 
                dangerouslySetInnerHTML={{ __html: formatTextWithDefinitions(afterTable, aiResponseDefinitions) }}
                className="leading-relaxed text-white"
              />
            </div>
          )}
        </div>
      );
    }
  }
  
  // No table detected or content doesn't look table-like, render with enhanced formatting
  return (
    <div className="prose prose-sm max-w-none text-white">
      {lines.map((line: string, index: number) => 
        renderFormattedLine(line, index, aiResponseDefinitions)
      )}
    </div>
  );
};
