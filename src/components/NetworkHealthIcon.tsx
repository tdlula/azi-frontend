import { useState, useEffect } from "react";
import { Wifi, AlertTriangle, CheckCircle, Activity } from "lucide-react";

interface NetworkHealthMetrics {
  apiStatus: "healthy" | "degraded" | "down";
  responseTime: number;
  systemLoad: number;
  lastUpdated: string;
}

export default function NetworkHealthIcon() {
  const [healthMetrics, setHealthMetrics] = useState<NetworkHealthMetrics>({
    apiStatus: "healthy",
    responseTime: 145,
    systemLoad: 65,
    lastUpdated: new Date().toLocaleTimeString(),
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch health metrics
  const fetchHealthMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/network-health');
      if (response.ok) {
        const data = await response.json();
        setHealthMetrics({
          apiStatus: data.apiStatus,
          responseTime: data.responseTime,
          systemLoad: data.systemLoad,
          lastUpdated: new Date(data.lastUpdated).toLocaleTimeString(),
        });
      } else {
        setHealthMetrics(prev => ({ ...prev, apiStatus: "down" }));
      }
    } catch (error) {
      setHealthMetrics(prev => ({ ...prev, apiStatus: "degraded" }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 15000); // Update every 15 seconds
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
      case "healthy": return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case "degraded": return <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case "down": return <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default: return <Activity className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={fetchHealthMetrics}
        disabled={isLoading}
        className={`p-1.5 sm:p-2 rounded-lg hover:bg-secondary transition-colors ${getStatusColor(healthMetrics.apiStatus)} disabled:opacity-50`}
        title="Network Health Status"
      >
        {isLoading ? (
          <Activity className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
        ) : (
          getStatusIcon(healthMetrics.apiStatus)
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-card border border-border rounded-lg shadow-lg p-3 z-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Network Health</span>
              <span className={`text-xs font-medium ${getStatusColor(healthMetrics.apiStatus)}`}>
                {healthMetrics.apiStatus.charAt(0).toUpperCase() + healthMetrics.apiStatus.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Response:</span>
                <span className="ml-1 text-foreground">{healthMetrics.responseTime}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Load:</span>
                <span className={`ml-1 ${
                  healthMetrics.systemLoad < 50 ? 'text-green-500' :
                  healthMetrics.systemLoad < 80 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {healthMetrics.systemLoad}%
                </span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground pt-1 border-t border-border">
              Updated: {healthMetrics.lastUpdated}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}