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

/**
 * Radio Analytics Metrics Schema
 * These metrics are generated exclusively by the OpenAI assistant in the backend
 * and provide comprehensive radio performance analytics
 */
export const DashboardMetricsSchema = z.object({
  overallPositiveSentiment: z.object({
    value: z.number(),
    label: z.string()
  }),
  totalMentions: z.object({
    value: z.number(),
    label: z.string()
  }),
  highEngagementMoments: z.object({
    value: z.number(),
    label: z.string()
  }),
  whatsappNumberMentions: z.object({
    value: z.number(),
    label: z.string()
  })
});

export const DashboardSchema = z.object({
  metrics: DashboardMetricsSchema.optional(),
  charts: z.record(z.string(), ChartDataSchema).optional(),
}).nullable();

export type ChartData = z.infer<typeof ChartDataSchema>;
export type DashboardData = z.infer<typeof DashboardSchema>;