import { AlertTriangle, Wifi, WifiOff, RefreshCw, Server, Clock } from 'lucide-react';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function BackendConnectionStatus() {
  const { 
    isConnected, 
    isLoading, 
    error, 
    lastChecked, 
    retryCount, 
    responseTime,
    refetch,
    isMaxRetriesReached 
  } = useBackendHealth();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Wifi className="h-4 w-4" />
        <span>Backend Connected</span>
        {responseTime && (
          <Badge variant="outline" className="text-xs">
            {responseTime}ms
          </Badge>
        )}
      </div>
    );
  }

  if (isLoading && !error) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Connecting to backend...</span>
      </div>
    );
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        Backend Connection Error
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <div>
          <p className="font-medium">Unable to connect to the Azi Analytics backend server.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span>Retry attempts: {retryCount}</span>
          </div>
          {lastChecked && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="font-medium">Possible solutions:</div>
          <ul className="list-disc list-inside space-y-1 text-sm ml-4">
            <li>Ensure the backend server is running on port 5000</li>
            <li>Check your network connection</li>
            <li>Verify no firewall is blocking the connection</li>
            <li>Try refreshing the page or restarting the backend</li>
          </ul>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={refetch} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
          
          {isMaxRetriesReached && (
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              size="sm"
            >
              Reload Page
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function BackendConnectionBanner() {
  const { isConnected, isLoading } = useBackendHealth();

  if (isConnected || isLoading) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <WifiOff className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700 dark:text-red-200">
            Backend server is not available. Some features may not work properly.
          </p>
        </div>
      </div>
    </div>
  );
}