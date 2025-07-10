import { useState, useEffect } from "react";
import { Wifi, Database, Cpu, Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface NetworkHealthMetrics {
  apiStatus: "healthy" | "degraded" | "down";
  responseTime: number;
  dbConnections: number;
  activeAnalyses: number;
  systemLoad: number;
  lastUpdated: string;
  uptime: string;
  totalRequests: number;
  errorRate: number;
}

export default function NetworkHealthWidget() {
  const [healthMetrics, setHealthMetrics] = useState<NetworkHealthMetrics>({
    apiStatus: "healthy",
    responseTime: 145,
    dbConnections: 12,
    activeAnalyses: 8,
    systemLoad: 65,
    lastUpdated: new Date().toLocaleTimeString(),
    uptime: "99.8%",
    totalRequests: 1247,
    errorRate: 0.2
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real health metrics
  const fetchHealthMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/network-health');
      if (response.ok) {
        const data = await response.json();
        setHealthMetrics({
          apiStatus: data.apiStatus,
          responseTime: data.responseTime,
          dbConnections: data.dbConnections,
          activeAnalyses: data.activeAnalyses,
          systemLoad: data.systemLoad,
          lastUpdated: new Date(data.lastUpdated).toLocaleTimeString(),
          uptime: data.uptime,
          totalRequests: data.totalRequests,
          errorRate: data.errorRate
        });
      } else {
        setHealthMetrics(prev => ({ ...prev, apiStatus: "down" }));
      }
    } catch (error) {
      console.error('Failed to fetch health metrics:', error);
      setHealthMetrics(prev => ({ ...prev, apiStatus: "degraded" }));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and periodic updates
  useEffect(() => {
    fetchHealthMetrics();
    
    const interval = setInterval(() => {
      fetchHealthMetrics();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-500";
      case "degraded": return "text-yellow-500";
      case "down": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-4 h-4" />;
      case "degraded": return <AlertTriangle className="w-4 h-4" />;
      case "down": return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getLoadColor = (load: number) => {
    if (load < 50) return "text-green-500";
    if (load < 80) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className={`p-1.5 sm:p-2 rounded-lg bg-secondary ${getStatusColor(healthMetrics.apiStatus)} flex-shrink-0`}>
            <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">Network Health</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Status: <span className={getStatusColor(healthMetrics.apiStatus)}>
                {healthMetrics.apiStatus.charAt(0).toUpperCase() + healthMetrics.apiStatus.slice(1)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <div className={`${getStatusColor(healthMetrics.apiStatus)}`}>
            {getStatusIcon(healthMetrics.apiStatus)}
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {isExpanded ? "Less" : "More"}
          </span>
        </div>
      </div>

      {/* Quick Status Indicators */}
      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="text-center">
          <div className="text-xs sm:text-sm font-medium text-foreground">{healthMetrics.responseTime}ms</div>
          <div className="text-xs text-muted-foreground">Response</div>
        </div>
        <div className="text-center">
          <div className={`text-xs sm:text-sm font-medium ${getLoadColor(healthMetrics.systemLoad)}`}>
            {healthMetrics.systemLoad}%
          </div>
          <div className="text-xs text-muted-foreground">Load</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-sm font-medium text-foreground">{healthMetrics.activeAnalyses}</div>
          <div className="text-xs text-muted-foreground">Tasks</div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 border-t border-border pt-3 sm:pt-4">
          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                  <Database className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground truncate">DB Connections</span>
                </div>
                <span className="text-xs sm:text-sm font-medium flex-shrink-0">{healthMetrics.dbConnections}/20</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                  <Cpu className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground truncate">Total Requests</span>
                </div>
                <span className="text-xs sm:text-sm font-medium flex-shrink-0">{healthMetrics.totalRequests.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground truncate">Uptime</span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-green-500 flex-shrink-0">{healthMetrics.uptime}</span>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground truncate">Error Rate</span>
                </div>
                <span className="text-xs sm:text-sm font-medium flex-shrink-0">{healthMetrics.errorRate}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground truncate">Last Updated</span>
                </div>
                <span className="text-xs sm:text-sm font-medium flex-shrink-0">{healthMetrics.lastUpdated}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground truncate">AI Analyses</span>
                </div>
                <span className="text-xs sm:text-sm font-medium flex-shrink-0">{healthMetrics.activeAnalyses} running</span>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>System Load</span>
              <span>{healthMetrics.systemLoad}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  healthMetrics.systemLoad < 50 ? 'bg-green-500' :
                  healthMetrics.systemLoad < 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthMetrics.systemLoad}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2 mt-3 sm:mt-4">
            <button 
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={fetchHealthMetrics}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}