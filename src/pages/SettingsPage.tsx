// Settings/Admin Page for Chart Management
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChartPromptsManager from '@/components/ChartPromptsManager';
import { 
  Settings, 
  BarChart3, 
  Database, 
  RefreshCw, 
  Info,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Test API endpoints
  const testEndpoints = async () => {
    setLoading(true);
    const endpoints = [
      '/api/chart-prompts',
      '/api/chart-prompts/stats',
      '/api/dashboard-data',
      '/api/suggestions'
    ];

    const results = [];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : null
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 0,
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setSystemInfo(results);
    setLoading(false);
  };

  // Clear all caches
  const clearCaches = async () => {
    try {
      // Force refresh dashboard
      await fetch('/api/dashboard-data?force_refresh=true');
      
      // You could also add backend cache clearing endpoint
      // await fetch('/api/clear-cache', { method: 'POST' });
      
      alert('Caches cleared successfully! Dashboard will reload with fresh data.');
      window.location.href = '/dashboard-minimal';
    } catch (error) {
      console.error('Failed to clear caches:', error);
      alert('Failed to clear caches. Please try again.');
    }
  };

  // Export chart prompts
  const exportChartPrompts = async () => {
    try {
      const response = await fetch('/api/chart-prompts');
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart-prompts-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export chart prompts:', error);
      alert('Failed to export chart prompts.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage chart prompts, system health, and dashboard configuration
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/dashboard-minimal'}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        <Tabs defaultValue="chart-prompts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chart-prompts" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Chart Prompts
            </TabsTrigger>
            <TabsTrigger value="system-health" className="gap-2">
              <Database className="w-4 h-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="cache-management" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Cache Management
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Info className="w-4 h-4" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Chart Prompts Management */}
          <TabsContent value="chart-prompts">
            <ChartPromptsManager showStats={true} />
          </TabsContent>

          {/* System Health */}
          <TabsContent value="system-health">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">API Endpoints Health Check</h3>
                  <Button 
                    onClick={testEndpoints}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                    Test Endpoints
                  </Button>
                </div>

                {systemInfo && (
                  <div className="space-y-3">
                    {systemInfo.map((result: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.ok ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{result.endpoint}</p>
                            <p className="text-sm text-muted-foreground">
                              Status: {result.status} | 
                              {result.data?.count && ` Items: ${result.data.count} |`}
                              {result.data?.prompts?.length && ` Prompts: ${result.data.prompts.length} |`}
                              {result.error && ` Error: ${result.error}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={result.ok ? "default" : "destructive"}>
                          {result.ok ? "OK" : "Error"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {!systemInfo && !loading && (
                  <div className="text-center text-muted-foreground py-8">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Test Endpoints" to check system health</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Cache Management */}
          <TabsContent value="cache-management">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Cache Management</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Dashboard Data Cache</h4>
                        <p className="text-sm text-muted-foreground">
                          Cached for 4 hours (backend) and 5 minutes (frontend)
                        </p>
                      </div>
                      <Button onClick={clearCaches} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Clear All Caches
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Chart Prompts Export</h4>
                        <p className="text-sm text-muted-foreground">
                          Download current chart prompts configuration
                        </p>
                      </div>
                      <Button onClick={exportChartPrompts} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export Prompts
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* About */}
          <TabsContent value="about">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">About AZI Radio Analytics Platform</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Chart Generation System</h4>
                  <p className="text-muted-foreground">
                    The platform uses a centralized chart prompts system with 20 curated prompts 
                    covering topics, sentiment, geo analysis, engagement metrics, and more. 
                    Charts are generated using OpenAI's analysis of radio transcript data.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Data Sources</h4>
                  <p className="text-muted-foreground">
                    Radio transcripts from stations including Radio 94.7 and Y FM, analyzed for 
                    sentiment, topics, brand mentions, and audience engagement patterns.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recent Updates</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Enhanced geo sentiment charts with detailed region data</li>
                    <li>• Centralized chart prompt management system</li>
                    <li>• Improved dashboard grid layout (6 cards)</li>
                    <li>• Real-time cache management and force refresh</li>
                    <li>• Enhanced drill-down analysis with custom fields</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <Badge variant="secondary">Version 2.0</Badge>
                  <Badge variant="secondary" className="ml-2">Chart Prompts: 20</Badge>
                  <Badge variant="secondary" className="ml-2">Last Updated: July 27, 2025</Badge>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
