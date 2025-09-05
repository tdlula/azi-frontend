// Dashboard Status Component - Shows chart generation system status
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppConfig } from '@/hooks/useAppConfig';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Settings,
  Zap,
  BarChart3,
  Clock
} from 'lucide-react';

interface DashboardStatusProps {
  onForceRefresh?: () => void;
  chartCount?: number;
  isLoading?: boolean;
}

export default function DashboardStatus({ 
  onForceRefresh, 
  chartCount = 0, 
  isLoading = false 
}: DashboardStatusProps) {
  const { isAdminEnabled } = useAppConfig();
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [promptStats, setPromptStats] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Check system status
  const checkSystemStatus = async () => {
    if (!isAdminEnabled) return; // Don't make API calls if admin features disabled
    
    try {
      // Check chart prompts
      const promptsResponse = await fetch('/api/chart-prompts');
      const promptsData = await promptsResponse.json();
      
      // Check prompt statistics
      const statsResponse = await fetch('/api/chart-prompts/stats');
      const statsData = await statsResponse.json();
      
      setSystemStatus({
        chartsPromptsAvailable: promptsData.count || 0,
        chartsPromptsWorking: promptsResponse.ok,
        statsAvailable: statsData.statistics?.total || 0,
        statsWorking: statsResponse.ok,
        timestamp: new Date()
      });
      
      setPromptStats(statsData.statistics);
    } catch (error) {
      console.error('Failed to check system status:', error);
      setSystemStatus({
        chartsPromptsAvailable: 0,
        chartsPromptsWorking: false,
        statsAvailable: 0,
        statsWorking: false,
        timestamp: new Date()
      });
    }
  };

  // Force complete refresh
  const handleForceRefresh = async () => {
    setLastRefresh(new Date());
    if (onForceRefresh) {
      onForceRefresh();
    }
    
    // Also refresh system status
    setTimeout(() => {
      checkSystemStatus();
    }, 1000);
  };

  useEffect(() => {
    if (isAdminEnabled) {
      checkSystemStatus();
      
      // Check status every 30 seconds
      const interval = setInterval(checkSystemStatus, 70010);
      return () => clearInterval(interval);
    }
  }, [isAdminEnabled]);

  // Don't render anything if admin features are disabled
  if (!isAdminEnabled) {
    return null;
  }

  const getChartSystemStatus = () => {
    if (chartCount >= 6) {
      return {
        status: 'optimal',
        message: 'Chart prompts system working optimally',
        icon: CheckCircle,
        color: 'text-green-600'
      };
    } else if (chartCount >= 3) {
      return {
        status: 'working',
        message: 'System working with fallback charts',
        icon: AlertCircle,
        color: 'text-yellow-600'
      };
    } else {
      return {
        status: 'limited',
        message: 'Limited chart generation - may need refresh',
        icon: AlertCircle,
        color: 'text-red-600'
      };
    }
  };

  const chartStatus = getChartSystemStatus();

  return (
    <Card className="p-4 border-l-4 border-l-primary">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold">Dashboard System Status</h3>
              <p className="text-sm text-muted-foreground">
                Chart generation and integration health
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={checkSystemStatus}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Check Status
            </Button>
            <Button
              onClick={handleForceRefresh}
              variant="default"
              size="sm"
              className="gap-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Force Refresh
            </Button>
          </div>
        </div>

        {/* System Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Chart Count */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-xl font-bold text-primary">{chartCount}</div>
            <div className="text-xs text-muted-foreground">Active Charts</div>
          </div>

          {/* Chart Prompts */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {systemStatus?.chartsPromptsAvailable || 0}
            </div>
            <div className="text-xs text-muted-foreground">Chart Prompts</div>
          </div>

          {/* Categories */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {promptStats?.byCategory ? Object.keys(promptStats.byCategory).length : 0}
            </div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>

          {/* System Health */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <chartStatus.icon className={`w-5 h-5 ${chartStatus.color}`} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">System Health</div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2">
          <div className={`flex items-center gap-2 p-2 rounded-lg bg-muted/20`}>
            <chartStatus.icon className={`w-4 h-4 ${chartStatus.color}`} />
            <span className="text-sm">{chartStatus.message}</span>
            <Badge variant="secondary" className="ml-auto">
              {chartStatus.status}
            </Badge>
          </div>

          {lastRefresh && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Integration Tips */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                Chart Generation System
              </p>
              <ul className="text-blue-600 dark:text-blue-400 space-y-1 text-xs">
                <li>• Charts are generated using {systemStatus?.chartsPromptsAvailable || 20} curated prompts</li>
                <li>• Dashboard shows 6-8 diverse charts from different categories</li>
                <li>• Cache refreshes every 4 hours or with force refresh</li>
                <li>• Geo charts now show enhanced data fields</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {chartCount < 6 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                  Optimization Available
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs mb-2">
                  Your dashboard is showing {chartCount} charts. Force refresh to get up to 6-8 charts using the new system.
                </p>
                <Button
                  onClick={handleForceRefresh}
                  size="sm"
                  variant="outline"
                  className="gap-1 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  disabled={isLoading}
                >
                  <Zap className="w-3 h-3" />
                  Optimize Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
