import { z } from 'zod';

export const ChartDataSchema = z.object({
  type: z.string(),
  title: z.string(),
  data: z.array(z.object({
    name: z.string(),
    value: z.number(),
  }).catchall(z.any())),
  xKey: z.string(),
  yKey: z.string(),
  colorScheme: z.string().optional(),
  insights: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),
  wordData: z.array(z.object({
    text: z.string(),
    value: z.number(),
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

export const DashboardMetricsSchema = z.object({
  totalTranscripts: z.number(),
  activeStations: z.number(),
  topTopic: z.string(),
  topStation: z.string(),
  brandMentions: z.number().optional(),
  sentimentScore: z.number().optional(),
  growth: z.number().optional(),
  engagement: z.number().optional(),
});

export const DashboardSchema = z.object({
  metrics: DashboardMetricsSchema.optional(),
  charts: z.record(z.string(), ChartDataSchema).optional(),
}).nullable();

export type ChartData = z.infer<typeof ChartDataSchema>;
export type DashboardData = z.infer<typeof DashboardSchema>;