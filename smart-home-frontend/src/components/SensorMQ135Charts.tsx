// src/components/SensorMQ135Charts.tsx

"use client";

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useSensorContext } from '@/contexts/SensorDataProvider';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Box, Skeleton } from '@chakra-ui/react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const SensorMQ135Charts: React.FC = () => {
  const { mq135Data } = useSensorContext();

  const lineChartData = useMemo(() => {
    const labels = mq135Data.map(data => new Date(data.timestamp).toLocaleTimeString());
    return {
      labels,
      datasets: [
        {
          label: 'CO2',
          data: mq135Data.map((d) => d.co2 || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'NH3',
          data: mq135Data.map((d) => d.nh3 || 0),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4
        },
      ],
    };
  }, [mq135Data]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'MQ135 Sensor Data' },
    },
    scales: {
      x: { display: true, title: { display: true, text: 'Time' } },
      y: { display: true, title: { display: true, text: 'Value (ppm)' } },
    },
    animation: { duration: 0 }
  }), []);

  const isLoading = mq135Data.length === 0;

  return (
    <Box height="400px" mt={8} bg="white" p={4} borderRadius="lg" boxShadow="lg">
      {isLoading ? (
        <Skeleton height="100%" />
      ) : (
        <Line data={lineChartData} options={chartOptions} />
      )}
    </Box>
  );
};