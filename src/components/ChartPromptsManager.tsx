// Chart Prompts Component for Frontend Integration
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, BarChart3, Info, Zap } from 'lucide-react';

interface ChartPrompt {
  id: number;
  prompt: string;
}

interface ChartPromptsManagerProps {
  onPromptSelect?: (prompt: string) => void;
  showStats?: boolean;
}

export default function ChartPromptsManager({ onPromptSelect, showStats = true }: ChartPromptsManagerProps) {
  const [prompts, setPrompts] = useState<ChartPrompt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load chart prompts from backend
  const loadChartPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chart-prompts');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Failed to load chart prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load chart prompt statistics
  const loadStats = async () => {
    try {
      const response = await fetch('/api/chart-prompts/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to load chart prompt stats:', error);
    }
  };

  // Load prompts by category
  const loadPromptsByCategory = async (category: string) => {
    setLoading(true);
    try {
      const url = category === 'all' 
        ? '/api/chart-prompts' 
        : `/api/chart-prompts/category/${category}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Failed to load prompts by category:', error);
    } finally {
      setLoading(false);
    }
  };

  // Force dashboard refresh
  const forceRefreshDashboard = async () => {
    try {
  const response = await fetch(`${import.meta.env.VITE_PROD_API_BASE_URL || import.meta.env.VITE_DEV_API_BASE_URL || 'http://129.151.191.161:7000'}/api/dashboard-data?force_refresh=true`);
      if (response.ok) {
        alert('Dashboard refreshed successfully! New charts should now be visible.');
        window.location.reload(); // Refresh page to show new data
      }
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      alert('Failed to refresh dashboard. Please try again.');
    }
  };

  useEffect(() => {
    loadChartPrompts();
    if (showStats) {
      loadStats();
    }
  }, [showStats]);

  const categories = [
    'all', 'sentiment', 'topic', 'geo', 'station', 'engagement', 'time'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Chart Prompts Manager</h2>
          <p className="text-muted-foreground text-sm">
            Manage and explore available chart generation prompts
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={forceRefreshDashboard}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Force Refresh Dashboard
          </Button>
          <Button 
            onClick={loadChartPrompts}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Reload Prompts'}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {showStats && stats && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Prompts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(stats.byCategory || {}).length}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.recentlyAdded?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Recent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">20</div>
              <div className="text-sm text-muted-foreground">Max Available</div>
            </div>
          </div>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedCategory(category);
              loadPromptsByCategory(category);
            }}
            className="capitalize"
          >
            {category === 'all' ? 'All Categories' : category}
          </Button>
        ))}
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">ID: {prompt.id}</Badge>
                {onPromptSelect && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onPromptSelect(prompt.prompt)}
                    className="gap-1"
                  >
                    <Zap className="w-4 h-4" />
                    Use
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {prompt.prompt}
              </p>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  <span>Chart generation prompt for dashboard</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {prompts.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No chart prompts found</p>
            <p className="text-sm">Try selecting a different category or reload prompts</p>
          </div>
        </Card>
      )}

      {loading && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p>Loading chart prompts...</p>
          </div>
        </Card>
      )}
    </div>
  );
}
