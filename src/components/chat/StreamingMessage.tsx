// StreamingMessageContent component

import React, { useState, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { AIResponseDefinitions } from "@/utils/aiResponseFormatter";
import { formatTextWithDefinitions } from "@/utils/chat/messageFormatter";
import { detectMultipleTableFormats } from "@/utils/tableDetection";
import DataTable from "@/components/ui/DataTable";
import { STREAMING_SPEED } from "@/constants/chatConstants";

interface StreamingMessageContentProps {
  message: Message;
  aiResponseDefinitions?: AIResponseDefinitions | null;
  streamingMessageId?: number | null;
}

// Custom hook for streaming text effect
const useStreamingText = (targetText: string, messageId: number, isEnabled: boolean, streamingMessageId: number | null) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEnabled || !targetText || messageId !== streamingMessageId) {
      setDisplayText(targetText);
      setIsComplete(true);
      return;
    }

    setDisplayText('');
    setIsComplete(false);
    let currentIndex = 0;

    // Clear any existing streaming interval
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    const streamInterval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        setDisplayText(targetText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(streamInterval);
        streamingIntervalRef.current = null;
      }
    }, STREAMING_SPEED);

    streamingIntervalRef.current = streamInterval;

    return () => {
      if (streamInterval) {
        clearInterval(streamInterval);
      }
    };
  }, [targetText, messageId, isEnabled, streamingMessageId]);

  return { displayText, isComplete };
};

export default function StreamingMessageContent({ 
  message, 
  aiResponseDefinitions = null,
  streamingMessageId = null 
}: StreamingMessageContentProps) {
  const fullContent = message.fullContent || message.content;
  const shouldStream = message.role === 'assistant' && !!message.isStreaming && message.id === streamingMessageId;
  const { displayText, isComplete } = useStreamingText(fullContent, message.id, shouldStream, streamingMessageId);

  const contentToRender = shouldStream ? displayText : fullContent;

  // Ensure we always have content to render
  if (!contentToRender) {
    return <div>Loading...</div>;
  }

  // Always attempt table extraction, even if surrounded by commentary
  const tableData = detectMultipleTableFormats(contentToRender);
  if (tableData) {
    // Find table boundaries in the content
    const lines = contentToRender.split('\n');
    let tableStartIndex = -1;
    let tableEndIndex = -1;
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
        {shouldStream && !isComplete && (
          <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse"></span>
        )}
      </div>
    );
  }

  // No table detected, render with enhanced formatting
  const formattedContent = formatTextWithDefinitions(contentToRender, aiResponseDefinitions);
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
