import React from 'react';
import ChartRenderer from '../charts/ChartRenderer';

export default function ChatChartRender({ chartData }: { chartData: any }) {
  if (!chartData) return null;
  return (
    <div className="chat-chart-container my-4">
      <ChartRenderer chartData={chartData} />
    </div>
  );
}
