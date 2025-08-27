import React from 'react';
import DataTable from '../ui/DataTable';

export default function StreamingMessageContent({ message, aiResponseDefinitions, useStreamingText, detectMultipleTableFormats }: any) {
  const fullContent = message.fullContent || message.content;
  const shouldStream = message.role === 'assistant' && !!message.isStreaming;
  const { displayText, isComplete } = useStreamingText(fullContent, message.id, shouldStream);
  const contentToRender = shouldStream ? displayText : fullContent;

  if (!contentToRender) return null;

  const tableData = detectMultipleTableFormats(contentToRender);
  if (tableData) {
    const lines = contentToRender.split('\n');
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('|') && line.split('|').length >= 3) {
        if (tableStartIndex === -1) tableStartIndex = i;
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
              dangerouslySetInnerHTML={{ __html: message.formatTextWithDefinitions(beforeTable, aiResponseDefinitions) }}
              className="leading-relaxed text-white"
            />
          </div>
        )}
        <DataTable data={tableData} title={tableData.title} />
        {afterTable && (
          <div className="prose prose-sm max-w-none mt-4 text-white">
            <div 
              dangerouslySetInnerHTML={{ __html: message.formatTextWithDefinitions(afterTable, aiResponseDefinitions) }}
              className="leading-relaxed text-white"
            />
          </div>
        )}
        {shouldStream && !isComplete && (
          <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse"></span>
        )}
      </div>
    );
  }

  const formattedContent = message.formatTextWithDefinitions(contentToRender, aiResponseDefinitions);
  return (
    <div className="prose prose-sm max-w-none text-white">
      <div 
        dangerouslySetInnerHTML={{ __html: formattedContent }}
        className="leading-relaxed text-white"
      />
      {shouldStream && !isComplete && (
        <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse"></span>
      )}
    </div>
  );
}
