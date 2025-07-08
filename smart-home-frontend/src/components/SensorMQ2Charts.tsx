"use client";

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useSensorData } from '@/hooks/useSensorData';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import { Card as ChakraCard, CardBody, Box, Text, Skeleton, Fade, Heading } from '@chakra-ui/react';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

export const SensorMQ2Charts: React.FC = () => {
  const { mq2Data } = useSensorData();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (mq2Data.length > 0) {
      setIsLoading(false);
    }
  }, [mq2Data]);

  const data = {
    labels: mq2Data.map((data) => data.timestamp),
    datasets: [
      {
        label: 'Smoke',
        data: mq2Data.map((data) => data.smoke),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: 'CO',
        data: mq2Data.map((data) => data.co),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: 'LPG',
        data: mq2Data.map((data) => data.lpg),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'MQ2 Sensor Data',
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time',
        },
        grid: {
          display: true,
          drawBorder: true,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value (ppm)',
        },
        suggestedMax: 1000, // Điều chỉnh giá trị này nếu cần
        ticks: {
          stepSize: 25, // Điều chỉnh giá trị này để có số lượng vạch chia phù hợp
        },
        grid: {
          display: true,
          drawBorder: true,
        },
      },
    },
    animation: {
      duration: 0 // Tắt animation để cải thiện hiệu suất khi có nhiều dữ liệu
    },
    elements: {
      line: {
        tension: 0 // Sử dụng đường thẳng thay vì đường cong
      }
    }
  };

  return (
    <ChakraCard bg='white' color='black' boxShadow="lg" borderRadius="lg" overflow="hidden">
      <CardBody>
        <Heading size="md" mb={4}>MQ2 Sensor Data</Heading>
        <Box flex='1' height="100%"> 
          <Fade in={!isLoading}>
            {isLoading ? (
              <Skeleton height="100%" />
            ) : data.labels.length > 0 ? (
              <Line data={data} options={options} />
            ) : (
              <Text>Waiting for data...</Text>
            )}
          </Fade>
        </Box>
      </CardBody>
    </ChakraCard>
  );
};