import Chart from "react-apexcharts";

export default function TestChart() {
  const options = {
    chart: {
      type: 'bar' as const,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    xaxis: {
      categories: ['A', 'B', 'C', 'D']
    },
    title: {
      text: 'Test ApexChart'
    }
  };

  const series = [{
    name: 'Test Data',
    data: [30, 40, 35, 50]
  }];

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Chart 
        options={options} 
        series={series} 
        type="bar" 
        height={350} 
      />
    </div>
  );
}