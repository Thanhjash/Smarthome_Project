"use client";

import React from 'react';
import { VStack, HStack, Box, Text, Badge, Card, CardHeader, CardBody } from '@chakra-ui/react';
import { useSensorContext } from '@/contexts/SensorDataProvider';
import { SensorOverview } from '@/components/SensorOverview';
import { SensorMQ2Charts } from '@/components/SensorMQ2Charts';
import { SensorMQ135Charts } from '@/components/SensorMQ135Charts';
import { DeviceStatus } from '@/components/DeviceStatus';
import { DeviceControl } from '@/components/DeviceControl';

const SensorDashboardPage: React.FC = () => {
  const { 
    temperatureData, 
    humidityData, 
    lightData, 
    mq2Data, 
    mq135Data, 
    deviceStatus,
    isConnected 
  } = useSensorContext();

  return (
    <VStack spacing={6} align="stretch">
      {/* Debug Info Card */}
      <Card>
        <CardHeader>
          <Text fontSize="lg" fontWeight="bold">Connection & Data Status</Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="start">
            <HStack>
              <Text>MQTT Connected:</Text>
              <Badge colorScheme={isConnected ? 'green' : 'red'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </HStack>
            
            <HStack wrap="wrap" spacing={4}>
              <Text>Temperature: <strong>{temperatureData.length}</strong> points</Text>
              <Text>Humidity: <strong>{humidityData.length}</strong> points</Text>
              <Text>Light: <strong>{lightData.length}</strong> points</Text>
              <Text>MQ2: <strong>{mq2Data.length}</strong> points</Text>
              <Text>MQ135: <strong>{mq135Data.length}</strong> points</Text>
            </HStack>

            {/* Latest Values */}
            <Box>
              <Text fontWeight="bold" mb={2}>Latest Sensor Values:</Text>
              <HStack wrap="wrap" spacing={4}>
                <Text>Temp: {temperatureData[temperatureData.length - 1]?.value?.toFixed(1) || 'N/A'}°C</Text>
                <Text>Humidity: {humidityData[humidityData.length - 1]?.value?.toFixed(1) || 'N/A'}%</Text>
                <Text>Light: {lightData[lightData.length - 1]?.value?.toFixed(1) || 'N/A'} lux</Text>
                <Text>CO2: {mq135Data[mq135Data.length - 1]?.co2?.toFixed(1) || 'N/A'} ppm</Text>
                <Text>Smoke: {mq2Data[mq2Data.length - 1]?.smoke?.toFixed(1) || 'N/A'}</Text>
              </HStack>
            </Box>

            {/* Device Status */}
            <Box>
              <Text fontWeight="bold" mb={2}>Device Status:</Text>
              <HStack wrap="wrap" spacing={4}>
                <Badge colorScheme={deviceStatus.led ? 'green' : 'gray'}>
                  LED: {deviceStatus.led ? 'ON' : 'OFF'}
                </Badge>
                <Badge colorScheme={deviceStatus.autoMode ? 'blue' : 'gray'}>
                  Auto: {deviceStatus.autoMode ? 'ON' : 'OFF'}
                </Badge>
                <Text>Fan: {deviceStatus.fanSpeed}</Text>
                <Text>Ventilation: {deviceStatus.ventilationSpeed}</Text>
              </HStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Original Components */}
      <SensorOverview />
      <SensorMQ2Charts />
      <SensorMQ135Charts />
      <DeviceControl />
      <DeviceStatus />
    </VStack>
  );
};

export default SensorDashboardPage;