// Settings/Admin Page for Chart Management
import React, { useState } from 'react';
import { useLocation } from 'wouter';
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
  const [, setLocation] = useLocation();
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
  await fetch(`${import.meta.env.VITE_PROD_API_BASE_URL || import.meta.env.VITE_DEV_API_BASE_URL || 'http://129.151.191.161:5000'}/api/dashboard-data?force_refresh=true`);
      
      // You could also add backend cache clearing endpoint
      // await fetch('/api/clear-cache', { method: 'POST' });
      
      alert('Caches cleared successfully! Dashboard will reload with fresh data.');
      setLocation('/dashboard-minimal');
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
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage chart prompts, system health, and dashboard configuration
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setLocation('/dashboard-minimal')}
              variant="outline"
              className="flex-1 sm:flex-none text-xs sm:text-sm touch-target"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        <Tabs defaultValue="chart-prompts" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
            <TabsTrigger value="chart-prompts" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 touch-target">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Chart Prompts</span>
              <span className="xs:hidden">Charts</span>
            </TabsTrigger>
            <TabsTrigger value="system-health" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 touch-target">
              <Database className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">System Health</span>
              <span className="xs:hidden">Health</span>
            </TabsTrigger>
            <TabsTrigger value="cache-management" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 touch-target">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Cache Management</span>
              <span className="xs:hidden">Cache</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 touch-target">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">About</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
          </TabsList>

          {/* Chart Prompts Management */}
          <TabsContent value="chart-prompts">
            <ChartPromptsManager showStats={true} />
          </TabsContent>

          {/* System Health */}
          <TabsContent value="system-health">
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">API Endpoints Health Check</h3>
                  <Button 
                    onClick={testEndpoints}
                    disabled={loading}
                    className="gap-2 w-full sm:w-auto text-xs sm:text-sm touch-target"
                  >
                    {loading ? (
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    Test Endpoints
                  </Button>
                </div>

                {systemInfo && (
                  <div className="space-y-3">
                    {systemInfo.map((result: any, index: number) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          {result.ok ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{result.endpoint}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                              Status: {result.status} | 
                              {result.data?.count && ` Items: ${result.data.count} |`}
                              {result.data?.prompts?.length && ` Prompts: ${result.data.prompts.length} |`}
                              {result.error && ` Error: ${result.error}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={result.ok ? "default" : "destructive"} className="flex-shrink-0">
                          {result.ok ? "OK" : "Error"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {!systemInfo && !loading && (
                  <div className="text-center text-muted-foreground py-6 sm:py-8">
                    <Database className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Click "Test Endpoints" to check system health</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Cache Management */}
          <TabsContent value="cache-management">
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4">Cache Management</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm sm:text-base">Dashboard Data Cache</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Cached for 4 hours (backend) and 5 minutes (frontend)
                        </p>
                      </div>
                      <Button onClick={clearCaches} className="gap-2 w-full sm:w-auto text-xs sm:text-sm touch-target">
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                        Clear All Caches
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm sm:text-base">Chart Prompts Export</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Download current chart prompts configuration
                        </p>
                      </div>
                      <Button onClick={exportChartPrompts} variant="outline" className="gap-2 w-full sm:w-auto text-xs sm:text-sm touch-target">
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
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
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">About AZI Radio Analytics Platform</h3>
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Chart Generation System</h4>
                  <p className="text-muted-foreground">
                    The platform uses a centralized chart prompts system with 20 curated prompts 
                    covering topics, sentiment, geo analysis, engagement metrics, and more. 
                    Charts are generated using OpenAI's analysis of radio transcript data.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Data Sources</h4>
                  <p className="text-muted-foreground">
                    Radio transcripts from local radio stations , analyzed for 
                    sentiment, topics, brand mentions, and audience engagement patterns.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Recent Updates</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Enhanced geo sentiment charts with detailed region data</li>
                    <li>• Centralized chart prompt management system</li>
                    <li>• Improved dashboard grid layout (6 cards)</li>
                    <li>• Real-time cache management and force refresh</li>
                    <li>• Enhanced drill-down analysis with custom fields</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">Version 2.0</Badge>
                    <Badge variant="secondary" className="text-xs">Chart Prompts: 20</Badge>
                    <Badge variant="secondary" className="text-xs">Last Updated: July 27, 2025</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
