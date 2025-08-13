import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row mb-4 gap-2 items-center sm:items-start">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 text-center sm:text-left">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
