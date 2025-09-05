import { z } from 'zod';

// Enhanced metadata schema matching the new backend chartPrompts.json format
const EnhancedMetadataSchema = z.object({
  // Standard metadata from chartPrompts.json
  topic: z.string().optional(),
  analysis_period: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    start_datetime: z.string().optional(),
    end_datetime: z.string().optional(),
  }).optional(),
  // Chart-specific metadata
  source_count: z.object({
    call_ins: z.number().optional(),
    whatsapp_feedback: z.number().optional(),
    presenter_segments: z.number().optional(),
  }).optional(),
  total_entries_analyzed: z.number().optional(),
  smoothing_method: z.string().optional(),
  total_mentions_analyzed: z.number().optional(),
  score_scale: z.string().optional(),
  scoring_criteria: z.array(z.string()).optional(),
  total_formats_analyzed: z.number().optional(),
  total_segments_analyzed: z.number().optional(),
  metrics_included: z.array(z.string()).optional(),
  total_stations_analyzed: z.number().optional(),
  // Legacy metadata (for backward compatibility)
  dataSource: z.string().optional(),
  lastUpdated: z.string().optional(),
  totalRecords: z.union([z.string(), z.number()]).optional(),
  confidence: z.number().optional(),
  textSource: z.string().optional(),
  totalWords: z.union([z.string(), z.number()]).optional(),
}).optional();

// Enhanced ChartData schema supporting both legacy and new chartPrompts.json formats
export const ChartDataSchema = z.object({
  type: z.string(),
  chart_type: z.string().optional(), // New field from chartPrompts.json
  title: z.string(),
  // Flexible data structure to handle both simple array and complex chart formats
  data: z.union([
    // Simple array format for donut, bar charts: [{label, value, color}]
    z.array(z.object({
      name: z.string().optional(),
      label: z.string().optional(),
      value: z.union([
        z.number(), // Support legacy simple number format
        z.object({   // Support new nested object format
          value: z.number(),
          label: z.string()
        })
      ]),
      color: z.string().optional(),
    }).catchall(z.any())),
    // Complex format for line, radar charts: {labels: [], datasets: []}
    z.object({
      labels: z.array(z.string()),
      datasets: z.array(z.object({
        label: z.string(),
        data: z.array(z.number()),
        color: z.string().optional(),
      }).catchall(z.any())),
    }).catchall(z.any()),
  ]),
  xKey: z.string().optional(), // Made optional for complex chart formats
  yKey: z.string().optional(), // Made optional for complex chart formats
  colorScheme: z.string().optional(),
  insights: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),
  wordData: z.array(z.object({
    text: z.string(),
    value: z.union([
      z.number(), // Support legacy simple number format
      z.object({   // Support new nested object format
        value: z.number(),
        label: z.string()
      })
    ]),
    category: z.string(),
    sentiment: z.string(),
  })).optional(),
  metadata: EnhancedMetadataSchema,
});

// Message schema for chat
export const MessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  sender: z.enum(['user', 'assistant']),
  timestamp: z.date(),
  conversationId: z.string().optional(),
  threadId: z.string().optional(),
  charts: z.array(ChartDataSchema).optional(),
});

// Conversation schema for chat
export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  messages: z.array(MessageSchema).optional(),
});

// Export types
export type ChartData = z.infer<typeof ChartDataSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
