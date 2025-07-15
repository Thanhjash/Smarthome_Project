// src/components/SensorOverview.tsx

"use client";

import React, { useMemo } from 'react';
// 💡 SỬA LỖI: Thêm 'Center' vào danh sách import từ chakra-ui
import { SimpleGrid, Card, CardBody, Heading, Text, Box, Skeleton, Fade, Center } from '@chakra-ui/react';
import { FaTemperatureHigh, FaTint, FaSun, FaSmog, FaWind } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useSensorContext } from '@/contexts/SensorDataProvider';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const SensorOverview: React.FC = () => {
  const { temperatureData, humidityData, lightData, mq2Data, mq135Data } = useSensorContext();

  const lineChartData = useMemo(() => {
    const labels = temperatureData.map(data => new Date(data.timestamp).toLocaleTimeString());
    return {
      labels,
      datasets: [
        { 
          label: 'Temperature', 
          data: temperatureData.map(data => data.value || 0), 
          borderColor: 'rgb(255, 99, 132)', 
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          tension: 0.4
        },
        { 
          label: 'Humidity', 
          data: humidityData.map(data => data.value || 0), 
          borderColor: 'rgb(54, 162, 235)', 
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4
        },
        { 
          label: 'Light Level', 
          data: lightData.map(data => data.value || 0), 
          borderColor: 'rgb(255, 206, 86)', 
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          fill: true,
          tension: 0.4
        },
      ],
    };
  }, [temperatureData, humidityData, lightData]);

  const isLoading = temperatureData.length === 0 || humidityData.length === 0 || lightData.length === 0;

  const latestTemperature = temperatureData[temperatureData.length - 1]?.value || 0;
  const latestHumidity = humidityData[humidityData.length - 1]?.value || 0;
  const latestLight = lightData[lightData.length - 1]?.value || 0;
  const latestCO = mq2Data[mq2Data.length - 1]?.co || 0;
  const latestCO2 = mq135Data[mq135Data.length - 1]?.co2 || 0;

  const sensorItems = [
    { name: 'Temperature', icon: FaTemperatureHigh, value: `${latestTemperature.toFixed(1)}°C`, color: 'red.500' },
    { name: 'Humidity', icon: FaTint, value: `${latestHumidity.toFixed(1)}%`, color: 'blue.500' },
    { name: 'Light', icon: FaSun, value: `${latestLight} lux`, color: 'yellow.500' },
    { name: 'CO', icon: FaSmog, value: `${latestCO.toFixed(2)} ppm`, color: 'purple.500' },
    { name: 'CO2', icon: FaWind, value: `${latestCO2.toFixed(2)} ppm`, color: 'green.500' },
  ];

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Sensor Data Overview' },
    },
    scales: {
      x: { display: true, title: { display: true, text: 'Time' } },
      y: { display: true, title: { display: true, text: 'Value' } },
    },
    animation: { duration: 0 }
  }), []);

  return (
    <>
      <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(200px, 1fr))' mb={8}>
        {sensorItems.map((item, index) => (
          <Fade in={!isLoading} key={index}>
            <Card bg='white' color='black' boxShadow="lg" borderRadius="lg" overflow="hidden">
              <CardBody>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Heading size="md" color={item.color}>{item.name}</Heading>
                  <item.icon size='24px' color={item.color} />
                </Box>
                <Text mt={4} fontSize="2xl" fontWeight="bold" color={item.color}>{item.value}</Text>
              </CardBody>
            </Card>
          </Fade>
        ))}
      </SimpleGrid>
      <Box height="400px" mt={8} bg="white" p={4} borderRadius="lg" boxShadow="lg">
        {isLoading ? (
          <Skeleton height="100%" />
        ) : (
          <Line data={lineChartData} options={chartOptions} />
        )}
      </Box>
    </>
  );
};