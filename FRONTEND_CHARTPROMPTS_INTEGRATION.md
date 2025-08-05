# Frontend Updates for chartPrompts.json Integration

## Overview
Updated the azi-frontend dashboard-minimal.tsx and related components to support the new enhanced chart data format from the backend's chartPrompts.json system.

## Files Modified

### 1. `/src/schemas/dashboardSchema.ts`
**Changes:**
- Enhanced `ChartDataSchema` to support both simple array and complex object data formats
- Added `EnhancedMetadataSchema` with comprehensive metadata fields from chartPrompts.json
- Added optional `chart_type` field for backward compatibility
- Updated data union type to handle complex chart formats (line, radar)

**New Features:**
- Support for `{labels: [], datasets: []}` format (line/radar charts)
- Rich metadata including: topic, analysis_period, source_count, scoring_criteria, etc.
- Backward compatibility with legacy metadata fields

### 2. `/src/components/charts/ChartRenderer.tsx`
**Major Updates:**
- **Enhanced Data Format Detection**: Automatically detects simple array vs complex object formats
- **Improved Line Chart Support**: Handles both legacy array format and new complex format with multiple datasets
- **Enhanced Radar Chart Support**: Full support for complex data format with multiple series
- **Robust Data Processing**: Better error handling and data normalization
- **Dynamic Chart Configuration**: Adapts chart options based on data format

**Key Improvements:**
```typescript
// Complex format detection
if (!Array.isArray(chartData.data) && 
    chartData.data.labels && 
    chartData.data.datasets) {
  // Use complex format
} else {
  // Use simple array format
}
```

**Chart Type Enhancements:**
- **Line Charts**: Support for multiple datasets with individual colors and labels
- **Radar Charts**: Multi-series support for station performance comparison
- **Validation**: Enhanced validation for both data formats

### 3. `/src/pages/dashboard-minimal.tsx`
**Enhanced Chart Normalization:**
- Updated `normalizeChartData()` function to handle both data formats
- Improved type detection using both `type` and `chart_type` fields
- Better error handling and fallback mechanisms

**New Features:**
- **Metadata Display Component**: Collapsible metadata panel showing:
  - Topic and analysis period
  - Source counts (call-ins, WhatsApp, presenter segments)
  - Scoring criteria and metrics
  - Data quality indicators
- **Enhanced Chart Processing**: Proper handling of complex chart data structures

## New Chart Data Format Support

### Simple Format (Donut, Bar, Pie)
```json
{
  "chart_type": "donut",
  "type": "donut",
  "title": "Sentiment Analysis: Shoprite",
  "data": [
    {"label": "Positive", "value": 65.2, "color": "#4CAF50"},
    {"label": "Neutral", "value": 24.8, "color": "#FF9800"},
    {"label": "Negative", "value": 10.0, "color": "#F44336"}
  ],
  "metadata": {
    "topic": "Shoprite",
    "analysis_period": {"start_date": "2025-08-01", "end_date": "2025-08-05"},
    "source_count": {"call_ins": 45, "whatsapp_feedback": 23, "presenter_segments": 12},
    "total_entries_analyzed": 80
  }
}
```

### Complex Format (Line, Radar)
```json
{
  "chart_type": "line",
  "type": "line", 
  "title": "Hourly Sentiment Trends: Shoprite",
  "data": {
    "labels": ["09:00", "10:00", "11:00", "12:00"],
    "datasets": [
      {
        "label": "Positive Sentiment %",
        "data": [65.2, 72.1, 68.5, 70.3],
        "color": "#4CAF50"
      },
      {
        "label": "3-hour Moving Average", 
        "data": [65.2, 68.7, 68.6, 69.0],
        "color": "#2196F3"
      }
    ]
  },
  "metadata": {
    "topic": "Shoprite",
    "smoothing_method": "3-hour moving average",
    "total_mentions_analyzed": 156
  }
}
```

## Backward Compatibility

### Legacy Support
- ✅ Existing simple array format continues to work
- ✅ Old metadata fields still supported
- ✅ Chart types remain the same
- ✅ No breaking changes to existing API

### Migration Path
1. **Automatic Detection**: Frontend automatically detects data format
2. **Graceful Fallbacks**: Missing fields use sensible defaults
3. **Progressive Enhancement**: New metadata displayed when available

## UI Enhancements

### Metadata Display
- **Collapsible Panel**: Shows enhanced metadata without cluttering interface
- **Contextual Information**: Displays relevant metrics per chart type
- **Data Provenance**: Shows analysis sources and criteria
- **Time Period**: Clear indication of analyzed time range

### Chart Improvements
- **Multi-Series Support**: Line and radar charts support multiple datasets
- **Enhanced Colors**: Dynamic color assignment for multiple series
- **Better Tooltips**: Improved information display on hover
- **Interactive Elements**: Maintained click-to-drill functionality

## Testing Recommendations

### Chart Types to Test
1. **Donut Chart**: Sentiment distribution with source counts
2. **Line Chart**: Multi-dataset with moving averages
3. **Bar Chart**: Content format performance with scoring criteria
4. **Radar Chart**: Multi-station performance comparison

### Data Scenarios
1. **Legacy Format**: Existing simple array data
2. **New Complex Format**: Labels + datasets structure
3. **Mixed Metadata**: Combination of old and new metadata fields
4. **Error Handling**: Invalid or missing data scenarios

## Benefits

### For Users
- **Richer Context**: More detailed information about chart data
- **Data Transparency**: Clear indication of analysis sources and methods
- **Better Insights**: Enhanced metadata helps interpret results

### For Developers
- **Type Safety**: Strong typing for both data formats
- **Maintainability**: Clean separation of simple vs complex chart handling
- **Extensibility**: Easy to add new chart types and metadata fields
- **Backward Compatibility**: No disruption to existing functionality

## Future Enhancements

### Potential Additions
1. **Metadata Filtering**: Filter charts by metadata criteria
2. **Export Enhancement**: Include metadata in exports
3. **Validation Indicators**: Visual indicators for data quality metrics
4. **Real-time Updates**: Live metadata updates as data changes

### Chart Types
1. **Heatmap**: Time-based analysis with enhanced metadata
2. **Treemap**: Hierarchical data with drill-down capabilities
3. **Funnel**: Process visualization with stage metadata
