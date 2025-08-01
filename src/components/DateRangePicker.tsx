import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ChevronDown, CalendarDays } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangePickerProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  disabled?: boolean;
}

const DEFAULT_RANGES = [
  {
    label: 'Last 7 Days',
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
      label: 'Last 7 Days'
    })
  },
  {
    label: 'This Week',
    getValue: () => ({
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date()),
      label: 'This Week'
    })
  },
  {
    label: 'Last Week',
    getValue: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return {
        from: startOfWeek(lastWeek),
        to: endOfWeek(lastWeek),
        label: 'Last Week'
      };
    }
  },
  {
    label: 'Last 30 Days',
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
      label: 'Last 30 Days'
    })
  },
  {
    label: 'This Month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
      label: 'This Month'
    })
  },
  {
    label: 'Last Month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
        label: 'Last Month'
      };
    }
  }
];

export default function DateRangePicker({ selectedRange, onRangeChange, disabled = false }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  const handlePresetSelect = (preset: typeof DEFAULT_RANGES[0]) => {
    const range = preset.getValue();
    onRangeChange(range);
    setIsOpen(false);
  };

  const handleCustomRangeApply = () => {
    if (customFromDate && customToDate) {
      const fromDate = new Date(customFromDate);
      const toDate = new Date(customToDate);
      
      if (fromDate <= toDate) {
        onRangeChange({
          from: fromDate,
          to: toDate,
          label: `${format(fromDate, 'MMM dd')} - ${format(toDate, 'MMM dd')}`
        });
        setIsOpen(false);
      }
    }
  };

  const formatRangeDisplay = (range: DateRange) => {
    if (range.label && !range.label.includes(' - ')) {
      return range.label;
    }
    return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd')}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title="Select date range to filter dashboard data by specific time periods"
        className={`flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent/50 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <CalendarDays className="w-4 h-4" />
        <span className="min-w-0 truncate">{formatRangeDisplay(selectedRange)}</span>
        {disabled ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        )}
      </button>

      {isOpen && !disabled && (
        <Card className="absolute right-0 mt-2 w-72 p-4 border border-border rounded-md shadow-lg z-50">
          <div className="space-y-4">
            {/* Preset Ranges */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Quick Select</h4>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_RANGES.map((preset) => {
                  const presetRange = preset.getValue();
                  const isSelected = selectedRange.label === presetRange.label;
                  
                  return (
                    <Button
                      key={preset.label}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="text-xs justify-start"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Custom Range */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Custom Range</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">From Date</label>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To Date</label>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="w-full mt-1 px-2 py-1 text-sm border border-border rounded bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleCustomRangeApply}
                    disabled={!customFromDate || !customToDate}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper function to get default range (last 31 days)
export const getDefaultDateRange = (): DateRange => {
  return {
    from: subDays(new Date(), 31),
    to: new Date(),
    label: 'Last 31 Days'
  };
};
