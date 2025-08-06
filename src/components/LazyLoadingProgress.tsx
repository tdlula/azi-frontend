import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { LazyLoadingState } from '@/hooks/useLazyLoading';

interface LazyLoadingProgressProps {
  loadingState: LazyLoadingState;
  onForceRefresh?: () => void;
  topic: string;
  dateRange: string;
}

const LazyLoadingProgress: React.FC<LazyLoadingProgressProps> = ({
  loadingState,
  onForceRefresh,
  topic,
  dateRange
}) => {
  const currentStage = loadingState.stages[loadingState.currentStage];
  const hasErrors = loadingState.stages.some(stage => stage.error);

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {loadingState.isComplete ? '✅ Dashboard Ready' : '🔄 Loading Dashboard'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {loadingState.isComplete 
                ? `${topic !== 'general' ? topic.charAt(0).toUpperCase() + topic.slice(1) : 'General'} analytics for ${dateRange}` 
                : `Generating ${topic !== 'general' ? topic.charAt(0).toUpperCase() + topic.slice(1) : 'general'} analytics for ${dateRange}...`
              }
            </p>
          </div>
          {(loadingState.isComplete || hasErrors) && (
            <Button
              onClick={onForceRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          )}
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span>{loadingState.overallProgress}%</span>
          </div>
          <Progress value={loadingState.overallProgress} className="h-2" />
        </div>

        {/* Stage Details */}
        <div className="space-y-3">
          {loadingState.stages.map((stage, index) => {
            const isActive = index === loadingState.currentStage;
            const isPast = index < loadingState.currentStage || stage.completed;
            
            return (
              <div 
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-50 border border-blue-200' 
                    : isPast 
                      ? stage.error 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-green-50 border border-green-200'
                      : 'bg-muted/30'
                }`}
              >
                {/* Stage Icon */}
                <div className="flex-shrink-0">
                  {stage.error ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : stage.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : stage.loading ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      isActive ? 'text-blue-700' : 
                      stage.error ? 'text-red-700' :
                      stage.completed ? 'text-green-700' : 'text-muted-foreground'
                    }`}>
                      {stage.name}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {stage.error ? 'Failed' :
                       stage.completed ? 'Complete' :
                       stage.loading ? 'Loading...' : 'Pending'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    stage.error ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {stage.error || stage.description}
                  </p>
                </div>

                {/* Stage Progress for Active Stage */}
                {isActive && stage.loading && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with helpful info */}
        {!loadingState.isComplete && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-700">Loading Strategy</p>
                <p className="text-blue-600 mt-1">
                  We're loading your dashboard in stages for optimal performance. 
                  Metrics load first, followed by AI-generated charts, and finally the word cloud analysis.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {loadingState.isComplete && !hasErrors && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm font-medium text-green-700">
                Dashboard loaded successfully! All components are ready.
              </p>
            </div>
          </div>
        )}

        {/* Error Summary */}
        {hasErrors && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-700">Some components failed to load</p>
                <p className="text-red-600 mt-1">
                  Don't worry - other parts of your dashboard are still available. 
                  Try refreshing to reload the failed components.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LazyLoadingProgress;
