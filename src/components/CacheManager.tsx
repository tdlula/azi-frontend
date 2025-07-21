import React, { useState } from 'react';
import { clearAllCache, clearThreadCache, getCacheStatus, getEnvironmentInfo } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Info } from 'lucide-react';

export default function CacheManager() {
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [envInfo] = useState(() => getEnvironmentInfo());

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleClearAllCache = async () => {
    setLoading('all');
    try {
      const result = await clearAllCache();
      if (result.success) {
        showMessage('success', result.message);
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to clear cache');
    } finally {
      setLoading(null);
    }
  };

  const handleClearThreadCache = async () => {
    setLoading('thread');
    try {
      const result = await clearThreadCache();
      if (result.success) {
        showMessage('success', result.message);
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to clear thread cache');
    } finally {
      setLoading(null);
    }
  };

  const handleGetStatus = async () => {
    setLoading('status');
    try {
      const result = await getCacheStatus();
      setStatus(result);
      if (result.error) {
        showMessage('error', result.error);
      } else {
        showMessage('success', 'Cache status retrieved');
      }
    } catch (error) {
      showMessage('error', 'Failed to get cache status');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Cache Management
        </CardTitle>
        <CardDescription>
          Manage application caches and view system status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4" />
            <span className="font-medium">Environment Info</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Environment: <Badge variant={envInfo.isDevelopment ? 'default' : 'secondary'}>{envInfo.environment}</Badge></div>
            <div>Mode: <Badge variant="outline">{envInfo.mode}</Badge></div>
            <div className="col-span-2">API Base URL: <code className="text-xs bg-background px-1 rounded">{envInfo.baseUrl || 'Proxy'}</code></div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Cache Actions */}
        <div className="grid gap-3">
          <Button
            onClick={handleClearAllCache}
            disabled={loading !== null}
            variant="destructive"
            className="w-full"
          >
            {loading === 'all' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear All Caches
          </Button>

          <Button
            onClick={handleClearThreadCache}
            disabled={loading !== null}
            variant="outline"
            className="w-full"
          >
            {loading === 'thread' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear Thread Cache Only
          </Button>

          <Button
            onClick={handleGetStatus}
            disabled={loading !== null}
            variant="secondary"
            className="w-full"
          >
            {loading === 'status' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Info className="h-4 w-4 mr-2" />
            )}
            Get Cache Status
          </Button>
        </div>

        {/* Cache Status Display */}
        {status && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Cache Status</h4>
            <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Development:</strong> Uses Vite proxy (no baseURL needed)</p>
          <p><strong>Production:</strong> Uses {envInfo.baseUrl} for API calls</p>
          <p>Cache clearing will affect the production backend when deployed.</p>
        </div>
      </CardContent>
    </Card>
  );
}
