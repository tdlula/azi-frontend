import { z } from 'zod';

export const ChartDataSchema = z.object({
  type: z.string(),
  title: z.string(),
  data: z.array(z.object({
    name: z.string(),
    value: z.union([
      z.number(), // Support legacy simple number format
      z.object({   // Support new nested object format
        value: z.number(),
        label: z.string()
      })
    ]),
  }).catchall(z.any())),
  xKey: z.string(),
  yKey: z.string(),
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
  metadata: z.object({
    dataSource: z.string().optional(),
    lastUpdated: z.string().optional(),
    totalRecords: z.union([z.string(), z.number()]).optional(),
    confidence: z.number().optional(),
    textSource: z.string().optional(),
    totalWords: z.union([z.string(), z.number()]).optional(),
  }).optional(),
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