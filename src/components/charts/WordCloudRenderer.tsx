import { useState } from "react";
import type { ChartData } from "@shared/schema";

interface WordCloudRendererProps {
  chartData: ChartData;
  onWordClick?: (word: string, data: any) => void;
}

export default function WordCloudRenderer({ chartData, onWordClick }: WordCloudRendererProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  
  if (!chartData.wordData || chartData.wordData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No word data available
      </div>
    );
  }

  // Calculate font sizes based on word frequency
  const maxValue = Math.max(...chartData.wordData.map(w => w.value));
  const minValue = Math.min(...chartData.wordData.map(w => w.value));
  const fontSizeRange = { min: 14, max: 48 };
  
  const getFontSize = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    return fontSizeRange.min + (normalized * (fontSizeRange.max - fontSizeRange.min));
  };

  // Color scheme based on sentiment or category - improved for dark background compatibility
  const getWordColor = (word: any, index: number) => {
    if (word.sentiment) {
      switch (word.sentiment) {
        case 'positive': return '#34d399'; // Bright green
        case 'negative': return '#f87171'; // Light red
        case 'neutral': return '#9ca3af'; // Light gray
        default: return '#60a5fa'; // Light blue
      }
    }
    
    // Light, vibrant colors that work well on dark backgrounds
    const colors = ['#60a5fa', '#a78bfa', '#06b6d4', '#34d399', '#fbbf24', '#f87171', '#fb7185', '#4ade80'];
    return colors[index % colors.length];
  };

  const handleWordClick = (word: any) => {
    setSelectedWord(word.text);
    onWordClick?.(word.text, word);
  };

  return (
    <div className="relative w-full h-full min-h-[300px] p-4">
      <div className="flex flex-wrap items-center justify-center gap-2 h-full">
        {chartData.wordData.map((word, index) => (
          <span
            key={`${word.text}-${index}`}
            onClick={() => handleWordClick(word)}
            className={`
              cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-lg select-none
              ${selectedWord === word.text ? 'opacity-100 font-bold' : 'opacity-80 hover:opacity-100'}
            `}
            style={{
              fontSize: `${getFontSize(word.value)}px`,
              color: getWordColor(word, index),
              fontWeight: word.value > maxValue * 0.7 ? 'bold' : 'normal',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4), 0 0 4px rgba(0, 0, 0, 0.3)',
              filter: `brightness(${0.95 + (word.value / maxValue) * 0.15})`
            }}
            title={`${word.text}: ${word.value} occurrences${word.category ? ` (${word.category})` : ''}${word.sentiment ? ` - ${word.sentiment}` : ''}`}
          >
            {word.text}
          </span>
        ))}
      </div>
      
      {/* Word Details Panel */}
      {selectedWord && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{selectedWord}</h4>
              {chartData.wordData.find(w => w.text === selectedWord) && (
                <div className="text-sm opacity-80 mt-1">
                  <p>Frequency: {chartData.wordData.find(w => w.text === selectedWord)?.value}</p>
                  {chartData.wordData.find(w => w.text === selectedWord)?.category && (
                    <p>Category: {chartData.wordData.find(w => w.text === selectedWord)?.category}</p>
                  )}
                  {chartData.wordData.find(w => w.text === selectedWord)?.sentiment && (
                    <p>Sentiment: {chartData.wordData.find(w => w.text === selectedWord)?.sentiment}</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedWord(null)}
              className="text-white/60 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}