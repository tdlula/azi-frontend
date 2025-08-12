/**
 * AI Response Formatter Utility
 * Handles formatting AI responses according to defined rules and guidelines
 */

// AI Response Definitions interface (matches the JSON structure)
interface AIResponseDefinitions {
  markdownFormatting: {
    boldText: {
      syntax: string;
      description: string;
      example: string;
      usage: string;
      renderedAppearance: string;
    };
    headers: {
      syntax: string;
      description: string;
      example: string;
      usage: string;
      renderedAppearance: string;
    };
  };
  sourceCitations: {
    radioStationFormat: {
      syntax: string;
      description: string;
      purpose: string;
      example: string;
      usage: string;
    };
  };
  currencyFormatting: {
    southAfricanRands: {
      format: string;
      description: string;
      example: string;
      rule: string;
      context: string;
    };
  };
  quotedContent: {
    transcriptExcerpts: {
      formats: string[];
      description: string;
      usage: string;
      examples: string[];
    };
  };
  textEmphasis: {
    boldHighlighting: {
      usage: string;
      examples: string[];
      purpose: string;
    };
  };
  contentOrganization: {
    bulletPoints: {
      usage: string;
      formats: string[];
      purpose: string;
    };
    numbering: {
      usage: string;
      format: string;
      purpose: string;
    };
  };
  clarificationGuidelines: {
    ambiguousTerms: {
      format: string;
      description: string;
      examples: string[];
      rule: string;
    };
  };
  programIdentification: {
    showAndStationFormat: {
      format: string;
      description: string;
      examples: string[];
      rule: string;
    };
  };
  abbreviationRules: {
    stationNames: {
      rule: string;
      examples: string[];
      format: string;
      purpose: string;
    };
  };
}

// Cache for loaded definitions
let cachedDefinitions: AIResponseDefinitions | null = null;

/**
 * Load AI response definitions from the backend
 */
export const loadAIResponseDefinitions = async (): Promise<AIResponseDefinitions | null> => {
  if (cachedDefinitions) {
    return cachedDefinitions;
  }

  try {
    const response = await fetch('/api/ai-response-definitions');
    if (response.ok) {
      const definitions = await response.json();
      cachedDefinitions = definitions;
      return definitions;
    }
  } catch (error) {
    console.warn('Failed to load AI response definitions:', error);
  }

  return null;
};

/**
 * Enhanced text formatting function that applies AI response definitions
 */
export const formatTextWithAIDefinitions = (text: string, definitions?: AIResponseDefinitions): string => {
  let formattedText = text;
  
  // Apply bold text formatting (**text**)
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-yellow-300">$1</strong>');
  
  // Apply source citations formatting 【message idx:search idx†Radio Station Name】
  formattedText = formattedText.replace(/【([^】]+)】/g, 
    '<span class="inline-block bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs font-mono border border-blue-500/30 ml-1" title="Source Citation">$1</span>'
  );
  
  // Apply currency formatting (R##.##)
  formattedText = formattedText.replace(/\bR(\d+(?:\.\d{2})?)\b/g, 
    '<span class="font-semibold text-green-400" title="South African Rands">R$1</span>'
  );
  
  // Apply quoted content formatting ("text")
  formattedText = formattedText.replace(/"([^"]+)"/g, 
    '<span class="italic text-gray-300 border-l-2 border-gray-500 pl-2" title="Quoted Content">"$1"</span>'
  );
  
  // Apply abbreviation formatting - Full Name (Abbreviation)
  formattedText = formattedText.replace(/\b([A-Z][A-Za-z\s]+)\s*\(([A-Z]{2,})\)/g, 
    '<span class="text-blue-300">$1</span> (<span class="font-semibold text-blue-400" title="Abbreviation">$2</span>)'
  );
  
  // Apply program and station identification - "Program Name on Station Name"
  formattedText = formattedText.replace(/\b([A-Z][A-Za-z\s]+)\s+on\s+([A-Z][A-Za-z\s]+)\b/g, 
    '<span class="text-purple-300 font-medium" title="Program">$1</span> on <span class="text-purple-400 font-semibold" title="Radio Station">$2</span>'
  );
  
  // Apply clarification formatting - term (explanation)
  formattedText = formattedText.replace(/\b([A-Z]{2,})\s*\(([^)]+)\)/g, 
    '<span class="font-semibold text-cyan-400" title="$2">$1</span> <span class="text-sm text-gray-400">($2)</span>'
  );
  
  return formattedText;
};

/**
 * Render a formatted line with enhanced styling based on AI response definitions
 */
