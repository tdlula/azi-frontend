import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
  title?: string;
  height?: string;
}

export default function ErrorFallback({ 
  error = "Something went wrong", 
  onRetry, 
  title = "Error",
  height = "h-64"
}: ErrorFallbackProps) {
  return (
    <div className={`flex items-center justify-center ${height} text-red-500`}>
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm mt-1">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} className="mt-4" size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}