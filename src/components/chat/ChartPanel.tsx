import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, BarChart3, LineChart, PieChart, ScatterChart } from "lucide-react";
import type { ChartData } from "@shared/schema";

interface ChartPanelProps {
  chartData: ChartData | null;
  onClose: () => void;
}

export default function ChartPanel({ chartData, onClose }: ChartPanelProps) {
  const chartTypes = [
    { type: "bar", icon: BarChart3, label: "Bar" },
    { type: "line", icon: LineChart, label: "Line" },
    { type: "pie", icon: PieChart, label: "Pie" },
    { type: "scatter", icon: ScatterChart, label: "Scatter" },
  ];

  const colorSchemes = [
    "from-blue-400 to-blue-600",
    "from-green-400 to-green-600",
    "from-purple-400 to-purple-600",
    "from-orange-400 to-red-500",
  ];

  return (
    <div className="w-96 bg-white border-l border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Chart Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Chart Types */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Chart Type</h4>
          <div className="grid grid-cols-2 gap-2">
            {chartTypes.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                variant="outline"
                className="flex flex-col items-center p-3 h-auto hover:border-indigo-500 hover:bg-indigo-50"
              >
                <Icon size={20} className="text-gray-600 mb-1" />
                <span className="text-xs text-gray-700">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Customization Options */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Color Scheme
            </Label>
            <div className="flex space-x-2">
              {colorSchemes.map((scheme, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${scheme} border-2 border-white shadow-sm hover:scale-110 transition-transform`}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Chart Title
            </Label>
            <Input
              type="text"
              placeholder="Enter chart title"
              defaultValue={chartData?.title || ""}
              className="text-sm"
            />
          </div>

          {chartData && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Data Points
              </Label>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {chartData.data.length} data points
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