export const renderFormattedLineWithDefinitions = (line: string, index: number, definitions?: AIResponseDefinitions) => {
  const trimmedLine = line.trim();
  
  // Empty line
  if (trimmedLine === '') return { type: 'break', content: null };
  
  // Header formatting (## Header Text)
  if (trimmedLine.startsWith('## ')) {
    const headerText = trimmedLine.slice(3);
    return {
      type: 'header2',
      content: formatTextWithAIDefinitions(headerText, definitions),
      originalText: headerText
    };
  }
  
  // Main header formatting (# Header Text)
  if (trimmedLine.startsWith('# ')) {
    const headerText = trimmedLine.slice(2);
    return {
      type: 'header1',
      content: formatTextWithAIDefinitions(headerText, definitions),
      originalText: headerText
    };
  }
  
  // Bullet points (- item or * item)
  if (trimmedLine.match(/^[-*]\s+/)) {
    const bulletText = trimmedLine.replace(/^[-*]\s+/, '');
    return {
      type: 'bullet',
      content: formatTextWithAIDefinitions(bulletText, definitions),
      originalText: bulletText
    };
  }
  
  // Numbered lists (1. item, 2. item, etc.)
  const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
  if (numberedMatch) {
    const [, number, text] = numberedMatch;
    return {
      type: 'numbered',
      content: formatTextWithAIDefinitions(text, definitions),
      number: number,
      originalText: text
    };
  }
  
  // Blockquotes (> text)
  if (trimmedLine.startsWith('> ')) {
    const quoteText = trimmedLine.slice(2);
    return {
      type: 'blockquote',
      content: formatTextWithAIDefinitions(quoteText, definitions),
      originalText: quoteText
    };
  }
  
  // Regular paragraph
  return {
    type: 'paragraph',
    content: formatTextWithAIDefinitions(trimmedLine, definitions),
    originalText: trimmedLine
  };
};

/**
 * Apply AI context and formatting rules to enhance responses
 */
export const enhanceAIResponse = (content: string, definitions?: AIResponseDefinitions): string => {
  // Split content into lines
  const lines = content.split('\n');
  
  // Process each line according to AI response definitions
  const processedLines = lines.map((line, index) => {
    const formatted = renderFormattedLineWithDefinitions(line, index, definitions);
    
    switch (formatted.type) {
      case 'break':
        return '<br/>';
      case 'header1':
        return `<h2 class="text-xl font-bold text-white mb-4 mt-5 border-b-2 border-gray-500 pb-2">${formatted.content}</h2>`;
      case 'header2':
        return `<h3 class="text-lg font-bold text-white mb-3 mt-4 border-b border-gray-600 pb-1">${formatted.content}</h3>`;
      case 'bullet':
        return `<div class="flex items-start mb-2"><span class="text-yellow-400 mr-3 mt-1">•</span><span class="text-white leading-relaxed">${formatted.content}</span></div>`;
      case 'numbered':
        return `<div class="flex items-start mb-2"><span class="text-blue-400 font-semibold mr-3 mt-1 min-w-[20px]">${formatted.number}.</span><span class="text-white leading-relaxed">${formatted.content}</span></div>`;
      case 'blockquote':
        return `<blockquote class="border-l-4 border-gray-500 pl-4 py-2 my-3 bg-gray-800/30 italic text-gray-300">${formatted.content}</blockquote>`;
      case 'paragraph':
      default:
        return `<p class="mb-2 leading-relaxed text-white">${formatted.content}</p>`;
    }
  });
  
  return processedLines.join('\n');
};

/**
 * Context-aware AI response enhancement
 * Applies specific formatting based on response type and content
 */
export const applyContextualFormatting = (content: string, responseType: 'analysis' | 'recommendation' | 'chart' | 'general' = 'general'): string => {
  let enhancedContent = content;
  
  // Apply response-type specific formatting
  switch (responseType) {
    case 'analysis':
      // Enhance analysis responses with structured formatting
      enhancedContent = enhancedContent.replace(/^(Summary|Key Findings|Insights|Conclusion):/gm, '## $1:');
      enhancedContent = enhancedContent.replace(/^(Key Insight|Finding|Trend):/gm, '**$1:**');
      break;
      
    case 'recommendation':
      // Enhance recommendation responses
      enhancedContent = enhancedContent.replace(/^(Recommendations|Actions|Next Steps):/gm, '## $1:');
      enhancedContent = enhancedContent.replace(/^(Priority|Action|Step) (\d+):/gm, '**$1 $2:**');
      break;
      
    case 'chart':
      // Enhance chart-related responses
      enhancedContent = enhancedContent.replace(/^(Chart Analysis|Data Insights|Visualization Notes):/gm, '## $1:');
      break;
      
    case 'general':
    default:
      // Apply general formatting enhancements
      enhancedContent = enhancedContent.replace(/^(Note|Important|Key Point):/gm, '**$1:**');
      break;
  }
  
  return enhancedContent;
};

/**
 * Validate AI response formatting according to definitions
 */
export const validateAIResponseFormatting = (content: string, definitions?: AIResponseDefinitions): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for proper citation format
  const citations = content.match(/【[^】]*】/g);
  if (citations) {
    citations.forEach(citation => {
      if (!citation.match(/【[^:]+:[^†]*†[^】]+】/)) {
        issues.push(`Invalid citation format: ${citation}`);
        suggestions.push('Use format: 【message idx:search idx†Radio Station Name】');
      }
    });
  }
  
  // Check for proper currency formatting
  const currencies = content.match(/\$\d+/g);
  if (currencies) {
    issues.push('Found $ currency symbols');
    suggestions.push('Use South African Rands (R) instead of $ for currency amounts');
  }
  
  // Check for unformatted emphasis
  const unformattedEmphasis = content.match(/\b(IMPORTANT|KEY|CRITICAL|NOTE)\b/g);
  if (unformattedEmphasis) {
    suggestions.push('Consider using **bold formatting** for emphasis words');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
};

export default {
  loadAIResponseDefinitions,
  formatTextWithAIDefinitions,
  renderFormattedLineWithDefinitions,
  enhanceAIResponse,
  applyContextualFormatting,
  validateAIResponseFormatting
};
